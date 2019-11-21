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
        let poincareIndex = this.getPoincareIndex();
        return Math.abs(poincareIndex - 1) < Math.pow(10, -6);
    }

    getPoincareIndex() {
        let vertex1 = this.vertex1;
        let vertex2 = this.vertex2;
        let vertex3 = this.vertex3;

        // delta angle
        let angle1 = vertex2.angle - vertex1.angle;
        let angle2 = vertex3.angle - vertex2.angle;
        let angle3 = vertex1.angle - vertex3.angle;

        angle1 = angle1 < -1 * Math.PI ? angle1 + 2 * Math.PI : angle1;
        angle1 = angle1 > Math.PI ? angle1 - 2 * Math.PI : angle1;
        angle2 = angle2 < -1 * Math.PI ? angle2 + 2 * Math.PI : angle2;
        angle2 = angle2 > Math.PI ? angle2 - 2 * Math.PI : angle2;
        angle3 = angle3 < -1 * Math.PI ? angle3 + 2 * Math.PI : angle3;
        angle3 = angle3 > Math.PI ? angle3 - 2 * Math.PI : angle3;

        return (angle1 + angle2 + angle3) / 2 / Math.PI;
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