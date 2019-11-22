class Triangle {
    constructor(vertex1, vertex2, vertex3, index) {
        this.vertex1 = vertex1;
        this.vertex2 = vertex2;
        this.vertex3 = vertex3;
        this.vertices = [vertex1, vertex2, vertex3];
        this.edges = new Map();
		this.index = index;

		if (this.hasFixedPoint())
			this.eigenvalues = this.getEigenvalues();
    }

    getEigenvalues() {
        //TODO: get jacobian here using numeric library
        //numeric.solve([[x1,y1,1], [x2,y2,1], [x3,y3,1]], [vx1,vx2,vx3]) <-- gives a, b, c
        let v = this.getVertices();
		let j1, j2, eigenvalues, x = [], y = [], vx = [], vy = [];

        for(let i = 0; i < 3; i++)
        {
            x[i] = v[i].x;
            y[i] = v[i].y;
            vx[i] = v[i].vx;
            vy[i] = v[i].vy;
        }

		j1 = numeric.solve([[x[0], y[0], 1], [x[1], y[1], 1], [x[2], y[2], 1]], [vx[0], vx[1], vx[2]]);
		j2 = numeric.solve([[x[0], y[0], 1], [x[1], y[1], 1], [x[2], y[2], 1]], [vy[0], vy[1], vy[2]]);

        // todo: get eigenvalues of jacobian using numeric library
        // numeric.eig([[a,b],[c,d]]).lambda
		eigenvalues = numeric.eig([[j1[0], j2[0]], [j1[1], j2[1]]]).lambda;

		return eigenvalues;


		//let coordinates = [];
		//coordinates = numeric.solve([[j1[0], j2[0]], [j1[1], j2[1]], [j1[2], j2[2]]], [0, 0]);

		//return coordinates;
	}

    hasFixedPoint() {
        let poincareIndex = this.getPoincareIndex();
        return Math.abs(poincareIndex - 1) < Math.pow(10, -6);
    }

	getPoincareIndex() {
		let v = this.getVertices();
		let angle = [], sum = 0;

        // delta angle
		for (let i = 0; i < 3; i++) {
			angle[i] = v[(i + 1) % 3].angle - v[i].angle;
			angle[i] = angle[i] < -1 * Math.PI ? angle[i] + 2 * Math.PI
					 : angle[i] > Math.PI ? angle[i] - 2 * Math.PI : angle[i];
			sum += angle[i];
		}

        return sum / 2 / Math.PI;
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