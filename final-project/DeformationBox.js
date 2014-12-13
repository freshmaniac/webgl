/**
 * The DeformationBox defines a lattice of (n+1)^3 control points around the given geometry's bounding box, where n is
 * the given degree. This object contains all the information and tools needed to deform the given geometry based on
 * the positions of the control points.
 *
 * @param geometry
 * @param degree
 * @constructor
 */
var DeformationBox = function (geometry, degree) {
	this.originalGeometry = geometry.clone();
	this.deformedGeometry = geometry.clone();
	this.degree = typeof degree !== 'undefined' ? degree : 4;

	geometry.computeBoundingBox();
	this.min = geometry.boundingBox.min;
	this.max = geometry.boundingBox.max;

	this.geometryNeedsUpdate = false;

	this.generateControlPoints();
};

/**
 * Resets the object geometry back to the undeformed state and reinitializes the control point locations.
 */
DeformationBox.prototype.reset = function() {
	this.generateControlPoints();
	this.deformedGeometry = this.originalGeometry.clone();
	this.deformedGeometry.verticesNeedUpdate = true;
	this.deformedGeometry.normalsNeedUpdate = true;
	this.geometryNeedsUpdate = false;
};

/**
 * Returns the geometry based on the control lattice deformations
 *
 * @returns {THREE.Geometry}
 */
DeformationBox.prototype.getResult = function () {
	if (this.geometryNeedsUpdate)
	{
		this.recomputeGeometry();
	}
	return this.deformedGeometry;
};

/**
 * Generates (degree + 1)^3 control points to form the control lattice
 */
DeformationBox.prototype.generateControlPoints = function () {
	this.controlPoints = [];
	for (var i = 0; i <= this.degree; i++)
	{
		this.controlPoints[i] = [];
		for (var j = 0; j <= this.degree; j++)
		{
			this.controlPoints[i][j] = [];
			for (var k = 0; k <= this.degree; k++)
			{
				var pt = new THREE.Vector3();
				pt.x = this.min.x + i / this.degree * (this.max.x - this.min.x);
				pt.y = this.min.y + j / this.degree * (this.max.y - this.min.y);
				pt.z = this.min.z + k / this.degree * (this.max.z - this.min.z);

				this.controlPoints[i][j][k] = pt;
			}
		}
	}
};

/**
 * Calculates new vertices for the deformed geometry
 */
DeformationBox.prototype.recomputeGeometry = function() {
	var min = this.min;
	var max = this.max;

	// Iterate through all vertices
	for (var i = 0; i < this.originalGeometry.vertices.length; i++)
	{
		// Normalize coords to [0, 1]
		var nrmlCoord = new THREE.Vector3();
		nrmlCoord.copy(this.originalGeometry.vertices[i]);
		nrmlCoord.x = (nrmlCoord.x - min.x) / (max.x - min.x);
		nrmlCoord.y = (nrmlCoord.y - min.y) / (max.y - min.y);
		nrmlCoord.z = (nrmlCoord.z - min.z) / (max.z - min.z);

		this.deformedGeometry.vertices[i] = this.calculateLocation(nrmlCoord);
	}

	this.deformedGeometry.computeFaceNormals();
	this.deformedGeometry.computeVertexNormals();
	this.deformedGeometry.verticesNeedUpdate = true;
	this.deformedGeometry.normalsNeedUpdate = true;

	this.geometryNeedsUpdate = false;
};

/**
 * Returns the location of a vertex deformed by the control lattice
 *
 * @param coord
 * @returns {THREE.Vector3}
 */
DeformationBox.prototype.calculateLocation = function(coord) {
	var bU = [],
		bV = [],
		bW = [];

	var i, j, k;

	for (i = 0; i <= this.degree; i++)
	{
		bU[i] = bernstein(i, this.degree, coord.x);
		bV[i] = bernstein(i, this.degree, coord.y);
		bW[i] = bernstein(i, this.degree, coord.z);
	}

	var result = new THREE.Vector3();
	for (i = 0; i <= this.degree; i++)
	{
		for (j = 0; j <= this.degree; j++)
		{
			for (k = 0; k <= this.degree; k++)
			{
				var ctrlPt = this.controlPoints[i][j][k].clone();
				// Math to define the location in the Bezier solid
				result.add( ctrlPt.multiplyScalar( bU[i]*bV[j]*bW[k] ) );
			}
		}
	}
	return result;
};

/**
 * Calculates the binary coefficient C(n, k)
 *
 * @returns {number|false}
 */
var b = [];
function binCoeff(n, k) {
	if (k > n)
		return false;
	if (k === 0 || n === k)
		return 1;
	if (typeof b[n] !== 'undefined' && b[n][k] > 0)
		return b[n][k];
	if (typeof b[n] === 'undefined')
		b[n] = [];
	return b[n][k] = binCoeff(n-1, k-1) + binCoeff(n-1, k);
}

/**
 * Returns the result of the Bernstein base polynomial B_i,j(u), where
 *     B_i,j(u) = C(j, i) * u^i * (1-u)^(j-i)
 * and C(n, k) is the binomial coefficient.
 *
 * @param i
 * @param j
 * @param u
 * @returns {number}
 */
function bernstein(i, j, u) {
	return binCoeff(j, i) * Math.pow(u, i) * Math.pow(1-u, j-i);
}

/**
 * Apply a function each control point.
 *
 * Convenience function to avoid writing tons of triple loops.
 *
 * @param fn
 */
DeformationBox.prototype.mapControlPoints = function(fn) {
	for (var i = 0; i <= this.degree; i++)
	{
		for (var j = 0; j <= this.degree; j++)
		{
			for (var k = 0; k <= this.degree; k++)
			{
				fn(this.controlPoints[i][j][k]);
			}
		}
	}
	this.geometryNeedsUpdate = true;
};

/**
 * "Convenience" function to set a control point's location. Really only saves the trouble of setting the update flag.
 *
 * @param i
 * @param j
 * @param k
 * @param v
 */
DeformationBox.prototype.setControl = function(i, j, k, v) {
	this.controlPoints[i][j][k] = v;
	this.geometryNeedsUpdate = true;
};

/**
 * Picks a random control point and translates it in a random direction.
 */
DeformationBox.prototype.deformRandom = function() {
	var i = Math.floor(Math.random() * 5);
	var j = Math.floor(Math.random() * 5);
	var k = Math.floor(Math.random() * 5);

	var vec = new THREE.Vector3(2, 0, 0);
	var angle = new THREE.Euler();
	angle.x = Math.floor(Math.random() * 181 - 90);
	angle.y = Math.floor(Math.random() * 181 - 90);
	angle.z = Math.floor(Math.random() * 181 - 90);
	var transform = new THREE.Matrix4().makeRotationFromEuler(angle);

	this.setControl(i, j, k, vec.applyProjection(transform));
};

/**
 * Stretches the object geometry along the x-axis based on the given scale. Pretty boring function, equivalent to a
 * scale linear transformation (based on the center of the solid's bounding box).
 *
 * @param scale
 */
DeformationBox.prototype.stretchX = function(scale) {
	var ctr = new THREE.Vector3().addVectors(this.min, this.max).multiplyScalar(0.5);
	var negCtr = ctr.clone().negate();
	var transform = new THREE.Matrix4()
		.multiply(new THREE.Matrix4().makeTranslation(ctr.x, ctr.y, ctr.z))
		.scale(new THREE.Vector3(scale, 1, 1))
		.multiply(new THREE.Matrix4().makeTranslation(negCtr.x, negCtr.y, negCtr.z));

	this.mapControlPoints(function(pt) {
		pt.applyProjection(transform);
	});
};
