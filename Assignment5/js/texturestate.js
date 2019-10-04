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
        this.TextureXY = [];
        this.TextureXZ = [];
        this.TextureYZ = [];
        for (let i = 0; i < NX; i++) {
            this.TextureYZ[i] = new Uint8Array(NY * NZ * 4);
        }
        for (let i = 0; i < NZ; i++) {
            this.TextureXY[i] = new Uint8Array(NX * NY * 4);
        }
        for (let i = 0; i < NY; i++) {
            this.TextureXZ[i] = new Uint8Array(NX * NZ * 4);
        }
        this.Major = TextureState.Z;
        this.Zside = TextureState.MINUS;
        this.Xside = TextureState.MINUS;
        this.Yside = TextureState.MINUS;
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
        let x, y, z, zz;
        let alpha = maxAlpha; /* opacity at this voxel */
        let r, g, b; /* running color composite */
        let idx = 0;
        for (x = 0; x < this.NX; x++) {
            for (y = 0; y < this.NY; y++) {
                r = g = b = 0.;
                for (zz = 0; zz < this.NZ; zz++) {
                    /* which direction to composite: */
                    if (this.Zside === TextureState.PLUS) {
                        z = zz;
                    } else {
                        z = (this.NZ - 1) - zz;
                    }
                    // determine whether the value is out of the range set by the range slider
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
                    this.TextureXY[zz][idx] = int_r;
                    this.TextureXY[zz][idx + 1] = int_g;
                    this.TextureXY[zz][idx + 2] = int_b;
                    this.TextureXY[zz][idx + 3] = int_a;
                }
                idx += 4;
            }
        }
    }

    compositeYZ(maxAlpha, grid, ranges) {
        let x, y, z, xx;
        let alpha = maxAlpha; /* opacity at this voxel */
        let r, g, b; /* running color composite */
        let idx = 0;
        for (y = 0; y < this.NY; y++) {
            for (z = 0; z < this.NZ; z++) {
                r = g = b = 0.;
                for (xx = 0; xx < this.NX; xx++) {
                    /* which direction to composite: */
                    if (this.Xside === TextureState.PLUS) {
                        x = xx;
                    } else {
                        x = (this.NZ - 1) - xx;
                    }
                    // determine whether the value is out of the range set by the range slider
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
                    this.TextureYZ[xx][idx] = int_r;
                    this.TextureYZ[xx][idx + 1] = int_g;
                    this.TextureYZ[xx][idx + 2] = int_b;
                    this.TextureYZ[xx][idx + 3] = int_a;
                }
                idx += 4;
            }
        }
    }

    compositeXZ(maxAlpha, grid, ranges) {
        let x, y, z, yy;
        let alpha = maxAlpha; /* opacity at this voxel */
        let r, g, b; /* running color composite */
        let idx = 0;
        for (x = 0; x < this.NX; x++) {
            for (z = 0; z < this.NZ; z++) {
                r = g = b = 0.;
                for (yy = 0; yy < this.NY; yy++) {
                    /* which direction to composite: */
                    if (this.Yside === TextureState.PLUS) {
                        y = yy;
                    } else {
                        y = (this.NZ - 1) - yy;
                    }
                    // determine whether the value is out of the range set by the range slider
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
                    this.TextureXZ[yy][idx] = int_r;
                    this.TextureXZ[yy][idx + 1] = int_g;
                    this.TextureXZ[yy][idx + 2] = int_b;
                    this.TextureXZ[yy][idx + 3] = int_a;
                }
                idx += 4;
            }
        }
    }
}

export { TextureState };