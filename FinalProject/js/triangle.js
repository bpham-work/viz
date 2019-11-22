class Triangle {
    constructor(vertex1, vertex2, vertex3, index, isReverseIndices=false) {
        this.vertex1 = isReverseIndices ? vertex2 : vertex1;
        this.vertex2 = isReverseIndices ? vertex1 : vertex2;
        this.vertex3 = vertex3;
        this.vertices = [this.vertex1, this.vertex2, this.vertex3];
        this.edges = new Map();
		this.index = index;
    }

    getEigenvalues() {
        let xyMatrix = [
            [this.vertex1.x, this.vertex1.y, 1],
            [this.vertex2.x, this.vertex2.y, 1],
            [this.vertex3.x, this.vertex3.y, 1]
        ];
        let xyMatrixSol1 = [this.vertex1.vx, this.vertex2.vx, this.vertex3.vx];
        let xyMatrixSol2 = [this.vertex1.vy, this.vertex2.vy, this.vertex3.vy];
        let abc = numeric.solve(xyMatrix, xyMatrixSol1);
        let def = numeric.solve(xyMatrix, xyMatrixSol2);

        let jacobian = [
            [abc[0], abc[1]],
            [def[0], def[1]]
        ];

		let eigenvalues = numeric.eig(jacobian).lambda;
		debugger;

		return eigenvalues;
	}

    getCoordinates() {
        let v = this.getVertices();
        let j1, j2, coordinates, x = [], y = [], vx = [], vy = [];

        for(let i = 0; i < 3; i++)
        {
            x[i] = v[i].x;
            y[i] = v[i].y;
            vx[i] = v[i].vx;
            vy[i] = v[i].vy;
        }

        j1 = numeric.solve([[x[0], y[0], 1], [x[1], y[1], 1], [x[2], y[2], 1]], [vx[0], vx[1], vx[2]]);
        j2 = numeric.solve([[x[0], y[0], 1], [x[1], y[1], 1], [x[2], y[2], 1]], [vy[0], vy[1], vy[2]]);

        coordinates = numeric.solve([j1, j2, [0,0,1]], [0, 0, 1]);
        return coordinates;
    }

    hasFixedPoint() {
        let poincareIndex = this.getPoincareIndex();
        return Math.abs(poincareIndex - 1) < Math.pow(10, -6);
    }

	getPoincareIndex() {
        let angle1 = this.vertex2.angle - this.vertex1.angle; // vector 1 to vector 2
        let angle2 = this.vertex3.angle - this.vertex2.angle; // vector 2 to vector 3
        let angle3 = this.vertex1.angle - this.vertex3.angle; // vector 3 to vector 1

        let angle1Fixed = this.fixAngle(angle1);
        let angle2Fixed = this.fixAngle(angle2);
        let angle3Fixed = this.fixAngle(angle3);
        return (angle1Fixed + angle2Fixed + angle3Fixed) / 2 / Math.PI;
    }

    fixAngle(angle) {
        if (angle < -1 * Math.PI) {
            return angle + 2 * Math.PI;
        } else if (angle > Math.PI) {
            return angle - 2 * Math.PI
        } else {
            return angle;
        }
    }

    distanceFrom(triangle2) {
        let centroid1 = this.getCentroid();
        let centroid2 = triangle2.getCentroid();
        let x1 = centroid1.x;
        let x2 = centroid2.x;
        let y1 = centroid1.y;
        let y2 = centroid2.y;
        return Math.sqrt(Math.pow((y2-y1), 2) + Math.pow((x2-x1), 2));
    }

    getCentroid() {
        let centerX = (this.vertex1.x + this.vertex2.x + this.vertex3.x) / 3;
        let centerY = (this.vertex1.y + this.vertex2.y + this.vertex3.y) / 3;
        let centerZ = (this.vertex1.z + this.vertex2.z + this.vertex3.z) / 3;
        return { x: centerX, y: centerY, z: centerZ };
    }

    addEdge(edge) {
        this.edges.set(edge.edgeKey, edge);
    }

    getVertices() {
        return [this.vertex1, this.vertex2, this.vertex3];
    }

    getNeighboringTriangles(levels=1) {
        let result = [];
        if (levels === 0) return result;
        this.edges.forEach(edge => {
            let neighboringTriangles = edge.getTriangles()
                .filter(tri => tri.index !== this.index);
            let neighborsOfNeighbors = neighboringTriangles
                .flatMap(tri => tri.getNeighboringTriangles(levels-1))
                .filter(tri => tri.index !== this.index);

            result.push(...neighboringTriangles, ...neighborsOfNeighbors);
        });
        return result;
    }
}

export { Triangle };