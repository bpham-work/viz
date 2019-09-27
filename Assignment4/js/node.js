class Node {
    constructor(x, y, z, temperature, index) {
        // location
        this.x = x; this.y = y; this.z = z;
        // temperature
        this.temperature = temperature;
        // the assigned color
        this.r = 0.; this.g = 0.; this.b = 0.;
        // radius
        this.rad = 0;
        // can store these if you want, or not
        this.dTdx = 0.; this.dTdy = 0.; this.dTdz = 0.;
        // total gradient
        this.grad = 0;
        this.index = index;
    }

    static clone(node) {
        return new Node(node.x, node.y, node.z, node.temperature, node.index);
    }
}

export { Node };