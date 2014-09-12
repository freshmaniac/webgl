// Similar to GL_example1b, but illustrates using a varying variable
// to interpolate a color attribute for each vertex.  (See shader source
// in GL_Example2.html.)

// raw data for some point positions
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

// a color value for each vertex
var colors = new Float32Array([
	1.0, 0.0, 0.0, 1.0,  // red
	0.0, 1.0, 0.0, 1.0,  // green
	0.0, 0.0, 1.0, 1.0,  // blue
	1.0, 0.0, 0.0, 1.0,  // red
	0.0, 0.0, 1.0, 1.0,  // blue
	1.0, 1.0, 1.0, 1.0,  // white
]
);


// A few global variables...

// the OpenGL context
var gl;

// handles to buffers on the GPU
var vertexbuffer;
var colorbuffer;

// handle to the compiled shader program on the GPU
var shader;
var shader2;

var pickerColor = [0,0,0,0];

var mouseDown = false;


// code to actually render our geometry
function draw() {
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

	// bind the buffer with the color data
	gl.bindBuffer(gl.ARRAY_BUFFER, colorbuffer);

	// get the index for the a_Color attribute defined in the vertex shader
	var colorIndex = gl.getAttribLocation(shader, 'a_Color');
	if (colorIndex < 0) {
		console.log('Failed to get the storage location of a_Color');
		return;
	}

	// "enable" the a_Color attribute 
	gl.enableVertexAttribArray(colorIndex);

	// Associate the data in the currently bound buffer with the a_Color attribute
	// The '4' specifies there are 4 floats per vertex in the buffer
	gl.vertexAttribPointer(colorIndex, 4, gl.FLOAT, false, 0, 0);

	// we can unbind the buffer now
	gl.bindBuffer(gl.ARRAY_BUFFER, null);
	
	var offsetIndex = gl.getUniformLocation(shader, 'u_x_offset');
	if (offsetIndex < 0) {
		console.log('Failed to get the storage location of u_x_offset');
		return;
	}
	gl.uniform1fv(offsetIndex, [-0.5]);
	
	// draw, specifying the type of primitive to assemble from the vertices
	gl.drawArrays(gl.TRIANGLES, 0, numPoints);
	
	// unbind shader and "disable" the attribute indices
	// (not really necessary when there is only one shader)
	gl.disableVertexAttribArray(positionIndex);
	gl.disableVertexAttribArray(colorIndex);
	
	gl.useProgram(shader2);
	
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexbuffer);
	positionIndex = gl.getAttribLocation(shader2, 'a_Position');
	if (positionIndex < 0) {
		console.log('Failed to get the storage location of a_Position');
		return;
	}
	gl.enableVertexAttribArray(positionIndex);
	gl.vertexAttribPointer(positionIndex, 2, gl.FLOAT, false, 0, 0);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);
	
	colorIndex = gl.getUniformLocation(shader2, 'u_Color');
	if (colorIndex < 0) {
		console.log('Failed to get the storage location of u_Color');
		return;
	}
	gl.uniform4fv(colorIndex, pickerColor);
	
	offsetIndex = gl.getUniformLocation(shader2, 'u_x_offset');
	if (offsetIndex < 0) {
		console.log('Failed to get the storage location of u_x_offset');
		return;
	}
	gl.uniform1fv(offsetIndex, [0.5]);
	
	gl.drawArrays(gl.TRIANGLES, 0, numPoints);

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
	canvas.addEventListener('mousemove', showMouseCoords);
	canvas.addEventListener('mousedown', pickColor);

	// get the rendering context for WebGL, using the utility from the teal book
	gl = getWebGLContext(canvas);
	if (!gl) {
		console.log('Failed to get the rendering context for WebGL');
		return;
	}

	// load and compile the shader pair, using utility from the teal book
	var vshaderSource = document.getElementById('vertexShader').textContent;
	var fshaderSource = document.getElementById('varyingFragmentShader').textContent;
	var fshader2Source = document.getElementById('solidColorFragmentShader').textContent;
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


	if (!initShaders(gl, vshaderSource, fshader2Source)) {
		console.log('Failed to initialize shaders.');
		return;
	}
	shader2 = gl.program;
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

	// buffer for the color data
	colorbuffer = gl.createBuffer();
	if (!colorbuffer) {
		console.log('Failed to create the buffer object');
		return;
	}

	// "bind" the buffer as the current array buffer
	gl.bindBuffer(gl.ARRAY_BUFFER, colorbuffer);

	// load our data onto the GPU (uses the currently bound buffer)
	gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);

	// now that the buffer is set up, we can unbind the buffer
	// (we still have the handle, so we can bind it again when needed)
	gl.bindBuffer(gl.ARRAY_BUFFER, null);


	// specify a fill color for clearing the framebuffer
	gl.clearColor(0.0, 0.8, 0.8, 1.0);

	// we could just call draw() once to see the result, but setting up an animation
	// loop to continually update the canvas makes it easier to experiment with the 
	// shaders
	//draw();

	// define an animation loop
	var animate = function () {
		draw();

		// request that the browser calls animate() again "as soon as it can"
		requestAnimationFrame(animate, canvas);
	};

	// start drawing!
	animate();
}

