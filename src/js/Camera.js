/**
 * Simplified camera encapsulating the camera's position plus an x, y, and z axis, 
 * which are denoted here as right, up, and back, respectively.
 * The camera is not allowed to roll, so the camera's
 * x-axis is always perpendicular to the world's up vector (world y-axis).  The turnLeft
 * and turnRight operations rotate about an axis through the camera's center that
 * is parallel to the world up vector.  By default the camera is located
 * at (0, 0, 5) and its x, y, and z axes are the same as the world x, y, and z
 * (i.e., the camera is looking down the negative z-axis toward the origin).
 * 
 * There are methods for calculating a view and projection matrix from the camera's
 * state.  Applications typically request these matrices frequently (many times per
 * frame) so we keep a cached copy of each one and only recalculate when necessary.
 * (See getProjection, setAspect, and setFovy for an example.)
 * 
 */
var Camera = function(fovy, aspect)
{
  // by default we are at (0, 0, 5) looking along the world's negative z-axis
  
  // camera x-axis
  this.right = new Vector3([1, 0, 0]);
  
  // camera y-axis
  this.up = new Vector3([0, 1, 0]);
  
  // camera z-axis
  this.back = new Vector3([0, 0, 1]);
  
  // camera position
  this.position = new Vector3([0, 0, 5]);
  
  // cached copies of view matrix and projection matrix
  // (initialized to some appropriate defaults):
  
  // view matrix is always the inverse of camera's translation * rotation
  // (initial rotation is the identity, so this is easy to initialize)
  this.viewMatrix = new Matrix4().setTranslate(0, 0, -5);
  this.viewStale = false;

  // projection matrix
  this.aspect = aspect || 1.0;
  this.fovy = fovy || 30.0;
  this.projectionMatrix = new Matrix4().setPerspective(this.fovy, this.aspect, 0.1, 1000);
  this.projectionStale = false;
}

/**
 * Returns the view matrix for this camera.
 */
Camera.prototype.getView = function()
{
  if (this.viewStale) this.recalculateView();
  return this.viewMatrix;
}

/**
 * Returns the projection matrix for this camera.
 */
Camera.prototype.getProjection = function()
{
  if (this.projectionStale) this.recalculateProjection();
  return this.projectionMatrix;
}

/**
 * Sets the aspect ratio.
 */
Camera.prototype.setAspectRatio = function(aspect)
{
  this.aspect = aspect;
  this.projectionStale = true;
}

/**
 * Gets the aspect ratio.
 */
Camera.prototype.getAspectRatio = function()
{
  return this.aspect;
}

/**
 * Sets the field of view.
 */
Camera.prototype.setFovy = function(degrees)
{
  this.fovy = degrees;
  this.projectionStale = true;
}

/**
 * Gets the field of view.
 */
Camera.prototype.getFovy = function()
{
  return this.fovy;
}

/**
 * Moves the camera along its negative z-axis by the given amount.
 */
Camera.prototype.moveForward = function(distance)
{
  var curPos = this.position.elements;
  curPos[0] -= distance * this.back.elements[0];
  curPos[1] -= distance * this.back.elements[1];
  curPos[2] -= distance * this.back.elements[2];

  this.viewStale = true;
}

/**
 * Moves the camera along its positive z-axis by the given amount.
 */
Camera.prototype.moveBack = function(distance)
{
  this.moveForward(-distance);
}

/**
 * Moves the camera along its positive x-axis by the given amount.
 */
Camera.prototype.moveRight = function(distance)
{
  var curPos = this.position.elements;
  curPos[0] += distance * this.right.elements[0];
  curPos[1] += distance * this.right.elements[1];
  curPos[2] += distance * this.right.elements[2];

  this.viewStale = true;
}

/**
 * Moves the camera along its negative x-axis by the given amount.
 */
Camera.prototype.moveLeft = function(distance)
{
  this.moveRight(-distance);
}

/**
 * Moves the camera along its own up vector by the given amount.
 */
Camera.prototype.moveUp = function(distance)
{
  var curPos = this.position.elements;
  curPos[0] += distance * this.up.elements[0];
  curPos[1] += distance * this.up.elements[1];
  curPos[2] += distance * this.up.elements[2];

  this.viewStale = true;
}

/**
 * Moves the camera opposite its up vector by the given amount.
 */
Camera.prototype.moveDown = function(distance)
{
  this.moveUp(-distance);
}

/**
 * Rotates the camera counterclockwise about an axis through its center 
 * that is parallel to the world y-axis.
 */
