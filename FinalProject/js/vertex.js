class Vertex {
    constructor(x, y, vx, vy, index=-1) {
        this.x = x;
        this.y = y;
        this.z = 0;

        let norm = this.getNorm(vx, vy);
        this.vx = vx / norm;
        this.vy = vy / norm;

        this.index = index;
    }

    getNorm(vx, vy) {
        return Math.sqrt(Math.pow(vx, 2) + Math.pow(vy, 2));
    }
}

export { Vertex };