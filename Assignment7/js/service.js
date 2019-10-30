import { TemperatureGenerator } from "./temperaturegenerator.js";
import { Node } from "./node.js";

class AssignmentService {
    constructor() {
        this.tempGenerator = new TemperatureGenerator();
    }

    generateDataGrid(NX, NY, NZ) {
        let grid =  [...Array(NX)].map(e => [...Array(NY)].map(e => Array(NZ)));
        let interval = 2 / (NX-1);
        for (let xIndex = 0; xIndex < NX; xIndex++) {
            let x = -1 + xIndex * interval;
            for (let yIndex = 0; yIndex < NY; yIndex++) {
                let y = -1 + yIndex * interval;
                for (let zIndex = 0; zIndex < NZ; zIndex++) {
                    let z = -1 + zIndex * interval;
                    let temp = this.tempGenerator.getTemp(x, y, z);
                    let newNode = new Node(x, y, z, temp);
                    newNode.vectorFields.field1 = this.getField1VectorComponents(x, y, z);
                    newNode.vectorFields.field2 = this.getField2VectorComponents(x, y, z);
                    newNode.vectorFields.field3 = this.getField3VectorComponents(x, y, z);
                    grid[xIndex][yIndex][zIndex] = newNode;
                }
            }
        }
        return grid;
    }

    getField1VectorComponents(x, y, z) {
        let vx = -3 + (6*x) - (4*x*(y+1)) - (4*z);
        let vy = (12*x) - (4 * Math.pow(x, 2)) - (12*z) + (4 * Math.pow(z, 2));
        let vz = 3 + (4*x) - (4*x*(y+1)) - (6*z) + (4*(y+1)*z);
        return [vx, vy, vz];
    }

    getField2VectorComponents(x, y, z) {
        let A = Math.sqrt(3);
        let B = Math.sqrt(2);
        let vx = (A * Math.sin(z)) + Math.cos(y);
        let vy = (B * Math.sin(x)) + (A * Math.cos(z));
        let vz = Math.sin(y) + (B * Math.cos(x));
        return [vx, vy, vz];
    }

    getField3VectorComponents(x, y, z) {
        let vx = -1 * y;
        let vy = -1 * z;
        let vz = x;
        return [vx, vy, vz];
    }

    getField1VectorComponentsNormalized(x, y, z) {
        return this.normalizeVector(this.getField1VectorComponents(x, y, z));
    }

    getField2VectorComponentsNormalized(x, y, z) {
        return this.normalizeVector(this.getField2VectorComponents(x, y, z));
    }

    getField3VectorComponentsNormalized(x, y, z) {
        return this.normalizeVector(this.getField3VectorComponents(x, y, z));
    }

    normalizeVector(vectorComponents) {
        let vx = vectorComponents[0];
        let vy = vectorComponents[1];
        let vz = vectorComponents[2];
        let norm = Math.sqrt(Math.pow(vx, 2) + Math.pow(vy, 2) + Math.pow(vz, 2));
        return [vx / norm, vy / norm, vz / norm];
    }

    buildQuads(nodes, numRows, numCols, indexOffset=0) {
        if (nodes.length > 0) {
            var result = [];
            var levelY = 0;
            while (levelY < numRows - 1) {
                for (var x = levelY * numCols; x < (levelY * numCols) + (numCols - 1); x++) {
                    var bottomLeft = nodes[x];
                    var bottomRight = nodes[x + 1];
                    var topLeft = nodes[x + numCols];
                    var topRight = nodes[x + 1 + numCols];
                    bottomLeft.index = indexOffset + x;
                    bottomRight.index = indexOffset + x + 1;
                    topLeft.index = indexOffset + x + numCols;
                    topRight.index = indexOffset + x + 1 + numCols;
                    var newQuad = {
                        edges: [
                            {v1: topLeft, v2: topRight},
                            {v1: topRight, v2: bottomRight},
                            {v1: bottomRight, v2: bottomLeft},
                            {v1: bottomLeft, v2: topLeft}
                        ]
                    };
                    result.push(newQuad);
                }
                levelY++;
            }
            return result;
        }
        return [];
    };
}

export { AssignmentService };