// Similar to GL_example3, but applies the scaling transformation
// using a matrix in the vertex shader.  (The only modified code
// is in the draw() function and in the vertex shader.)
//
// Uses the type Matrix4 from the teal book utilities in cuon-matrix.js. 
//
// Usage example for Matrix4:
//
//   var m = new Matrix4(); // identity matrix
//   m.setTranslate(0.3, 0.0, 0.0);  // make it into a translation matrix
//   var m2 = new Matrix4().setRotate(90, 0, 0, 1);  // create and make rotation in one step
//                                                // (rotate 90 degrees in x-y plane)
//   m.multiply(m2);  // multiply m on right by m2, i.e., m = m * m2;
//   Float32Array theRealData = m.elements;  // get the underlying float array
//                                              (this part is sent to shader)
// 
//   Alternatively, can chain up the operations:
// 
//   var m = new Matrix4().setTranslate(0.3, 0.0, 0.0).rotate(90, 0, 0, 1);
//


// Raw data for some point positions - this will be a square, consisting
// of two triangles.  We provide two values per vertex for the x and y coordinates
// (z will be zero by default).

var numPoints = 6;
var vertices = new Float32Array([
	-0.5, -0.5,
	0.5, -0.5,
	0.5, 0.5,
	-0.5, -0.5,
	0.5, 0.5,
	-0.5, 0.5
]
);


// A few global variables...

// the OpenGL context
var gl;

// handle to a buffer on the GPU
var vertexbuffer;

// handle to the compiled shader program on the GPU
var shader;


// code to actually render our geometry
function draw(angle) {
	// clear the framebuffer
	gl.clear(gl.COLOR_BUFFER_BIT);

	// bind the shader
	gl.useProgram(shader);

	// bind the buffer
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexbuffer);

	// get the index for the a_Position attribute defined in the vertex shader
	var positionIndex = gl.getAttribLocation(shader, 'a_Position');
	if (positionIndex < 0) {
		console.log('Failed to get the storage location of a_Position');
		return;
	}

	// "enable" the a_position attribute 
	gl.enableVertexAttribArray(positionIndex);

	// associate the data in the currently bound buffer with the a_position attribute
	// (The '2' specifies there are 2 floats per vertex in the buffer.  Don't worry about
	// the last three args just yet.)
	gl.vertexAttribPointer(positionIndex, 2, gl.FLOAT, false, 0, 0);

	// we can unbind the buffer now (not really necessary when there is only one buffer)
	gl.bindBuffer(gl.ARRAY_BUFFER, null);

	// set the value of the uniform variable in the shader and draw
	var transformLoc = gl.getUniformLocation(shader, "transform");
	
	var greatCircleRads = angle / 180 * Math.PI;
	var rotationAngle = -2 * angle;
	
	var greatCircleX = 0.75 * Math.cos(greatCircleRads);
	var greatCircleY = 0.75 * Math.sin(greatCircleRads);
	
	var modelMatrix1 = new Matrix4()
		.translate(greatCircleX, greatCircleY, 0)
		.rotate(rotationAngle, 0, 0, 1)
		.scale(0.4, 0.15, 1.0);
	
	var modelMatrix2 = new Matrix4()
		.translate(greatCircleX, greatCircleY, 0)
		.rotate(rotationAngle, 0, 0, 1)
		.scale(0.15, 0.4, 1.0);
	
	gl.uniformMatrix4fv(transformLoc, false, modelMatrix1.elements);
	gl.drawArrays(gl.TRIANGLES, 0, numPoints);
	
	gl.uniformMatrix4fv(transformLoc, false, modelMatrix2.elements);
	gl.drawArrays(gl.TRIANGLES, 0, numPoints);

	// unbind shader and "disable" the attribute indices
	// (not really necessary when there is only one shader)
	gl.disableVertexAttribArray(positionIndex);
	gl.useProgram(null);

}

// entry point when page is loaded
function main() {

	// basically this function does setup that "should" only have to be done once,
	// while draw() does things that have to be repeated each time the canvas is 
	// redrawn	

	// retrieve <canvas> element
	var canvas = document.getElementById('theCanvas');

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

	// retain a handle to the shader program, then unbind it
	// (This looks odd, but the way initShaders works is that it "binds" the shader and
	// stores the handle in an extra property of the gl object.  That's ok, but will really
	// mess things up when we have more than one shader pair.)
	shader = gl.program;
	gl.useProgram(null);

	// request a handle for a chunk of GPU memory
	vertexbuffer = gl.createBuffer();
	if (!vertexbuffer) {
		console.log('Failed to create the buffer object');
		return;
	}

	// "bind" the buffer as the current array buffer
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexbuffer);

	// load our data onto the GPU (uses the currently bound buffer)
	gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

	// now that the buffer is filled with data, we can unbind it
	// (we still have the handle, so we can bind it again when needed)
	gl.bindBuffer(gl.ARRAY_BUFFER, null);

	// specify a fill color for clearing the framebuffer
	gl.clearColor(0.0, 0.8, 0.8, 1.0);

	// set up an animation loop in which the scale grows to 1.5 and shrinks
	// to 0.5, incrementing by 0.05 each frame
	var angle = 0;
	var increment = 1;
	var animate = function () {
		draw(angle);
		angle += increment;
		if (angle == 360)
			angle = 0;

		// request that the browser calls animate() again "as soon as it can"
		requestAnimationFrame(animate, canvas);
	};

	// draw!
	animate();

}