/**
 * Given the corner coordinates and colors of a square, as well as an (x,y) coordinate, return the interpolated color
 * 
 * ex.:   1-----2
 *        |     |
 *        |     |
 *        3-----4
 */
function color_at(corners, cornerColors, x, y) {
	for (var i = 0; i < 4; i++) {
		if (x == corners[i][0] && y == corners[i][1])
			return cornerColors[i];
	}

	// Assume corners are numbered left-to-right, top-to-bottom
	var top_left = corners[0];
	var top_right = corners[1];
	var bottom_left = corners[2];
	var bottom_right = corners[3];

	// X-value for diagonal at given y
	var center_x = Math.round(
		interpolate(
			bottom_left[1], top_right[1], // y-values
			bottom_left[0], top_right[0], // x-values
			y                             // test y
		)
	);

	var center_color = interpolate_colors(bottom_left[1], top_right[1], cornerColors[2], cornerColors[1], y);

	if (x == center_x) {
		return center_color;
	} else if (x < center_x) {
		var left_color = interpolate_colors(bottom_left[1], top_left[1], cornerColors[2], cornerColors[0], y);

		return interpolate_colors(top_left[0], center_x, left_color, center_color, x);
	} else {
		var right_color = interpolate_colors(bottom_right[1], top_right[1], cornerColors[3], cornerColors[1], y);

		return interpolate_colors(center_x, top_right[0], center_color, right_color, x);
	}
}

/**
 * Given endpoints of two scales, (x1, x2) for scale x and (y1, y2) for scale y, and a test value x, finds the
 * corresponding y value.
 */
function interpolate(x1, x2, y1, y2, test_x) {
	var d_y = y2 - y1;
	var d_x = x2 - x1;

	return (d_y / d_x) * (test_x - x1) + y1;
}

function interpolate_colors(d1, d2, color1, color2, d) {
	var new_color = [];

	for (var i = 0; i < 4; i++) {
		new_color.push(interpolate(d1, d2, color1[i], color2[i], d));
	}

	return new_color;
}

function getMousePos(canvas, event) {
	var canvasRect = canvas.getBoundingClientRect();
	return {
		x: event.clientX - canvasRect.left,
		y: event.clientY - canvasRect.top
	};
}

function showMouseCoords(evt) {
	var canvas = document.getElementById("theCanvas");
	var coordsDiv = document.getElementById("coords");

	var mousePos = getMousePos(canvas, evt);

	coordsDiv.innerHTML = "<span>Coords: " + mousePos.x + ", " + mousePos.y + "</span>";
}

function pickColor(evt) {
	var canvas = document.getElementById("theCanvas");
	
	var squareCorners = [
		[0, 100], [199, 100],
		[0, 299], [199, 299]
	];
	
	var cornerColors = [
		[1,1,1,1], [0,0,1,1],
		[1,0,0,1], [0,1,0,1]
	];
	
	var mousePos = getMousePos(canvas, evt);
	
	pickerColor = color_at(squareCorners, cornerColors, mousePos.x, mousePos.y);
}

