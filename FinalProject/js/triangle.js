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