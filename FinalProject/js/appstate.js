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
        this.sMin = Number.MAX_VALUE;
        this.sMax = Number.MIN_VALUE;
        this.grid = [];
        this.showVectorMagColorPlot = true;
        this.showVectorAngleColorPlot = false;
        this.showVectorXColorPlot = false;
        this.showVectorYColorPlot = false;

        this.vectorValues = [];
        this.positions = [];
        this.indices = [];

        this.triangles = [];
        this.vertices = [];
        this.edges = [];

        this.minVX = Number.MAX_VALUE;
        this.maxVX = Number.MIN_VALUE;
        this.minVY = Number.MAX_VALUE;
        this.maxVY = Number.MIN_VALUE;
        this.minX = Number.MAX_VALUE;
        this.maxX = Number.MIN_VALUE;
        this.minY = Number.MAX_VALUE;
        this.maxY = Number.MIN_VALUE;
        this.arrowPositions = [];
        this.arrowColors = [];
        this.arrowIndices = [];

        this.showArrows = false;
        this.showLIC = true;
        this.showColorPlot = false;
        this.showEnhancedLIC = false;

        this.kernelSize = 40;
        this.vecMagColors = [];
        this.vecAngleColors = [];
        this.vecXColors = [];
        this.vecYColors = [];

        this.allStreamlines = true;
        this.periodicOrbits = false;

        this.streamlineVertices = [];
        this.periodicOrbitVertices = [];
        this.minStreamlineLength = 35;
        this.integrationStepSize = 0.013;
    }

    getColorScaleFunc() {
        return this.colorScaleFuncMap[this.colorScale];
    }

    showVecMagColorPlot() {
        this.showVectorMagColorPlot = true;
        this.showVectorAngleColorPlot = false;
        this.showVectorXColorPlot = false;
        this.showVectorYColorPlot = false;
    }

    showVecAngleColorPlot() {
        this.showVectorMagColorPlot = false;
        this.showVectorAngleColorPlot = true;
        this.showVectorXColorPlot = false;
        this.showVectorYColorPlot = false;
    }

    showVecXColorPlot() {
        this.showVectorMagColorPlot = false;
        this.showVectorAngleColorPlot = false;
        this.showVectorXColorPlot = true;
        this.showVectorYColorPlot = false;
    }

    showVecYColorPlot() {
        this.showVectorMagColorPlot = false;
        this.showVectorAngleColorPlot = false;
        this.showVectorXColorPlot = false;
        this.showVectorYColorPlot = true;
    }

    showColorPlots() {
        this.showColorPlot = true;
        this.showLIC = false;
        this.showEnhancedLIC = false;
    }

    showLICImage() {
        this.showColorPlot = false;
        this.showLIC = true;
        this.showEnhancedLIC = false;
    }

    showEnhancedLICImage() {
        this.showColorPlot = false;
        this.showLIC = false;
        this.showEnhancedLIC = true;
    }

    showAllStreamlines() {
        this.allStreamlines = true;
        this.periodicOrbits = false;
    }

    showPeriodicOrbits() {
        this.allStreamlines = false;
        this.periodicOrbits = true;
    }

    hideStreamlines() {
        this.allStreamlines = false;
        this.periodicOrbits = false;
    }
}

export default new AppState();