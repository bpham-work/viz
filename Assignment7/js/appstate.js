import {ColorScales} from './color_scales.js'

class AppState {
    constructor() {
        this.colorScales = new ColorScales();
        this.colorScale = 'rainbow';
        this.modelPath = './models/diesel_field1.ply';
        this.colorScaleFuncMap = {
            'rainbow': this.colorScales.rainbow,
            'blue-white-red': this.colorScales.blueWhiteRed,
            'heatmap': this.colorScales.heatmap,
            'discrete': this.colorScales.discrete,
            'log': this.colorScales.log
        };
        this.NX = 7;
        this.NY = 7;
        this.NZ = 7;
        this.sMinField1 = Number.MAX_VALUE;
        this.sMaxField1 = Number.MIN_VALUE;
        this.sMinField2 = Number.MAX_VALUE;
        this.sMaxField2 = Number.MIN_VALUE;
        this.sMinField3 = Number.MAX_VALUE;
        this.sMaxField3 = Number.MIN_VALUE;
        this.grid = [];
        this.showField1 = true;
        this.showField2 = false;
        this.showField3 = false;
        this.arrowScale = 0.02;
        this.arrowVertices = [];
        this.arrowIndices = [];
        this.arrowColors = [];
        this.streamlineVertices = [];
        this.streamlineIndices = [];
        this.streamlineColors = [];
    }

    setColorMap(colorMap) {
        this.colorScale = colorMap;
    }

    getColorScaleFunc() {
        return this.colorScaleFuncMap[this.colorScale];
    }
}

export default new AppState();