Camera.prototype.turnLeft = function(degrees)
{
  var rotMatrix = new Matrix4().setRotate(degrees, 0, 1, 0);
  this.right = rotMatrix.multiplyVector3(this.right).normalize();
  this.up = rotMatrix.multiplyVector3(this.up).normalize();
  this.back = rotMatrix.multiplyVector3(this.back).normalize();

  this.viewStale = true;
}

/**
 * Rotates the camera clockwise about an axis through its center 
 * that is parallel to the world y-axis.
 */
Camera.prototype.turnRight = function(degrees)
{
  this.turnLeft(-degrees);
}

/**
 * Rotates the camera counterclockwise about its x-axis.
 */
Camera.prototype.lookUp = function(degrees)
{
  var right = this.right.elements;
  var rotMatrix = new Matrix4().setRotate(degrees, right[0], right[1], right[2]);
  this.right = rotMatrix.multiplyVector3(this.right).normalize();
  this.up = rotMatrix.multiplyVector3(this.up).normalize();
  this.back = rotMatrix.multiplyVector3(this.back);
}

/**
 * Rotates the camera clockwise about its x-axis.
 */
Camera.prototype.lookDown = function(degrees)
{
  this.lookUp(-degrees);
}

/**
 * Moves the camera the given number of degrees along a great circle.
 * The axis of rotation is parallel to the camera's x-axis and intersects
 * the camera's negative z-axis the given distance in front of the camera.
 * (This operation is equivalent to a moveForward, lookDown
 * and then moveBack.
 */
Camera.prototype.orbitUp = function(degrees, distance)
{
  this.moveForward(distance);
  this.lookDown(degrees);
  this.moveBack(distance);
}

/**
 * Moves the camera the given number of degrees along a great circle.
 * The axis of rotation is parallel to the camera's x-axis and intersects
 * the camera's negative z-axis the given distance in front of the camera.
 * (This operation is equivalent to a moveForward, lookUp
 * and then moveBack.
 */
Camera.prototype.orbitDown = function(degrees, distance)
{
  this.orbitUp(-degrees, distance);
}


/**
 * Moves the camera the given number of degrees around a circle of latitude.
 * The axis of rotation is parallel to the world up vector and intersects the
 * camera's negative z-axis the given distance in front of the camera.
 * (This operation is equivalent to a moveForward, turnLeft, and moveBack.)
 */
Camera.prototype.orbitRight = function(degrees, distance)
{
  this.moveForward(distance);
  this.turnLeft(degrees);
  this.moveBack(distance);
}

/**
 * Moves the camera the given number of degrees around a circle of latitude.
 * The axis of rotation is parallel to the world up vector and intersects the
 * camera's negative z-axis the given distance in front of the camera.
 * (This operation is equivalent to a moveForward, turnRight, and moveBack.)
 */
Camera.prototype.orbitLeft = function(degrees, distance)
{
  this.orbitRight(-degrees, distance);
}

/**
 * Orients the camera at its current location to look at the given position.
 */
Camera.prototype.lookAt = function(x, y, z)
{
  // TODO
}

/**
 * Sets this camera's position.
 */
Camera.prototype.setPosition = function(x, y, z)
{
  this.position = new Vector3([x, y, z]);
}

/**
 * Gets this camera's position.
 */
Camera.prototype.getPosition = function()
{
  return this.position;
}


/**
 * Recalculate the view matrix from the current position and axes.
 */
Camera.prototype.recalculateView = function()
{
  var rightVec = this.right.elements;
  var upVec = this.up.elements;
  var backVec = this.back.elements;

  var rot = 
  [rightVec[0], upVec[0], backVec[0], 0,
   rightVec[1], upVec[1], backVec[1], 0,
   rightVec[2], upVec[2], backVec[2], 0,
             0,        0,          0, 1]
  var rotMatrix = new Matrix4();
  rotMatrix.elements = new Float32Array(rot);

  var curPos = this.position.elements;
  var transMatrix = new Matrix4().setTranslate(curPos[0], curPos[1], curPos[2]);

  this.viewMatrix = new Matrix4().multiply(transMatrix).multiply(rotMatrix).invert();
  this.viewStale = false;
}

/**
 * Recalculate the projection matrix from the current field of view and
 * aspect ratio.
 */
Camera.prototype.recalculateProjection = function()
{
  this.projectionMatrix = new Matrix4().setPerspective(this.fovy, this.aspect, 0.1, 1000);
  this.projectionStale = false;
}