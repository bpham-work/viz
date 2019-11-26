import { ColorScales } from './color_scales.js'

class AppState {
    constructor() {
        this.colorScales = new ColorScales();
        this.colorScale = 'rainbow';
        this.modelPath = './models/fig9ex.ply';
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
        this.fixedPoints = {};
        this.fixedPointTriangleIndices = new Set();

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

        this.showSources = true;
        this.showSinks = true;
        this.showSaddles = true;
        this.allStreamlines = false;
        this.periodicOrbits = true;

        this.streamlineVertices = [];
        this.periodicOrbitVertices = [];
        this.minStreamlineLength = 35;
        this.integrationStepSize = 0.01;

        this.cache = new Map();
    }

    setFixedPointTriangles(fixedPoints) {
        this.fixedPointTriangleIndices.clear();
        fixedPoints.fixedPts.forEach(triangle => this.fixedPointTriangleIndices.add(triangle.index));
        fixedPoints.saddles.forEach(triangle => this.fixedPointTriangleIndices.add(triangle.index));
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

    isPeriodicOrbitDatasetSelected() {
        return this.modelPath.includes('fig9ex') || this.modelPath.includes('multicycles');
    }

    cachePeriodicOrbits(vertices) {
        let positions = vertices.flat().map(vertex => [vertex.x, vertex.y, vertex.z]).flat();
        const colors = Array(4 * positions.length / 3).fill(1.0);
        for (let i = 0; i < colors.length; i += 4) {
            colors[i] = 1.0;
            colors[i + 1] = 0.0;
            colors[i + 2] = 0.0;
        }
        let indices = [];
        let offset = 0;
        for (let k = 0; k < vertices.length; k++) {
            for (let i = 0; i < vertices[k].length - 1; i++) {
                indices.push(offset, offset + 1);
                offset++;
            }
            offset++;
        }
        this.cache.set(this.modelPath, { positions, colors, indices });
    }

    isPeriodicOrbitDataCached() {
        return this.cache.has(this.modelPath);
    }

    getCurrentPeriodicOrbitData() {
        return this.cache.get(this.modelPath);
    }
}

export default new AppState();