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
                    nodecount++;
                }
            }
        }
        return grid;
    }

    getXYGrid(grid, NX, NY) {
        let subGrid =  [...Array(NX)].map(e => Array(NY));
        for (let x = 0; x < NX; x++) {
            for (let y = 0; y < NY; y++) {
                subGrid[x][y] = grid[x][y]
            }
        }
    }
}

export { Assignment4Service };