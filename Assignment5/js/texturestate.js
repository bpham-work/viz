class TextureState {
    MINUS = 0;
    PLUS = 1;
    static X = 0;
    static Y = 1;
    static Z = 2;
    static MINUS = 0;
    static PLUS = 1;

    constructor(NX, NY, NZ) {
        this.NX = NX;
        this.NY = NY;
        this.NZ = NZ;
        this.TextureXY_plus = [];
        this.TextureXY_minus = [];
        this.TextureXZ_plus = [];
        this.TextureXZ_minus = [];
        this.TextureYZ_plus = [];
        this.TextureYZ_minus = [];
        for (let i = 0; i < NX; i++) {
            this.TextureYZ_plus[i] = new Uint8Array(NY * NZ * 4);
            this.TextureYZ_minus[i] = new Uint8Array(NY * NZ * 4);
        }
        for (let i = 0; i < NZ; i++) {
            this.TextureXY_plus[i] = new Uint8Array(NX * NY * 4);
            this.TextureXY_minus[i] = new Uint8Array(NX * NY * 4);
        }
        for (let i = 0; i < NY; i++) {
            this.TextureXZ_plus[i] = new Uint8Array(NX * NZ * 4);
            this.TextureXZ_minus[i] = new Uint8Array(NX * NZ * 4);
        }
        this.Major = TextureState.Z;
        this.Zside = TextureState.MINUS;
        this.Xside = TextureState.MINUS;
        this.Yside = TextureState.MINUS;
        this.textureCache = {
            1: {
                'XY': this.TextureXY_plus,
                'YZ': this.TextureYZ_plus,
                'XZ': this.TextureXZ_plus
            },
            0: {
                'XY': this.TextureXY_minus,
                'YZ': this.TextureYZ_minus,
                'XZ': this.TextureXZ_minus
            }
        }
    }

    getXYTexture() {
        return this.textureCache[this.Zside]['XY'];
    }

    getYZTexture() {
        return this.textureCache[this.Xside]['YZ'];
    }

    getXZTexture() {
        return this.textureCache[this.Yside]['XZ'];
    }


    /**
     ** determine which sides of the cube are facing the user
     **
     ** this assumes that the rotation is being done by:
     **
     ** transform.angleX;
     ** transform.angleY;
     **
     **/
    determineVisibility(transform) {
        let xr, yr;
        let cx, sx;
        let cy, sy;
        let nzx, nzy, nzz; /* z component of normal for x side, y side, and z side */

        xr = transform.angleX;
        yr = transform.angleY;
        cx = Math.cos(xr);
        sx = Math.sin(xr);
        cy = Math.cos(yr);
        sy = Math.sin(yr);
        nzx = -sy;
        nzy = sx * cy;
        nzz = cx * cy;

        /* which sides of the cube are showing: */
        /* the Xside being shown to the user is MINUS or PLUS */
        this.Xside = (nzx > 0. ? TextureState.PLUS : TextureState.MINUS);
        this.Yside = (nzy > 0. ? TextureState.PLUS : TextureState.MINUS);
        this.Zside = (nzz > 0. ? TextureState.PLUS : TextureState.MINUS);

        /* which direction needs to be composited: */
        if (Math.abs(nzx) > Math.abs(nzy) && Math.abs(nzx) > Math.abs(nzz)) {
            this.Major = TextureState.X;
        } else if (Math.abs(nzy) > Math.abs(nzx) && Math.abs(nzy) > Math.abs(nzz)) {
            this.Major = TextureState.Y;
        } else {
            this.Major = TextureState.Z;
        }
    }

    compositeXY(maxAlpha, grid, ranges) {
        let x, y, zz;
        let alpha = maxAlpha; /* opacity at this voxel */
        let idx = 0;
        let textureArrayPlus = this.textureCache[TextureState.PLUS]['XY'];
        let textureArrayMinus = this.textureCache[TextureState.MINUS]['XY'];
        for (x = 0; x < this.NX; x++) {
            for (y = 0; y < this.NY; y++) {
                for (zz = 0; zz < this.NZ; zz++) {
                    let z_plus = zz;
                    let z_minus = (this.NZ - 1) - zz;
                    this.setTextureColorsForOrientation(grid, x, y, z_plus, ranges, textureArrayPlus, zz, idx, maxAlpha);
                    this.setTextureColorsForOrientation(grid, x, y, z_minus, ranges, textureArrayMinus, zz, idx, maxAlpha);
                }
                idx += 4;
            }
        }
    }

    compositeYZ(maxAlpha, grid, ranges) {
        let y, z, xx;
        let alpha = maxAlpha; /* opacity at this voxel */
        let idx = 0;
        let textureArrayPlus = this.textureCache[TextureState.PLUS]['YZ'];
        let textureArrayMinus = this.textureCache[TextureState.MINUS]['YZ'];
        for (y = 0; y < this.NY; y++) {
            for (z = 0; z < this.NZ; z++) {
                for (xx = 0; xx < this.NX; xx++) {
                    let x_plus = xx;
                    let x_minus = (this.NX - 1) - xx;
                    this.setTextureColorsForOrientation(grid, x_plus, y, z, ranges, textureArrayPlus, xx, idx, maxAlpha);
                    this.setTextureColorsForOrientation(grid, x_minus, y, z, ranges, textureArrayMinus, xx, idx, maxAlpha);
                }
                idx += 4;
            }
        }
    }

    compositeXZ(maxAlpha, grid, ranges) {
        let x, z, yy;
        let alpha = maxAlpha; /* opacity at this voxel */
        let idx = 0;
        let textureArrayPlus = this.textureCache[TextureState.PLUS]['XZ'];
        let textureArrayMinus = this.textureCache[TextureState.MINUS]['XZ'];
        for (x = 0; x < this.NX; x++) {
            for (z = 0; z < this.NZ; z++) {
                for (yy = 0; yy < this.NY; yy++) {
                    let y_plus = yy;
                    let y_minus = (this.NY - 1) - yy;
                    this.setTextureColorsForOrientation(grid, x, y_plus, z, ranges, textureArrayPlus, yy, idx, maxAlpha);
                    this.setTextureColorsForOrientation(grid, x, y_minus, z, ranges, textureArrayMinus, yy, idx, maxAlpha);
                }
                idx += 4;
            }
        }
    }

    setTextureColorsForOrientation(grid, x, y, z, ranges, targetTextureArray, majorAxisIndex, arrayIndex, maxAlpha) {
        let r = 0.0;
        let g = 0.0;
        let b = 0.0;
        let alpha = maxAlpha;
        if (grid[x][y][z].getS() < ranges.sMin || grid[x][y][z].getS() > ranges.sMax) {
            r = g = b = 0.;
            alpha = 0.;
        } else {
            r = grid[x][y][z].r;
            g = grid[x][y][z].g;
            b = grid[x][y][z].b;
        }
        let int_r = Math.floor(Math.min(255. * r + .5, 255.));
        let int_g = Math.floor(Math.min(255. * g + .5, 255.));
        let int_b = Math.floor(Math.min(255. * b + .5, 255.));
        let int_a = Math.floor(Math.min(255. * alpha + .5, 255.));
        targetTextureArray[majorAxisIndex][arrayIndex] = int_r;
        targetTextureArray[majorAxisIndex][arrayIndex + 1] = int_g;
        targetTextureArray[majorAxisIndex][arrayIndex + 2] = int_b;
        targetTextureArray[majorAxisIndex][arrayIndex + 3] = int_a;
    }
}

export { TextureState };