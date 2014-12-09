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

function random()
{
    box.deformRandom();
}

function reset()
{
    box.reset();
}

var box;

function start()
{
    var geometry, material;

    window.onkeypress = handleKeyPress;

    var scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera( 45, 1.5, 0.1, 1000 );
    camera.position.x = 0;
    camera.position.y = 0.6;
    camera.position.z = 1.5;
    camera.lookAt(new THREE.Vector3(0, 0, 0));

    var ourCanvas = document.getElementById('theCanvas');
    var renderer = new THREE.WebGLRenderer({canvas: ourCanvas});

    geometry = new THREE.SphereGeometry(1, 20, 20);
    //geometry = new THREE.BoxGeometry(1.2, 0.8, 2, 8, 8, 8);
    box = new DeformationBox(geometry);

    var red = new THREE.Color(0xff0000);
    var sphere = new THREE.Mesh( geometry, new THREE.MeshLambertMaterial({color: red, ambient: red }) );
    sphere.scale.set(0.5, 0.5, 0.5);
    sphere.position.set(0, 0, 0);
    scene.add( sphere );

    var ambientLight = new THREE.AmbientLight(0x555555);
    scene.add(ambientLight);

    var sunLight = new THREE.PointLight(0xffffff, 1.2, 50);
    sunLight.position.set(5, 2, 5);
    scene.add(sunLight);

    var render = function () {
        sphere.geometry = box.getResult();
        requestAnimationFrame( render );
        renderer.render(scene, camera);
    };

    render();
}