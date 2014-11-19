//
// Skybox using Three.js.  Try changing the images below,
// or mapping onto a sphere or something instead of a cube.
//

var path = "./images/skybox/";
var imageNames = [
                  path + "px.jpg",
                  path + "nx.jpg",
                  path + "py.jpg",
                  path + "ny.jpg",
                  path + "pz.jpg",
                  path + "nz.jpg"
                  ];

var axis = 'z';
var paused = false;
var camera;

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

function cameraControl(c, ch)
{
  var distance = c.position.length();
  var q, q2;
  
  switch (ch)
  {
  // camera controls
  case 'w':
    c.translateZ(-0.1);
    return true;
  case 'a':
    c.translateX(-0.1);
    return true;
  case 's':
    c.translateZ(0.1);
    return true;
  case 'd':
    c.translateX(0.1);
    return true;
  case 'r':
    c.translateY(0.1);
    return true;
  case 'f':
    c.translateY(-0.1);
    return true;
  case 'j':
    // need to do extrinsic rotation about world y axis, so multiply camera's quaternion
    // on left
    q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0),  5 * Math.PI / 180);
    q2 = new THREE.Quaternion().copy(c.quaternion);
    c.quaternion.copy(q).multiply(q2);
    return true;
  case 'l':
    q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0),  -5 * Math.PI / 180);
    q2 = new THREE.Quaternion().copy(c.quaternion);
    c.quaternion.copy(q).multiply(q2);
    return true;
  case 'i':
    // intrinsic rotation about camera's x-axis
    c.rotateX(5 * Math.PI / 180);
    return true;
  case 'k':
    c.rotateX(-5 * Math.PI / 180);
    return true;
  case 'O':
    c.lookAt(new THREE.Vector3(0, 0, 0));
    return true;
  case 'S':
    c.fov = Math.min(80, c.fov + 5);
    c.updateProjectionMatrix();
    return true;
  case 'W':
    c.fov = Math.max(5, c.fov  - 5);
    c.updateProjectionMatrix();
    return true;

    // alternates for arrow keys
  case 'J':
    //this.orbitLeft(5, distance)
    c.translateZ(-distance);
    q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0),  5 * Math.PI / 180);
    q2 = new THREE.Quaternion().copy(c.quaternion);
    c.quaternion.copy(q).multiply(q2);
    c.translateZ(distance)
    return true;
  case 'L':
    //this.orbitRight(5, distance)  
    c.translateZ(-distance);
    q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0),  -5 * Math.PI / 180);
    q2 = new THREE.Quaternion().copy(c.quaternion);
    c.quaternion.copy(q).multiply(q2);
    c.translateZ(distance)
    return true;
  case 'I':
    //this.orbitUp(5, distance)      
    c.translateZ(-distance);
    c.rotateX(-5 * Math.PI / 180);
    c.translateZ(distance)
    return true;
  case 'K':
    //this.orbitDown(5, distance)  
    c.translateZ(-distance);
    c.rotateX(5 * Math.PI / 180);
    c.translateZ(distance)
    return true;
  }
  return false;
}

function handleKeyPress(event)
{
  var ch = getChar(event);
  if (cameraControl(camera, ch)) return;
}

function start()
{
  window.onkeypress = handleKeyPress;

  var scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera( 45, 1.5, 0.1, 1000 );
  camera.position.x = 0;
  camera.position.y = 0;
  camera.position.z = 0;
  camera.lookAt(new THREE.Vector3(0, 0, 0));
  
  var ourCanvas = document.getElementById('theCanvas');
  var renderer = new THREE.WebGLRenderer({canvas: ourCanvas});

  // load the six images
  var ourCubeMap = THREE.ImageUtils.loadTextureCube(imageNames);
  // Use a built-in Three.js shader for cube maps
  var cubeMapShader = THREE.ShaderLib["cube"];
  // point it to our texture
  cubeMapShader.uniforms[ "tCube" ].value = ourCubeMap;
  
  // make a ShaderMaterial using this shader's properties
  var material = new THREE.ShaderMaterial( {
      fragmentShader: cubeMapShader.fragmentShader,
      vertexShader: cubeMapShader.vertexShader,
      uniforms: cubeMapShader.uniforms,
      side: THREE.DoubleSide  // make sure we can see it from outside or inside
  } );

  // Make an object
  var geometry = new THREE.BoxGeometry(1, 1, 1);
  //var geometry = new THREE.SphereGeometry(1);

  // Create a mesh for the object, using the cube shader as the material
  var cube = new THREE.Mesh( geometry, material );
  cube.scale.set(10, 10, 10);
  
  // Add it to the scene
  scene.add( cube );

  geometry = new THREE.PlaneBufferGeometry(1, 1, 1, 1);
  material = new THREE.MeshLambertMaterial({color: 0xd7bc27, ambient: 0xd7bc27, side: THREE.DoubleSide});
  var plane = new THREE.Mesh( geometry, material );
  plane.rotateOnAxis(new THREE.Vector3(1, 0, 0), Math.PI/2);
  plane.translateOnAxis(new THREE.Vector3(0, 0, 1), 0.2);

  scene.add(plane);

  var sunLight = new THREE.PointLight(0xffffff, 3, 100);
  sunLight.position = new THREE.Vector3(10, 0, 2);

  scene.add(sunLight);

  var render = function () {
    requestAnimationFrame( render );
     renderer.render(scene, camera);
  };

  render();
}