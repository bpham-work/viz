class Triangle {
    constructor(vertex1, vertex2, vertex3, index) {
        this.vertex1 = vertex1;
        this.vertex2 = vertex2;
        this.vertex3 = vertex3;
        this.vertices = [vertex1, vertex2, vertex3];
        this.edges = new Map();
        this.index = index;
    }

    hasFixedPoint() {
        return false;
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