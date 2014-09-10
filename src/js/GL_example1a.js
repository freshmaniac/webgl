//
// Same as GL_example1, but uses indexed rendering.  Each vertex in the square
// is specified just once, and a separate array of integer indices describes
// the order in which they should be grouped into triangles.
//

// Vertex shader defines one attribute (the vertex position)
// and directly assigns that value to the built-in variable
// gl_Position
var VSHADER_SOURCE =
	'attribute vec4 a_Position;\n' +
	'void main() {\n' +
	'  gl_Position = a_Position;\n' +
	'}\n';

// Fragment shader just sets every fragment to red by assigning a value
// to the built-in variable gl_fragColor
var FSHADER_SOURCE =
	'void main() {\n' +
	'  gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);\n' +
	'}\n';

// Raw data for four vertices.
var vertices = new Float32Array([
	-0.5, -0.5,
	0.5, -0.5,
	0.5, 0.5,
	-0.5, 0.5
]
);

//indices describing two triangles using the points above
var numIndices = 6;
var indices = new Uint16Array([0, 1, 2, 0, 2, 3]);


// A few global variables...

// the OpenGL context
var gl;

// handles to buffers on the GPU
var vertexbuffer;
var indexbuffer;

// handle to the compiled shader program on the GPU
var shader;


// code to actually render our geometry
function draw() {
	var sides_input = document.getElementById('sides_input');
	var num_sides = parseInt(sides_input.value);
	
	var ngon_info = shapes.n_gon(num_sides);
	
	// clear the framebuffer
	gl.clear(gl.COLOR_BUFFER_BIT);

	// bind the shader
	gl.useProgram(shader);

	// bind the buffer
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexbuffer);

	// Bind the vertices to the buffer
	gl.bufferData(gl.ARRAY_BUFFER, ngon_info.vertices, gl.STATIC_DRAW);

	// get the index for the a_Position attribute defined in the vertex shader
	var positionIndex = gl.getAttribLocation(shader, 'a_Position');
	if (positionIndex < 0) {
		console.log('Failed to get the storage location of a_Position');
		return;
	}

	// "enable" the a_Position attribute 
	gl.enableVertexAttribArray(positionIndex);

	// associate the data in the currently bound buffer with the a_position attribute
	// (The '2' specifies there are 2 floats per vertex in the buffer.  Don't worry about
	// the last three args just yet.)
	gl.vertexAttribPointer(positionIndex, 2, gl.FLOAT, false, 0, 0);

	// we can unbind the buffer now (not really necessary when there is only one buffer)
	gl.bindBuffer(gl.ARRAY_BUFFER, null);

	// bind the index buffer
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexbuffer);

	// Add the vertex array indices to buffer
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, ngon_info.indices, gl.STATIC_DRAW);

	// draw - note use of function drawElements instead of drawArrays
	gl.drawElements(gl.TRIANGLES, num_sides * 3, gl.UNSIGNED_SHORT, 0);

	// unbind
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
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
	if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
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

	// request a handle to another chunk of GPU memory
	indexbuffer = gl.createBuffer();
	if (!indexbuffer) {
		console.log('Failed to create the buffer object');
		return;
	}

	// bind the buffer as the current "index" buffer, note the constant
	// ELEMENT_ARRAY_BUFFER rather than ARRAY_BUFFER
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexbuffer);

	// load our index data onto the GPU (uses the currently bound buffer)
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

	// now that the buffer is set up, we can unbind the buffer
	// (we still have the handle, so we can bind it again when needed)
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

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