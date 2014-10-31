//
// Same as Lighting3.js, but has multiple lights (in this case two).
//
// Edit light and material properties in the global variables to experiment
// with light color or properties, edit the draw() function to change
// the light positions.
// Edit main to choose a model and select face normals or vertex normals.
//

// given an instance of THREE.Geometry, returns an object
// containing raw data for vertices and normal vectors.
function getModelData(geom)
{
	var verticesArray = [];
	var normalsArray = [];
	var vertexNormalsArray = [];
	var reflectedNormalsArray = [];
	var count = 0;
	for (var f = 0; f < geom.faces.length; ++f)
	{
		var face = geom.faces[f];
		var v = geom.vertices[face.a];
		verticesArray.push(v.x);
		verticesArray.push(v.y);
		verticesArray.push(v.z);
		
		v = geom.vertices[face.b];
		verticesArray.push(v.x);
		verticesArray.push(v.y);
		verticesArray.push(v.z);
		
		v = geom.vertices[face.c];
		verticesArray.push(v.x);
		verticesArray.push(v.y);
		verticesArray.push(v.z);
		count += 3;
		
		var fn = face.normal;
		for (var i = 0; i < 3; ++i)
		{
			normalsArray.push(fn.x);
			normalsArray.push(fn.y);
			normalsArray.push(fn.z);
		}

		for (var i = 0; i < 3; ++i)
		{
			var vn = face.vertexNormals[i];
			vertexNormalsArray.push(vn.x);
			vertexNormalsArray.push(vn.y);
			vertexNormalsArray.push(vn.z);
		}
		
		for (var i = 0; i < 3; ++i)
		{
			var index = (count * 3 - 9) + 3 * i;
			vx = vertexNormalsArray[index];
			vy = vertexNormalsArray[index + 1];
			vz = vertexNormalsArray[index + 2];
			nx = normalsArray[index];
			ny = normalsArray[index + 1];
			nz = normalsArray[index + 2];
//	     nx = vertexNormalsArray[index];
//	      ny = vertexNormalsArray[index + 1];
//	      nz = vertexNormalsArray[index + 2];
//	      vx = normalsArray[index];
//	      vy = normalsArray[index + 1];
//	      vz = normalsArray[index + 2];

			var dot = vx * nx + vy * ny + vz * nz;
			rx = 2 * dot * nx - vx;
			ry = 2 * dot * ny - vy;
			rz = 2 * dot * nz - vz;
			reflectedNormalsArray.push(rx);
			reflectedNormalsArray.push(ry);
			reflectedNormalsArray.push(rz);
		}
	}
	
	console.log(count);	
	return {
		numVertices: count,
		vertices: new Float32Array(verticesArray),
		normals: new Float32Array(normalsArray),
		vertexNormals: new Float32Array(vertexNormalsArray),
	    reflectedNormals: new Float32Array(reflectedNormalsArray)
	};
}


function makeNormalMatrixElements(model, view)
{
	var n = new Matrix4(view).multiply(model);
	n.transpose();
	n.invert();
	n = n.elements;
	return new Float32Array([
	n[0], n[1], n[2],
	n[4], n[5], n[6],
	n[8], n[9], n[10] ]);
}


var axisVertices = new Float32Array([
0.0, 0.0, 0.0,
1.5, 0.0, 0.0,
0.0, 0.0, 0.0, 
0.0, 1.5, 0.0, 
0.0, 0.0, 0.0, 
0.0, 0.0, 1.5]);

var axisColors = new Float32Array([
1.0, 0.0, 0.0, 1.0,
1.0, 0.0, 0.0, 1.0, 
0.0, 1.0, 0.0, 1.0, 
0.0, 1.0, 0.0, 1.0, 
0.0, 0.0, 1.0, 1.0,
0.0, 0.0, 1.0, 1.0]);

// A few global variables...

// light and material properties, column major
//var lightPropElements = new Float32Array([
//0.2, 0.2, 0.2,
//0.7, 0.7, 0.7,
//0.7, 0.7, 0.7
//]);

// green light
var lightPropElements0 = new Float32Array([
0.2, 0.2, 0.2,
0.0, 0.8, 0.0,
0.0, 0.8, 0.0
]);
var rotateLight0 = new Matrix4();

// red light
var lightPropElements1 = new Float32Array([
0.2, 0.2, 0.2,
1.0, 0.0, 0.0,
1.0, 0.0, 0.0
]);
var rotateLight1 = new Matrix4();

