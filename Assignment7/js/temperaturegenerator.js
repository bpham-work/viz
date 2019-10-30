class TemperatureGenerator {
    constructor() {
        this.sources = {
            xc: [1.0, -1.0, 0.0, 0.0],
            yc: [0.0, 0.3, 1.0, 0.4],
            zc: [0.0, 0.0, 0.0, 1.0],
            A: [90.0, 120.0, 120.0, 170.0]
        };
        this.TEMPMAX = 100.0;
    }
    /**
     * Generate the temperature data for assignment 4 based on the provided
     equation
     * @param {*} x -1.0 <= x <= 1.0
     * @param {*} y -1.0 <= y <= 1.0
     * @param {*} z -1.0 <= z <= 1.0
     */
    getTemp(x, y, z) {
        let t = 0.0;
        for (let i = 0; i < 4; i++) {
            let dx = x - this.sources.xc[i];
            let dy = y - this.sources.yc[i];
            let dz = z - this.sources.zc[i];
            let rsqd = dx*dx + dy*dy + dz*dz;
            t += this.sources.A[i] * Math.exp(-5 * rsqd);
        }
        if (t > this.TEMPMAX)
            t = this.TEMPMAX;
        return t;
    }
}

export { TemperatureGenerator };