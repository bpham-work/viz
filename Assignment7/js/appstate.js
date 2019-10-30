import {ColorScales} from './color_scales.js'

class AppState {
    constructor() {
        this.colorScales = new ColorScales();
        this.colorScale = 'rainbow';
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
        this.useEuler = true;
        
        this.field1ArrowVertices = [];
        this.field1ArrowIndices = [];
        this.field1ArrowColors = [];
        this.field2ArrowVertices = [];
        this.field2ArrowIndices = [];
        this.field2ArrowColors = [];
        this.field3ArrowVertices = [];
        this.field3ArrowIndices = [];
        this.field3ArrowColors = [];
        
        this.field1StreamlineVerticesEuler = [];
        this.field1StreamlineIndicesEuler= [];
        this.field1StreamlineColorsEuler = [];
        this.field2StreamlineVerticesEuler = [];
        this.field2StreamlineIndicesEuler = [];
        this.field2StreamlineColorsEuler = [];
        this.field3StreamlineVerticesEuler = [];
        this.field3StreamlineIndicesEuler = [];
        this.field3StreamlineColorsEuler = [];

        this.field1StreamlineVerticesRK2 = [];
        this.field1StreamlineIndicesRK2= [];
        this.field1StreamlineColorsRK2 = [];
        this.field2StreamlineVerticesRK2 = [];
        this.field2StreamlineIndicesRK2 = [];
        this.field2StreamlineColorsRK2 = [];
        this.field3StreamlineVerticesRK2 = [];
        this.field3StreamlineIndicesRK2 = [];
        this.field3StreamlineColorsRK2 = [];
    }

    setColorMap(colorMap) {
        this.colorScale = colorMap;
    }

    getColorScaleFunc() {
        return this.colorScaleFuncMap[this.colorScale];
    }
}

export default new AppState();