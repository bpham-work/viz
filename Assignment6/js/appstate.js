import { ColorScales } from './color_scales.js'

class AppState {
    constructor() {
        this.colorScales = new ColorScales();
        this.colorScale = 'rainbow';
        this.modelPath = './models/bnoise.ply';
        this.colorScaleFuncMap = {
            'rainbow': this.colorScales.rainbow,
            'blue-white-red': this.colorScales.blueWhiteRed,
            'heatmap': this.colorScales.heatmap,
            'discrete': this.colorScales.discrete,
            'log': this.colorScales.log
        };
        this.NX = 50;
        this.NY = 50;
        this.NZ = 50;
        this.sMin = Number.MAX_VALUE;
        this.sMax = Number.MIN_VALUE;
        this.grid = [];
        this.showVectorMagColorPlot = true;
        this.showVectorAngleColorPlot = true;
        this.showVectorXColorPlot = true;
        this.showVectorYColorPlot = true;
    }

    setColorMap(colorMap) {
        this.colorScale = colorMap;
    }

    getColorScaleFunc() {
        return this.colorScaleFuncMap[this.colorScale];
    }
}

export default new AppState();