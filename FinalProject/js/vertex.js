class Vertex {
    constructor(x, y, z, vx, vy, vz, index) {
        this.x = x;
        this.y = y;
        this.z = z;

        let norm = this.getNorm(vx, vy, vz);
        this.vx = vx / norm;
        this.vy = vy / norm;
        this.vz = vz / norm;

        this.index = index;
    }

    static clone(node) {
        let cloned = new Vertex(node.x, node.y, node.z, node.index);
        cloned.vx = node.vx;
        cloned.vy = node.vy;
        cloned.vz = node.vz;
        return cloned;
    }

    getNorm(vx, vy, vz) {
        return Math.sqrt(Math.pow(vx, 2) + Math.pow(vy, 2) + Math.pow(vz, 2));
    }
}

export { Vertex };