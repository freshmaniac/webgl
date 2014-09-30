//
// Demo of matrix transformations.  An output area in the html page
// shows the matrices that were multiplied together to get the
// current transformation being applied to the triangle.  The drawing
// and shader code is the same as Transformations.js, what's been
// added are the html controls for selecting the transformation and
// the corresponding event handling code to update the 
// transformation matrix.
//
// Note also that instead of explicitly listing 16 numbers to represent a matrix, 
// this uses the type Matrix4 (and Vector4) from
// the teal book utilities in cuon-matrix.js, for example:
//
//   var m = new Matrix4(); // identity matrix
//   m.setTranslate(0.3, 0.0, 0.0);  // make it into a translation matrix
//   var m2 = new Matrix4();
//   m2.setRotate(90, 0, 0, 1); // rotate 90 degrees in x-y plane
//   m.multiply(m2);  // multiply m on right by m2, i.e., m = m * m2;
//   Float32Array theRealData = m.elements;  // get the underlying float array
//


// Raw data for some point positions.
var numPoints = 3;
var vertices = new Float32Array([
	0.0, 0.0,
	0.3, 0.0,
	0.3, 0.2,
]
);

var numAxisPoints = 4;
var axisVertices = new Float32Array([
	-0.9, 0.0,
	0.9, 0.0,
	0.0, -0.9,
	0.0, 0.9
]);


// A few global variables...

// the OpenGL context
var gl;

// handle to a buffer on the GPU
var vertexbuffer;
var axisbuffer;

// handle to the compiled shader program on the GPU
var shader;

// a transformation matrix
var modelMatrix = new Matrix4();
var previousModelMatrix = new Matrix4();

// a string showing the transformations
var transformations = "";

function makeReflection(slope, intercept) {
	var angle = Math.atan(slope) * 180 / Math.PI;
	
	var axisTransform = new Matrix4().translate(0, intercept, 0).rotate(angle, 0, 0, 1);

	return new Matrix4()
		.set(axisTransform)
		.scale(1, -1, 1)
		.concat(axisTransform.invert());
}

// create a matrix that translates to the figure's centroid (geometric center)
function getTranslationToCentroid() {
	// get the three vertices and multiply by the current transformation matrix
	// to see where they are now
	var v1 = new Vector4([vertices[0], vertices[1], 0.0, 1.0]);
	v1 = modelMatrix.multiplyVector4(v1);
	var v2 = new Vector4([vertices[2], vertices[3], 0.0, 1.0]);
	v2 = modelMatrix.multiplyVector4(v2);
	var v3 = new Vector4([vertices[4], vertices[5], 0.0, 1.0]);
	v3 = modelMatrix.multiplyVector4(v3);


	// find centroid of given vertices (average of x's, average of y's)
	var cx = (v1.elements[0] + v2.elements[0] + v3.elements[0]) / 3;
	var cy = (v1.elements[1] + v2.elements[1] + v3.elements[1]) / 3;

	// set translational part (last column) of matrix
	var ret = new Matrix4();
	ret.elements[12] = cx;
	ret.elements[13] = cy;
	ret.elements[14] = cy;

	return ret;
}

// translate keypress events to strings
// from http://javascript.info/tutorial/keyboard-events
function getChar(event) {
	if (event.which == null) {
		return String.fromCharCode(event.keyCode) // IE
	} else if (event.which != 0 && event.charCode != 0) {
		return String.fromCharCode(event.which)   // the rest
	} else {
		return null // special key
	}
}

// handler for key press events will update modelMatrix based
// on key press and radio button state
function handleKeyPress(event) {
	var ch = getChar(event);

	// create a new matrix and a text string that represents it
	var m = new Matrix4();
	drawLine = false;
	var text = "I";
	switch (ch) {
		case "r":
			m.setRotate(30, 0, 0, 1);
			text = "R";
			break;
		case "R":
			m.setRotate(-30, 0, 0, 1);
			text = "R'";
			break;
		case "t":
			m.setTranslate(0.3, 0.0, 0.0);
			text = "T";
			break;
		case "T":
			m.setTranslate(-0.3, 0.0, 0.0);
			text = "T'";
			break;
		case "s":
			m.setScale(1, 2, 1);
			text = "S";
			break;
		case "S":
			m.setScale(1, 1 / 2, 1);
			text = "S'";
			break;
		case "x":
			m.setScale(1, -1, 1);
			text = "X";
			break;
		case "l":
			var slope = parseFloat(document.getElementById("slopeBox").value);
			var intercept = parseFloat(document.getElementById("interceptBox").value);
			
			m = makeReflection(slope, intercept);

			text = "BXB'";
			break;

		case "o":
			// reset global transformation matrix
			modelMatrix = m;
			text = "I";
			break;
		default:
			// invalid key
			return;
	}


	// if we're doing a rotate or scale with respect to the centroid,
	// replace m with A * m * A-inverse, where A is translation to centroid
	if (document.getElementById("checkCentroid").checked &&
		text !== "I" && text !== "T" && text !== "T'" && text !== "X" && text !== "BXB'") {
		var a = getTranslationToCentroid()
		var aInverse = new Matrix4();
		aInverse.elements[12] = -a.elements[12];
		aInverse.elements[13] = -a.elements[13];
		aInverse.elements[14] = -a.elements[14];
		m = a.multiply(m).multiply(aInverse)
		text = "A" + text + "A'";
	}

	// update text string to display
	if (text === "I" || transformations === "I") {
		transformations = text;
	}
	else {
		if (document.getElementById("checkIntrinsic").checked) {
			// add current text to end of string
			transformations += text;
			console.log("Intrinsic");
		}
		else {
			// add to beginning of string
			transformations = text + transformations;
			console.log("Extrinsic");
		}
	}

	// update output window using transformation string
	var outputWindow = document.getElementById("displayMatrices");
	outputWindow.innerHTML = transformations;
	console.log(transformations);

	// update current matrix, save previous one
	previousModelMatrix = modelMatrix;
	if (document.getElementById("checkIntrinsic").checked) {
		// multiply on right by m
		modelMatrix.multiply(m);
	}
	else {
		// multiply on the left by m
		modelMatrix = m.multiply(modelMatrix);
	}
}