// blue light
var lightPropElements2 = new Float32Array([
0.2, 0.2, 0.2,
0.0, 0.0, 0.8,
0.0, 0.0, 0.8
]);
var rotateLight2 = new Matrix4();

// white surface
var matPropElements = new Float32Array([
1, 1, 1,
1, 1, 1,
1, 1, 1
]);
var shininess = 30.0;


// the OpenGL context
var gl;

// our model data
var theModel;

// handle to a buffer on the GPU
var vertexBuffer;
var vertexNormalBuffer;

var axisBuffer;
var axisColorBuffer;

// handle to the compiled shader program on the GPU
var lightingShader;
var colorShader;

// transformation matrices
var model = new Matrix4().setRotate(100, 1, 0, 0).scale(0.75, 0.75, 0.75);

var controlledColor = 'red';

//view matrix
// One strategy is to identify a transformation to our camera frame,
// then invert it.  Here we use the inverse of 
// rotate(30, 0, 1, 0) * rotateX(-45) * Translate(0, 0, 5)
var view = new Matrix4().translate(0, 0, -5).rotate(45, 1, 0, 0).rotate(-30, 0, 1, 0);

// Alternatively use the LookAt function, specifying the view (eye) point,
// a point at which to look, and a direction for "up".
// Approximate view point for above is (1.77, 3.54, 3.06)
//var view = new Matrix4().setLookAt(
//		1.77, 3.54, 3.06,   // eye
//		0, 0, 0,            // at - looking at the origin
//		0, 1, 0);           // up vector - y axis


// For projection we can use an orthographic projection, specifying
// the clipping volume explicitly
//var projection = new Matrix4().setOrtho(-1.5, 1.5, -1, 1, 4, 6)

// Or, use a perspective projection specified with a 
// field of view, an aspect ratio, and distance to near and far
// clipping planes
// Here use aspect ratio 3/2 corresponding to canvas size 600 x 400
var projection = new Matrix4().setPerspective(30, 1.5, 0.1, 1000);

// Or, here is the same perspective projection, using the Frustum function
// a 30 degree field of view with near plane at 4 corresponds 
// view plane height of  4 * tan(15) = 1.07
//var projection = new Matrix4().setFrustum(-1.5 * 1.07, 1.5 * 1.07, -1.07, 1.07, 4, 6);


//translate keypress events to strings
//from http://javascript.info/tutorial/keyboard-events
function getChar(event) {
if (event.which == null) {
 return String.fromCharCode(event.keyCode) // IE
} else if (event.which!=0 && event.charCode!=0) {
 return String.fromCharCode(event.which)   // the rest
} else {
 return null // special key
}
}

//handler for key press events will choose which axis to
// rotate around
function handleKeyPress(event)
{
  var ch = getChar(event);
  switch(ch)
  {
  	case 'x':
  		rotateLightDirection(controlledColor, new Matrix4().setRotate(1, 1, 0, 0));
  		break;

    case 'X':
      rotateLightDirection(controlledColor, new Matrix4().setRotate(-1, 1, 0, 0));
      break;

  	case 'y':
  		rotateLightDirection(controlledColor, new Matrix4().setRotate(1, 0, 1, 0));
  		break;

    case 'Y':
      rotateLightDirection(controlledColor, new Matrix4().setRotate(-1, 0, 1, 0));
      break;

  	case 'z':
      rotateLightDirection(controlledColor, new Matrix4().setRotate(1, 0, 0, 1));
  		break;

    case 'Z':
      rotateLightDirection(controlledColor, new Matrix4().setRotate(-1, 0, 0, 1));
      break;

  	case 'o':
  		rotateLight0.setIdentity();
      rotateLight1.setIdentity();
      rotateLight2.setIdentity();
  		break;

  	default:
  		return;
  }
}


function rotateLightDirection(color, rotMatrix)
{
  switch(color)
  {
    case 'green':
      rotateLight0.multiply(rotMatrix);
      break;

    case 'red':
      rotateLight1.multiply(rotMatrix);
      break;

    case 'blue':
      rotateLight2.multiply(rotMatrix);
      break;

    default:
      rotateLight0.multiply(rotMatrix);
      break;
  }
}

function setColorControl(event)
{
  controlledColor = document.querySelector('input[name="spotlight"]:checked').value;
  console.log(controlledColor);
}


