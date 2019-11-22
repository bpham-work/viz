class Vertex {
    constructor(x, y, vx, vy, index=-1) {
        this.x = x;
        this.y = y;
        this.z = 0;

        this.magnitude = this.getNorm(vx, vy);
        this.vx = vx / this.magnitude;
        this.vy = vy / this.magnitude;

        this.angle = Math.atan2(vy, vx);

        this.index = index;
    }

    getNorm(vx, vy) {
        return Math.sqrt(Math.pow(vx, 2) + Math.pow(vy, 2));
    }
}

export { Vertex };