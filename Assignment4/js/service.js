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
        this.populateGradients(grid, NX, NY, NZ);
        console.log(grid);
        return grid;
    }

    populateGradients(grid, NX, NY, NZ) {
        // dTdx
        for (let y = 0; y < NY; y++) {
            for (let z = 0; z < NZ; z++) {
                for (let x = 0; x < NX; x++) {
                    let currNode = grid[x][y][z];
                    let dTdx = 0.0;
                    if (x === 0) {
                        let adjNode = grid[x+1][y][z];
                        dTdx = this.getOneSidedGradient(currNode, adjNode, currNode.x, adjNode.x);
                    } else if (x === NX-1) {
                        let adjNode = grid[x-1][y][z];
                        dTdx = this.getOneSidedGradient(currNode, adjNode, currNode.x, adjNode.x);
                    } else {
                        let left = grid[x-1][y][z];
                        let right = grid[x+1][y][z];
                        dTdx = this.getTwoSidedGradient(left, right, left.x, right.x);
                    }
                    currNode.dTdx = dTdx;
                }
            }
        }

        // dTdz
        for (let x = 0; x < NX; x++) {
            for (let y = 0; y < NY; y++) {
                for (let z = 0; z < NZ; z++) {
                    let currNode = grid[x][y][z];
                    let dTdz = 0.0;
                    if (z === 0) {
                        let adjNode = grid[x][y][z+1];
                        dTdz = this.getOneSidedGradient(currNode, adjNode, currNode.z, adjNode.z);
                    } else if (z === NZ-1) {
                        let adjNode = grid[x][y][z-1];
                        dTdz = this.getOneSidedGradient(currNode, adjNode, currNode.z, adjNode.z);
                    } else {
                        let left = grid[x][y][z-1];
                        let right = grid[x][y][z+1];
                        dTdz = this.getTwoSidedGradient(left, right, left.z, right.z);
                    }
                    currNode.dTdz = dTdz;
                }
            }
        }

        // dTdy
        for (let x = 0; x < NX; x++) {
            for (let z = 0; z < NZ; z++) {
                for (let y = 0; y < NY; y++) {
                    let currNode = grid[x][y][z];
                    let dTdy = 0.0;
                    if (y === 0) {
                        let adjNode = grid[x][y+1][z];
                        dTdy = this.getOneSidedGradient(currNode, adjNode, currNode.y, adjNode.y);
                    } else if (y === NY-1) {
                        let adjNode = grid[x][y-1][z];
                        dTdy = this.getOneSidedGradient(currNode, adjNode, currNode.y, adjNode.y);
                    } else {
                        let left = grid[x][y-1][z];
                        let right = grid[x][y+1][z];
                        dTdy = this.getTwoSidedGradient(left, right, left.y, right.y);
                    }
                    currNode.dTdy = dTdy;
                }
            }
        }
    }

    getXYGrid(grid, NX, NY, zIndex, ranges) {
        let subGrid = [];
        for (let x = 0; x < NX; x++) {
            let row = [];
            for (let y = 0; y < NY; y++) {
                let node = Node.clone(grid[x][y][zIndex]);
                if (this.isNotInRange(ranges, node)) {
                    node.visible = false;
                }
                row.push(node);
            }
            if (row.length > 0)
                subGrid.push(row);
        }
        return subGrid;
    }

    getYZGrid(grid, NY, NZ, xIndex, ranges) {
        let subGrid = [];
        for (let y = 0; y < NY; y++) {
            let row = [];
            for (let z = 0; z < NZ; z++) {
                let node = Node.clone(grid[xIndex][y][z]);
                if (this.isNotInRange(ranges, node)) {
                    node.visible = false;
                }
                row.push(node);
            }
            if (row.length > 0)
                subGrid.push(row);
        }
        return subGrid;
    }

    getXZGrid(grid, NX, NZ, yIndex, ranges) {
        let subGrid = [];
        for (let x = 0; x < NX; x++) {
            let row = [];
            for (let z = 0; z < NZ; z++) {
                let node = Node.clone(grid[x][yIndex][z]);
                if (this.isNotInRange(ranges, node)) {
                    node.visible = false;
                }
                row.push(node);
            }
            if (row.length > 0)
                subGrid.push(row);
        }
        return subGrid;
    }

    getTwoSidedGradient(leftNode, rightNode, leftAxisVal, rightAxisVal) {
        return (rightNode.temperature - leftNode.temperature) / (rightAxisVal - leftAxisVal);
    }

    getOneSidedGradient(currNode, adjNode, currAxisVal, adjAxisVal) {
        return (currNode.temperature - adjNode.temperature) / (currAxisVal - adjAxisVal);
    }

    isNotInSRange(ranges, node) {
        return node.temperature < ranges.sMin || node.temperature > ranges.sMax;
    }

    isNotInRange(ranges, node) {
        return node.x < ranges.xMin || node.x > ranges.xMax ||
            node.y < ranges.yMin || node.y > ranges.yMax ||
            node.z < ranges.zMin || node.z > ranges.zMax ||
            this.isNotInSRange(ranges, node);
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

export { Assignment4Service };