// code to actually render our geometry
function draw()
{
  // clear the framebuffer
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BIT);

  // bind the shader
  gl.useProgram(lightingShader);

  // get the index for the a_Position attribute defined in the vertex shader
  var positionIndex = gl.getAttribLocation(lightingShader, 'a_Position');
  if (positionIndex < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  var normalIndex = gl.getAttribLocation(lightingShader, 'a_Normal');
  if (normalIndex < 0) {
	    console.log('Failed to get the storage location of a_Normal');
	    return;
	  }
 
  // "enable" the a_position attribute 
  gl.enableVertexAttribArray(positionIndex);
  gl.enableVertexAttribArray(normalIndex);
 
  // bind buffers for points 
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.vertexAttribPointer(positionIndex, 3, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexNormalBuffer);
  gl.vertexAttribPointer(normalIndex, 3, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  
  // set uniform in shader for projection * view * model transformation
  var loc = gl.getUniformLocation(lightingShader, "model");
  gl.uniformMatrix4fv(loc, false, model.elements);
  loc = gl.getUniformLocation(lightingShader, "view");
  gl.uniformMatrix4fv(loc, false, view.elements);
  loc = gl.getUniformLocation(lightingShader, "projection");
  gl.uniformMatrix4fv(loc, false, projection.elements);
  loc = gl.getUniformLocation(lightingShader, "normalMatrix");
  gl.uniformMatrix3fv(loc, false, makeNormalMatrixElements(model, view));
  

  // light and material properties
  loc = gl.getUniformLocation(lightingShader, "materialProperties");
  gl.uniformMatrix3fv(loc, false, matPropElements);
  loc = gl.getUniformLocation(lightingShader, "shininess");
  gl.uniform1f(loc, shininess);
  
  // one light upper right, other light upper left
  loc = gl.getUniformLocation(lightingShader, "lightPosition[0]");
  gl.uniform4f(loc, 2.0, 4.0, 2.0, 1.0);
  loc = gl.getUniformLocation(lightingShader, "lightPosition[1]");
  gl.uniform4f(loc, 0.0, 4.0, 0.0, 1.0);
  loc = gl.getUniformLocation(lightingShader, "lightPosition[2]");
  gl.uniform4f(loc, 0.0, 4.0, 2.0, 1.0);

  // one light upper right, other light upper left
  loc = gl.getUniformLocation(lightingShader, "lightDirection[0]");
  gl.uniform4f(loc, -2.0, -4.0, -2.0, 1.0);
  loc = gl.getUniformLocation(lightingShader, "lightDirection[1]");
  gl.uniform4f(loc, 0.0, -4.0, 0.0, 1.0);
  loc = gl.getUniformLocation(lightingShader, "lightDirection[2]");
  gl.uniform4f(loc, 0.0, -4.0, -2.0, 1.0);

  loc = gl.getUniformLocation(lightingShader, "lightIntensity");
  gl.uniform1fv(loc, [15, 20, 25]);
  
  loc = gl.getUniformLocation(lightingShader, "lightProperties[0]");
  gl.uniformMatrix3fv(loc, false, lightPropElements0);
  loc = gl.getUniformLocation(lightingShader, "lightProperties[1]");
  gl.uniformMatrix3fv(loc, false, lightPropElements1);
  loc = gl.getUniformLocation(lightingShader, "lightProperties[2]");
  gl.uniformMatrix3fv(loc, false, lightPropElements2);

  var lightRotElements = [];
  Array.prototype.push.apply(lightRotElements, rotateLight0.elements);
  Array.prototype.push.apply(lightRotElements, rotateLight1.elements);
  Array.prototype.push.apply(lightRotElements, rotateLight2.elements);
  loc = gl.getUniformLocation(lightingShader, "lightRotation");
  gl.uniformMatrix4fv(loc, false, lightRotElements);
  
  
  gl.drawArrays(gl.TRIANGLES, 0, theModel.numVertices);
  
  gl.disableVertexAttribArray(positionIndex);
  gl.disableVertexAttribArray(normalIndex);

  
  // bind the shader
  gl.useProgram(colorShader);

  // get the index for the a_Position attribute defined in the vertex shader
  positionIndex = gl.getAttribLocation(colorShader, 'a_Position');
  if (positionIndex < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  var colorIndex = gl.getAttribLocation(colorShader, 'a_Color');
  if (colorIndex < 0) {
	    console.log('Failed to get the storage location of a_Normal');
	    return;
	  }
 
  // "enable" the a_position attribute 
  gl.enableVertexAttribArray(positionIndex);
  gl.enableVertexAttribArray(colorIndex);
 
  
  // draw axes (not transformed by model transformation)
  gl.bindBuffer(gl.ARRAY_BUFFER, axisBuffer);
  gl.vertexAttribPointer(positionIndex, 3, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, axisColorBuffer);
  gl.vertexAttribPointer(colorIndex, 4, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  
  // set transformation to projection * view only
  loc = gl.getUniformLocation(colorShader, "transform");
  transform = new Matrix4().multiply(projection).multiply(view);
  gl.uniformMatrix4fv(loc, false, transform.elements);

  // draw axes
  gl.drawArrays(gl.LINES, 0, 6);  
  
  // unbind shader and "disable" the attribute indices
  // (not really necessary when there is only one shader)
  gl.disableVertexAttribArray(positionIndex);
  gl.disableVertexAttribArray(colorIndex);
  gl.useProgram(null);

}

// entry point when page is loaded
function main() {
  
  // basically this function does setup that "should" only have to be done once,
  // while draw() does things that have to be repeated each time the canvas is 
  // redrawn	
	
  // retrieve <canvas> element
  var canvas = document.getElementById('theCanvas');

  // key handler
  window.onkeypress = handleKeyPress;

  var defaultRadio = document.getElementById('l1');
  defaultRadio.checked = "checked";

  // get the rendering context for WebGL, using the utility from the teal book
  gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  // load and compile the shader pair, using utility from the teal book
  var vshaderSource = document.getElementById('vertexColorShader').textContent;
  var fshaderSource = document.getElementById('fragmentColorShader').textContent;
  if (!initShaders(gl, vshaderSource, fshaderSource)) {
    console.log('Failed to intialize shaders.');
    return;
  }
  colorShader = gl.program;
  gl.useProgram(null);
  
  // load and compile the shader pair, using utility from the teal book
  var vshaderSource = document.getElementById('vertexLightingShader').textContent;
  var fshaderSource = document.getElementById('fragmentLightingShader').textContent;
  if (!initShaders(gl, vshaderSource, fshaderSource)) {
    console.log('Failed to intialize shaders.');
    return;
  }
  lightingShader = gl.program;
  gl.useProgram(null);

  // cube
  //theModel = getModelData(new THREE.BoxGeometry(1, 1, 1))
  
  // basic sphere
  //theModel = getModelData(new THREE.SphereGeometry(1))
  
  // sphere with more faces
  //theModel = getModelData(new THREE.SphereGeometry(1, 48, 24));
  
  // torus knot
  theModel = getModelData(new THREE.TorusKnotGeometry(1, .4, 128, 16));
  
  //theModel = makeCube();
  
  // buffer for vertex positions for triangles
  vertexBuffer = gl.createBuffer();
  if (!vertexBuffer) {
	  console.log('Failed to create the buffer object');
	  return;
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, theModel.vertices, gl.STATIC_DRAW);

  // buffer for vertex normals
  vertexNormalBuffer = gl.createBuffer();
  if (!vertexNormalBuffer) {
	  console.log('Failed to create the buffer object');
	  return;
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexNormalBuffer);
  
  // choose face normals, vertex normals, or wacky normals
  //gl.bufferData(gl.ARRAY_BUFFER, theModel.normals, gl.STATIC_DRAW);
  gl.bufferData(gl.ARRAY_BUFFER, theModel.vertexNormals, gl.STATIC_DRAW);
  //gl.bufferData(gl.ARRAY_BUFFER, theModel.reflectedNormals, gl.STATIC_DRAW);

  // axes
  axisBuffer = gl.createBuffer();
  if (!axisBuffer) {
	  console.log('Failed to create the buffer object');
	  return;
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, axisBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, axisVertices, gl.STATIC_DRAW);
  
  // buffer for axis colors
  axisColorBuffer = gl.createBuffer();
  if (!axisColorBuffer) {
	  console.log('Failed to create the buffer object');
	  return;
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, axisColorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, axisColors, gl.STATIC_DRAW);
  
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  // specify a fill color for clearing the framebuffer
  gl.clearColor(0.0, 0.2, 0.2, 1.0);
  
  gl.enable(gl.DEPTH_TEST);
   
  // define an animation loop
  var animate = function() {
    draw();
	
	// request that the browser calls animate() again "as soon as it can"
    requestAnimationFrame(animate, canvas); 
  };
  
  // start drawing!
  animate();

  
}