import { TemperatureGenerator } from "./temperaturegenerator.js";
import { Node } from "./node.js";

class Assignment4Service {
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
                    grid[xIndex][yIndex][zIndex] = newNode;
                }
            }
        }
        return grid;
    }

    getXYGrid(grid, NX, NY, zIndex) {
        let subGrid =  [...Array(NX)].map(e => Array(NY));
        for (let x = 0; x < NX; x++) {
            for (let y = 0; y < NY; y++) {
                subGrid[x][y] = grid[x][y][zIndex];
            }
        }
        return subGrid;
    }

    getYZGrid(grid, NY, NZ, xIndex) {
        let subGrid =  [...Array(NY)].map(e => Array(NZ));
        for (let y = 0; y < NY; y++) {
            for (let z = 0; z < NZ; z++) {
                subGrid[y][z] = grid[xIndex][y][z];
            }
        }
        return subGrid;
    }

    getXZGrid(grid, NX, NZ, yIndex) {
        let subGrid =  [...Array(NX)].map(e => Array(NZ));
        for (let x = 0; x < NX; x++) {
            for (let z = 0; z < NZ; z++) {
                subGrid[x][z] = grid[x][yIndex][z];
            }
        }
        return subGrid;
    }

    buildQuads(nodes, axis1Length, axis2Length, indexOffset=0) {
        if (nodes.length > 0) {
            var result = [];
            var levelY = 0;
            while (levelY < axis2Length - 1) {
                for (var x = levelY * axis1Length; x < (levelY * axis1Length) + (axis1Length - 1); x++) {
                    var bottomLeft = nodes[x];
                    var bottomRight = nodes[x + 1];
                    var topLeft = nodes[x + axis1Length];
                    var topRight = nodes[x + 1 + axis1Length];
                    bottomLeft.index = indexOffset + x;
                    bottomRight.index = indexOffset + x + 1;
                    topLeft.index = indexOffset + x + axis1Length;
                    topRight.index = indexOffset + x + 1 + axis1Length;
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

export { Assignment4Service };