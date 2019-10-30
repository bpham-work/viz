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
        this.showArrows = true;
        this.showStreamlines = false;
        this.showRibbon = false;
        this.useEuler = true;

        this.numSteps = 500;
        this.stepSize = 0.1;
        
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

        this.xProbePosition = 0.0;
        this.yProbePosition = 0.0;
        this.zProbePosition = 0.0;
        this.field1ProbeStreamlineVerticesEuler = [];
        this.field1ProbeStreamlineIndicesEuler= [];
        this.field1ProbeStreamlineColorsEuler = [];
        this.field2ProbeStreamlineVerticesEuler = [];
        this.field2ProbeStreamlineIndicesEuler = [];
        this.field2ProbeStreamlineColorsEuler = [];
        this.field3ProbeStreamlineVerticesEuler = [];
        this.field3ProbeStreamlineIndicesEuler = [];
        this.field3ProbeStreamlineColorsEuler = [];

        this.field1ProbeStreamlineVerticesRK2 = [];
        this.field1ProbeStreamlineIndicesRK2= [];
        this.field1ProbeStreamlineColorsRK2 = [];
        this.field2ProbeStreamlineVerticesRK2 = [];
        this.field2ProbeStreamlineIndicesRK2 = [];
        this.field2ProbeStreamlineColorsRK2 = [];
        this.field3ProbeStreamlineVerticesRK2 = [];
        this.field3ProbeStreamlineIndicesRK2 = [];
        this.field3ProbeStreamlineColorsRK2 = [];

        this.xRibbonPosition = 0.0;
        this.yRibbonPosition = 0.0;
        this.zRibbonPosition = 0.0;
        this.field1RibbonVerticesEuler = [];
        this.field1RibbonIndicesEuler= [];
        this.field1RibbonColorsEuler = [];
        this.field2RibbonVerticesEuler = [];
        this.field2RibbonIndicesEuler = [];
        this.field2RibbonColorsEuler = [];
        this.field3RibbonVerticesEuler = [];
        this.field3RibbonIndicesEuler = [];
        this.field3RibbonColorsEuler = [];

        this.field1RibbonVerticesRK2 = [];
        this.field1RibbonIndicesRK2= [];
        this.field1RibbonColorsRK2 = [];
        this.field2RibbonVerticesRK2 = [];
        this.field2RibbonIndicesRK2 = [];
        this.field2RibbonColorsRK2 = [];
        this.field3RibbonVerticesRK2 = [];
        this.field3RibbonIndicesRK2 = [];
        this.field3RibbonColorsRK2 = [];
    }

    setColorMap(colorMap) {
        this.colorScale = colorMap;
    }

    getColorScaleFunc() {
        return this.colorScaleFuncMap[this.colorScale];
    }

    selectField1() {
        this.showField1 = true;
        this.showField2 = false;
        this.showField3 = false;
    }

    selectField2() {
        this.showField1 = false;
        this.showField2 = true;
        this.showField3 = false;
    }

    selectField3() {
        this.showField1 = false;
        this.showField2 = false;
        this.showField3 = true;
    }

    selectArrows() {
        this.showArrows = true;
        this.showStreamlines = false;
        this.showRibbon = false;
    }

    selectStreamlines() {
        this.showArrows = false;
        this.showStreamlines = true;
        this.showRibbon = false;
    }

    selectRibbon() {
        this.showArrows = false;
        this.showStreamlines = false;
        this.showRibbon = true;
    }
}

export default new AppState();