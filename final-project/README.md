# ComS 336 Final Project

## Sources

All of the sources are in top level of the project.

* project.html - The basic html that holds the canvas
* project.js - Contains the setup code, the basic render "loop", and the camera controls (gutted from past assignments)
* DeformationBox.js - The heart of the project, enables deformation of geometry

No special compilation or run directions are needed, as no cross-domain assets are required.

## DeformationBox

The DeformationBox is the backbone of this project. Given a starting geometry and a degree, it defines a control lattice
in the shape of the bounding box for the geometry. The degree refers to the degree of the Bezier solid, but it's easiest
to think of it as the number of control points per axis minus one. (e.g., the default degree 4 defines a cube of 5x5x5
control points).

This file was written entirely by me, but several of the functions are adaptations of formulas and code/pseudo-code
found elsewhere. In particular, `recomputeGeometry()` and `calculateLocation(v)` are based on formulas explained in the
following two locations:
* http://www.cse.iitd.ernet.in/~pkalra/csl783/ch14ffd.pdf
* http://www.gamasutra.com/view/feature/3372/realtime_softobject_animation_.php?print=1

The `binCoeff(n, k)` and `bernstein(i, j, u)` helper functions are based on the wikipedia articles for the binomial
coefficient and the Bernstein base polynomial, respectively. The binomial coefficient function uses the recursive
addition definition with some memoization to avoid having to calculate factorials and then divide them.

`recomputeGeometry()` takes the coordinates of each vertex in the original geometry, re-maps the coordinates to the
range [0,1] within the bounding box defined by the max and min coordinates, and uses the new coordinates to calculate
the new location in the parametric solid defined by the control points using the `calculateLocation(v)` function. Then,
it just gives Three.js the appropriate signals to let it know that the geometry was updated.

The other functions in this file are used to manipulate the control points or hand the deformed geometry to whatever
wants to use it.

* `setControl()` - Moves the control point at the given indices to the given location
* `reset()` - Moves all control points back to their starting positions and un-deforms the geometry
* `deformRandom()` - Picks a random control point and moves it 2 units in a random direction
                   - I'm willing to bet I did random Eulers wrong, but it worked well enough for my purposes
* `mapControlPoints()` - Applies a callback function to all control points
* `getResult()` - Returns the deformed geometry, recalculating locations if needed

## Caveats

### Inherent to the algorithm

Mesh deformation performed in this fashion can be fairly cpu intensive. The computation time complexity is O(m*n^3)
where m is the number of vertices and n is the degree of the control lattice. More control points gives more control
over the shape, but also exponentially increases the time needed to calculate the new positions.

This isn't necessarily inherent to all mesh deformation algorithms, but with Bezier curves, the algorithm has nothing
to prevent self-intersections in the deformed geometry.

### Implementation

My implementation as it stands lacks any mouse control or even visuals of the control lattice. As such, it is very
difficult to deform the solid as you wish, requiring knowledge of how control points are indexed and their prior
locations in 3-space (or at least how to look it up).

The DeformationBox class only uses the bounding box for the entire geometry. While this makes the class nice and
generic in that it should work for any given `THREE.Geometry`, the deformation region always contains the entire object.
In real applications, models have many more vertices and control points than in my simple example, so they use several
local deformation regions to lighten the load and have better control over what is deformable. Local deformation with
this current implementation is not possible. It would be simple enough to have the user define min and max points for a
bounding box and then only store (and iterate over) the vertices with it, but that lacks the same ease of use.



