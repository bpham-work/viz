class Node {
    constructor(x, y, z, s, index) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.temperature = s;
        this.dTdx = 0.;
        this.dTdy = 0.;
        this.dTdz = 0.;
        this.index = index;
        this.visible = true;
        this.r = 0.0;
        this.g = 0.0;
        this.b = 0.0;
    }

    static clone(node) {
        let cloned = new Node(node.x, node.y, node.z, node.temperature, node.index);
        cloned.dTdx = node.dTdx;
        cloned.dTdy = node.dTdy;
        cloned.dTdz = node.dTdz;
        cloned.visible = node.visible;
        return cloned;
    }

    setRGB(rgb) {
        this.r = rgb[0];
        this.g = rgb[1];
        this.b = rgb[2];
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