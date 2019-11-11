class Edge {
    constructor(index, edgeKey, vertex1, vertex2, triangle1, triangle2=undefined) {
        this.vertex1 = vertex1;
        this.vertex2 = vertex2;
        this.triangle1 = triangle1;
        this.triangle2 = triangle2; // could be null
        this.index = index;
        this.edgeKey = edgeKey;
    }

    getTriangles() {
        let result = [this.triangle1];
        if (this.triangle2) result.push(this.triangle2);
        return result;
    }
}

export { Edge }