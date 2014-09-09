var shapes = {}

shapes.n_gon = function(sides) {
    var vertices = new Float32Array([0, 0]);
    var indices = new Uint16Array([]);

    var angle = Math.PI / sides;

    for (var i = 0; i < sides; i++)
    {
        vertices.push(Math.cos(i*angle), Math.sin(i*angle));
        
        if (i < sides - 1)
        {
            indices.push(0, i, i+1);
        }
        else
        {
            indices.push(0, i, 1);
        }
    }
    
    return {vertices: vertices, indices: indices};
};