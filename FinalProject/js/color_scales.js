class ColorScales {
    rainbow(args) {
        let s_min = args.sMin;
        let s_max = args.sMax;
        let s = args.s;
        //Compute rgb color values and return as an array
        let hsv = [];
        let t = (s - s_min) / (s_max - s_min);
        // make sure t is between 0 and 1, if not, rgb should be black
        if(t < 0 || t > 1) {
            let rgb = [];
            rgb[0] = rgb[1] = rgb[2] = 0.0;
            return rgb;
        }
        // map the scalar value linearly to the hue channel of the HSV
        hsv[0] = (1 - t)*240;
        // set the saturation and value as 1
        hsv[1] = 1.0;
        hsv[2] = 1.0;
        // Call the HSV to RGB conversion function
        let rgb = ColorScales.hsvRgb(hsv);
        return rgb;
    }

    blueWhiteRed(args) {
        let s_min = args.sMin;
        let s_max = args.sMax;
        let s = args.s;
        let threshold = args.threshold;
        if (!threshold) {
            threshold = (s_max + s_min) / 2
        }
        let hsv = [];
        let t = (s - s_min) / (s_max - s_min);
        if(t < 0 || t > 1) {
            let rgb = [];
            rgb[0] = rgb[1] = rgb[2] = 0.0;
            return rgb;
        }
        if ((s_max - threshold) < Math.pow(10, -3) || s < threshold) {
            // blue
            hsv[0] = 240;
            hsv[1] = (s - threshold) / (s_min - threshold);
            hsv[2] = 1.0;
        } else {
            // red
            hsv[0] = 0.0;
            hsv[1] = (s - threshold) / (s_max - threshold);
            hsv[2] = 1.0;
        }
        return ColorScales.hsvRgb(hsv);
    }

    heatmap(args) {
        let s_min = args.sMin;
        let s_max = args.sMax;
        let s = args.s;
        let rgb = [];
        let t = (s - s_min) / (s_max - s_min);
        if(t < 0 || t > 1) {
            rgb[0] = rgb[1] = rgb[2] = 0.0;
            return rgb;
        }
        if (t <= (1/3)) {
            rgb[0] = t * 3.0;
            rgb[1] = rgb[2] = 0.0;
        } else if (t <= (2/3)) {
            rgb[0] = 1.0;
            rgb[1] = t * 3.0 - 1.0;
            rgb[2] = 0.0;
        } else {
            rgb[0] = rgb[1] = 1.0;
            rgb[2] = t * 3.0 - 2.0;
        }
        return rgb;
    }

    discrete(args) {
        let s_min = args.sMin;
        let s_max = args.sMax;
        let s = args.s;
        let numIntervals = args.numIntervals;
        let t = (s - s_min) / (s_max - s_min);
        if(t < 0 || t > 1) {
            let rgb = [];
            rgb[0] = rgb[1] = rgb[2] = 0.0;
            return rgb;
        }
        let hsv = [];
        let N = numIntervals;
        let sChunk = (s_max - s_min) / N;
        let colorChunk = 240 / (N-1);
        let colorInterval = 1;
        while (s > s_min + colorInterval * sChunk) {
            colorInterval++;
        }
        colorInterval--;
        let hue = 240 - colorInterval * colorChunk;
        hsv[0] = hue;
        hsv[1] = 1.0;
        hsv[2] = 1.0;
        return ColorScales.hsvRgb(hsv);
    }

    log(args) {
        let s_min = args.sMin;
        let s_max = args.sMax;
        let s = args.s;
        let hsv = [];
        let t = (s - s_min) / (s_max - s_min);
        if(t < 0 || t > 1) {
            let rgb = [];
            rgb[0] = rgb[1] = rgb[2] = 0.0;
            return rgb;
        }
        t = Math.log10(t+0.1) + 1;
        hsv[0] = (1 - t)*240;
        hsv[1] = 1.0;
        hsv[2] = 1.0;
        let rgb = ColorScales.hsvRgb(hsv);
        return rgb;
    }

    /**
     * Convert HSV to RGB color
     */
    static hsvRgb(hsv) {
        let rgb = [];
        let h, s, v;      // hue, sat, value
        let r, g, b;      // red, green, blue
        let i, f, p, q, t;    // interim values


        // guarantee valid input:

        h = hsv[0] / 60.;
        while (h >= 6.) h -= 6.;
        while (h < 0.) h += 6.;

        s = hsv[1];
        if (s < 0.)
            s = 0.;
        if (s > 1.)
            s = 1.;

        v = hsv[2];
        if (v < 0.)
            v = 0.;
        if (v > 1.)
            v = 1.;


        // if sat==0, then is a gray:

        if (s == 0.0) {
            rgb[0] = rgb[1] = rgb[2] = v;
            return rgb;
        }


        // get an rgb from the hue itself:

        i = Math.floor(h);
        f = h - i;
        p = v * (1. - s);
        q = v * (1. - s * f);
        t = v * (1. - (s * (1. - f)));

        switch (Math.floor(i)) {
            case 0:
                r = v;
                g = t;
                b = p;
                break;

            case 1:
                r = q;
                g = v;
                b = p;
                break;

            case 2:
                r = p;
                g = v;
                b = t;
                break;

            case 3:
                r = p;
                g = q;
                b = v;
                break;

            case 4:
                r = t;
                g = p;
                b = v;
                break;

            case 5:
                r = v;
                g = p;
                b = q;
                break;
        }


        rgb[0] = r;
        rgb[1] = g;
        rgb[2] = b;

        return rgb;
    }
}

export { ColorScales };