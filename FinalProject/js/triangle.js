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
}

export { Triangle };