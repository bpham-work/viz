class Node {
    constructor(x, y, z, temperature, index) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.temperature = temperature;
        this.dTdx = 0.;
        this.dTdy = 0.;
        this.dTdz = 0.;
        this.index = index;
        this.visible = true;
    }

    static clone(node) {
        let cloned = new Node(node.x, node.y, node.z, node.temperature, node.index);
        cloned.dTdx = node.dTdx;
        cloned.dTdy = node.dTdy;
        cloned.dTdz = node.dTdz;
        cloned.visible = node.visible;
        return cloned;
    }

    gradient() {
        return Math.sqrt(
            Math.pow(this.dTdx, 2) +
            Math.pow(this.dTdy, 2) +
            Math.pow(this.dTdz, 2)
        );
    }

    getS() {
        return this.temperature;
    }
}

export { Node };