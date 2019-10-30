class Node {
    constructor(x, y, z, temperature, index) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.temperature = temperature;
        this.dTdx = 0.;
        this.dTdy = 0.;
        this.dTdz = 0.;
        this.vectorFields = {
            'field1': [],
            'field2': [],
            'field3': []
        };
        this.index = index;
        this.visible = true;
    }

    static clone(node) {
        let cloned = new Node(node.x, node.y, node.z, node.temperature, node.index);
        cloned.dTdx = node.dTdx;
        cloned.dTdy = node.dTdy;
        cloned.dTdz = node.dTdz;
        cloned.vectorFields = node.vectorFields;
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

    getField1UnitVector() {
        return this.normalizeVector(this.vectorFields.field1);
    }

    getField2UnitVector() {
        return this.normalizeVector(this.vectorFields.field2);
    }

    getField3UnitVector() {
        return this.normalizeVector(this.vectorFields.field3);
    }

    normalizeVector(vectorComponents) {
        let vx = vectorComponents[0];
        let vy = vectorComponents[1];
        let vz = vectorComponents[2];
        let norm = Math.sqrt(Math.pow(vx, 2) + Math.pow(vy, 2) + Math.pow(vz, 2));
        return [vx / norm, vy / norm, vz / norm];
    }
}

export { Node };