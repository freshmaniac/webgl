var shapes = {};

shapes.n_gon = function (sides) {
	var vertices = [0, 0];
	var indices = [];

	var angle = 2 * Math.PI / sides;

	for (var i = 0; i < sides; i++) {
		vertices.push(Math.cos(i * angle), Math.sin(i * angle));

		if (i < sides - 1) {
			indices.push(0, i + 1, i + 2);
		}
		else {
			indices.push(0, i + 1, 1);
		}
	}

	return {vertices: new Float32Array(vertices), indices: new Uint16Array(indices)};
};