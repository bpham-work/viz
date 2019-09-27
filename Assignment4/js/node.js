class Node {
    constructor(x, y, z, temperature, index) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.temperature = temperature;
        this.dTdx = 0.;
        this.dTdy = 0.;
        this.dTdz = 0.;
        this.grad = 0;
        this.index = index;
        this.visible = true;
    }

    static clone(node) {
        return new Node(node.x, node.y, node.z, node.temperature, node.index);
    }
}

export { Node };