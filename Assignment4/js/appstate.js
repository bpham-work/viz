import { ColorScales } from './color_scales.js'

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
        this.NX = 50;
        this.NY = 50;
        this.NZ = 50;
        this.sMin = Number.MAX_VALUE;
        this.sMax = Number.MIN_VALUE;
        this.isocontourK = 1;
        this.isocontourScalars = [74.5];
        this.grid = [];
        this.simulationOption = 'volume_slicing';
        this.xRange = [-1, 1];
        this.yRange = [-1, 1];
        this.zRange = [-1, 1];
    }

    setXRange(min, max) {
        this.xRange = [min, max];
    }

    setYRange(min, max) {
        this.yRange = [min, max];
    }

    setZRange(min, max) {
        this.zRange = [min, max];
    }

    getRanges() {
        return {
            xMin: this.xRange[0],
            xMax: this.xRange[1],
            yMin: this.yRange[0],
            yMax: this.yRange[1],
            zMin: this.zRange[0],
            zMax: this.zRange[1],
        }
    }

    setColorMap(colorMap) {
        this.colorScale = colorMap;
    }

    setSimulationOption(simulationOption) {
        this.simulationOption = simulationOption;
    }

    isVolumeSlicingSelected() {
        return this.simulationOption === 'volume_slicing';
    }

    getColorScaleFunc() {
        return this.colorScaleFuncMap[this.colorScale];
    }

    setSMin(min) {
        this.sMin = min;
    }

    setSMax(max) {
        this.sMax = max;
    }

    // defaultContour(sMin, sMax) {
    //     let sMid = (sMin + sMax) / 2;
    //     this.isocontourScalars = [sMid];
    //     this.isocontourK = 1;
    //     updateDisplayedContourText(this.isocontourScalars);
    //     $('#isocontour_numbercontours_input').val(1);
    //     $('#isocontour_scalar_input').val(sMid);
    //     $('#isocontour_scalar_input')[0].step = (sMax - sMin) / 20;
    // }
    //
    // updateDisplayedContourText(contourScalars) {
    //     let newHtml = ['<ul>'];
    //     contourScalars.forEach((contour) => newHtml.push('<li>' + contour + '</li>'));
    //     newHtml.push('</ul>');
    //     $('#displayed-contours').html(newHtml.join(""));
    // }
}

export default new AppState();