// code to actually render our geometry
function draw() {
	gl.clear(gl.COLOR_BUFFER_BIT);

	// bind the shader and get the indices we need
	gl.useProgram(shader);
	var positionIndex = gl.getAttribLocation(shader, 'a_Position');
	var colorLoc = gl.getUniformLocation(shader, "color");
	var transformLoc = gl.getUniformLocation(shader, "transform");

	// draw line segments for axes, colored black using identity transform
	gl.bindBuffer(gl.ARRAY_BUFFER, axisbuffer);
	gl.enableVertexAttribArray(positionIndex);
	gl.vertexAttribPointer(positionIndex, 2, gl.FLOAT, false, 0, 0);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);
	gl.uniform4f(colorLoc, 0.0, 0.0, 0.0, 1.0);  // black
	gl.uniformMatrix4fv(transformLoc, false, new Matrix4().elements); // identity
	gl.drawArrays(gl.LINES, 0, numAxisPoints);

	// maybe draw line for reflection
	if (document.getElementById("checkDrawLine").checked) {
		var slope = parseFloat(document.getElementById("slopeBox").value);
		var intercept = parseFloat(document.getElementById("interceptBox").value);
		var angle = Math.atan(slope) * 180 / Math.PI;

		// we'll just re-draw the x-axis, extended and transformed to match slope and intercept
		var b = new Matrix4().translate(0, intercept, 0).rotate(angle, 0, 0, 1).scale(2, 1, 1);

		gl.bindBuffer(gl.ARRAY_BUFFER, axisbuffer);
		gl.enableVertexAttribArray(positionIndex);
		gl.vertexAttribPointer(positionIndex, 2, gl.FLOAT, false, 0, 0);
		gl.bindBuffer(gl.ARRAY_BUFFER, null);
		gl.uniform4f(colorLoc, 0.0, 1.0, 0.0, 1.0);  // green
		gl.uniformMatrix4fv(transformLoc, false, b.elements); // transform with matrix b
		gl.drawArrays(gl.LINES, 0, 2);

	}


	// draw a grey triangle using previous modelMatrix
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexbuffer);
	gl.vertexAttribPointer(positionIndex, 2, gl.FLOAT, false, 0, 0);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);
	gl.uniform4f(colorLoc, 0.8, 0.8, 0.8, 1.0); // grey
	gl.uniformMatrix4fv(transformLoc, false, previousModelMatrix.elements);
	gl.drawArrays(gl.TRIANGLES, 0, numPoints);


	// draw the triangle red, using current modelMatrix
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexbuffer);
	gl.vertexAttribPointer(positionIndex, 2, gl.FLOAT, false, 0, 0);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);
	gl.uniform4f(colorLoc, 1.0, 0.0, 0.0, 1.0); // red
	gl.uniformMatrix4fv(transformLoc, false, modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLES, 0, numPoints);

	// unbind shader and "disable" the attribute indices
	// (not really necessary when there is only one shader)
	gl.disableVertexAttribArray(positionIndex);
	gl.useProgram(null);

}

// entry point when page is loaded
function main() {
	// retrieve <canvas> element
	var canvas = document.getElementById('theCanvas');

	// attach key handler
	window.onkeypress = handleKeyPress;

	// get the rendering context for WebGL, using the utility from the teal book
	gl = getWebGLContext(canvas);
	if (!gl) {
		console.log('Failed to get the rendering context for WebGL');
		return;
	}

	// load and compile the shader pair, using utility from the teal book
	var vshaderSource = document.getElementById('vertexShader').textContent;
	var fshaderSource = document.getElementById('fragmentShader').textContent;
	if (!initShaders(gl, vshaderSource, fshaderSource)) {
		console.log('Failed to intialize shaders.');
		return;
	}
	shader = gl.program;
	gl.useProgram(null);

	// buffer for triangle
	vertexbuffer = gl.createBuffer();
	if (!vertexbuffer) {
		console.log('Failed to create the buffer object');
		return;
	}
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexbuffer);
	gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);

	// another buffer for the axes
	axisbuffer = gl.createBuffer();
	if (!axisbuffer) {
		console.log('Failed to create the buffer object');
		return;
	}
	gl.bindBuffer(gl.ARRAY_BUFFER, axisbuffer);
	gl.bufferData(gl.ARRAY_BUFFER, axisVertices, gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);


	// specify a fill color for clearing the framebuffer
	gl.clearColor(0.0, 0.8, 0.8, 1.0);

	// define an animation loop
	var animate = function () {
		draw();
		requestAnimationFrame(animate, canvas);
	};

	// start drawing!
	animate();


}