import appState from './appstate.js';
import {AssignmentService} from "./service.js";
import {TextureState} from "./texturestate.js";

/* ----------------------------------------------------------------------*/
/* --------------------- Global Variables -------------------------------*/
/* ----------------------------------------------------------------------*/
var mat4 = glMatrix.mat4;
var canvas = document.querySelector('#glcanvas');
canvas.width = $("#glcanvas").parent().width();

var gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
var programInfo;
var isAxesShown = true;
const CameraModes = {
    PERSPECTIVE: 'PERSPECTIVE',
    ORTHOGRAPHIC: 'ORTHOGRAPHIC',
};
var cameraMode = CameraModes.PERSPECTIVE;
var gui;

let service = new AssignmentService();
let textureState = new TextureState(appState.NX, appState.NY, appState.NZ);

class TransformationParameters {
    constructor() {
        this.angleX = 0.0;
        this.angleY = 0.0;
        this.angleZ = 0.0;
        this.x = 0;
        this.y = 0;
        this.z = -4.0;
    }
}

var transform = new TransformationParameters();

/* --------------------------------------------------------------------*/
/* --------------------- Initialization -------------------------------*/
/* --------------------------------------------------------------------*/

// Initialize webGL context
initializeWebGL();
// Add GUI menu
addGUI();


/**
 * Add GUI controls in the top-right positon of WebGL canvas
 */
function addGUI() {
    gui = new dat.GUI({autoPlace: false});
    $('#davim_gui').append(gui.domElement);
    var gui_interactor = gui.addFolder('Interaction');
    gui_interactor.add(transform, 'x', -10, 10).step(0.1).listen();
    gui_interactor.add(transform, 'y', -10, 10).step(0.1).listen();
    gui_interactor.add(transform, 'z', -10, 10).step(0.1).listen();
    gui_interactor.add(transform, 'angleX', 0, 6.28).step(0.1).listen();
    gui_interactor.add(transform, 'angleY', 0, 6.28).step(0.1).listen();
    gui_interactor.add(transform, 'angleZ', 0, 6.28).step(0.1).listen();
    gui_interactor.open();
}

/**
 * Initialize WebGL by creating vertex and fragment shaders
 */
function initializeWebGL() {

    // If we don't have a GL context, give up now

    if (!gl) {
        alert('Unable to initialize WebGL. Your browser or machine may not support it.');
        return;
    }

    // Vertex shader program

    const vsSource = `
    attribute vec4 aVertexPosition;
    attribute vec2 aTextureCoord;

    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;
    varying highp vec2 vTextureCoord;
    
    varying lowp vec4 vColor;
    void main(void) {
      gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
      vTextureCoord = aTextureCoord;

    }
  `;

    // Fragment shader program

    const fsSource = `
    varying highp vec2 vTextureCoord;
    uniform sampler2D uSampler;

    void main(void) {
      gl_FragColor = texture2D(uSampler, vTextureCoord);
    }
  `;

    // Initialize a shader program; this is where all the lighting
    // for the vertices and so forth is established.
    const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

    // Collect all the info needed to use the shader program.
    // Look up which attributes our shader program is using
    // for aVertexPosition, aVevrtexColor and also
    // look up uniform locations.
    programInfo = {
        program: shaderProgram,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
            textureCoord: gl.getAttribLocation(shaderProgram, 'aTextureCoord'),

        },
        uniformLocations: {
            projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
            modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
            uSampler: gl.getUniformLocation(shaderProgram, 'uSampler'),

        },
    };

    // Try to load a sample data and visualize it.
    // Load and draw model
    let colorArgs = {
        sMin: 0,
        sMax: 100,
        numIntervals: 6
    };
    appState.grid = service.generateDataGrid(appState.NX, appState.NY, appState.NZ, appState.getColorScaleFunc(), colorArgs);
    buildComposites();

    // Draw the scene repeatedly
    function render(now) {

        if (!drag) {
            dX *= AMORTIZATION, dY *= AMORTIZATION;
            transform.angleY += dX, transform.angleX += dY;
        }

        drawScene();
        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);

}

/**
 * Initialize a shader program, so WebGL knows how to draw our data
 */
function initShaderProgram(gl, vsSource, fsSource) {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

    // Create the shader program

    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    // If creating the shader program failed, alert

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
        return null;
    }

    return shaderProgram;
}


/**
 * Creates a shader of the given type, uploads the source and compiles it.
 */
function loadShader(gl, type, source) {
    const shader = gl.createShader(type);

    // Send the source to the shader object

    gl.shaderSource(shader, source);

    // Compile the shader program

    gl.compileShader(shader);

    // See if it compiled successfully

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }

    return shader;
}

/* --------------------------------------------------------------------*/
/* --------------------- Mouse events -------------------------------*/
/* --------------------------------------------------------------------*/
var AMORTIZATION = 0.5;
var drag = false;
var old_x, old_y;
var dX = 0, dY = 0;

var mouseDown = function (e) {
    drag = true;
    old_x = e.pageX, old_y = e.pageY;
    e.preventDefault();
    return false;
};

var mouseUp = function (e) {
    drag = false;
};

var mouseMove = function (e) {
    if (!drag) return false;
    dX = (e.pageX - old_x) * 2 * Math.PI / canvas.width;
    dY = (e.pageY - old_y) * 2 * Math.PI / canvas.height;
    transform.angleY += dX;
    transform.angleX += dY;
    old_x = e.pageX, old_y = e.pageY;
    e.preventDefault();
};

canvas.addEventListener("mousedown", mouseDown, false);
canvas.addEventListener("mouseup", mouseUp, false);
canvas.addEventListener("mouseout", mouseUp, false);
canvas.addEventListener("mousemove", mouseMove, false);


/* -------------------------------------------------------------------*/
/* --------------------- HTML Controls -------------------------------*/
/* -------------------------------------------------------------------*/

var sSlider = $("#s_slider").slider({
    min: 0.0,
    max: 100.0,
    step: 0.02,
    value: [0.0, 100.0],
    focus: true
});
sSlider.on("change", function () {
    // Print out the current values
    let min = sSlider.slider('getValue')[0];
    let max = sSlider.slider('getValue')[1];
    $('#s_min').text(min);
    $('#s_max').text(max);
    appState.setSRange(min, max);
    buildComposites();
});

var opacitySlider = $("#opacity_slider").slider({
    min: 0.0,
    max: 1.0,
    step: 0.001,
    value: 1.0,
    focus: true
});
opacitySlider.on("change", function () {
    // Print out the current values
    let val = opacitySlider.slider('getValue');
    $('#opacity_val').text(val);
    appState.maxOpacity = val;
    buildComposites();
});

$('#bilinear_check').change((e) => {
    textureState.bilinear = e.target.checked;
});

/**
 * Show or hide axes
 */
$("#davim_set_axes").click(function () {
    if ($('#davim_set_axes').is(':checked')) {
        isAxesShown = true;
    } else {
        isAxesShown = false;
    }
});


/**
 * Change camera mode
 */
$("#davim_set_perspective").click(function () {
    if ($('#davim_set_perspective').is(':checked')) {
        cameraMode = CameraModes.PERSPECTIVE;
    } else {
        cameraMode = CameraModes.ORTHOGRAPHIC;
    }
});

/**
 * Change color map
 */
$("#davim_select_color_map").change(function (e) {
    let colorMap = $("#davim_select_color_map option:selected").val();
    appState.setColorMap(colorMap);
    let colorArgs = {
        sMin: 0,
        sMax: 100,
        numIntervals: 6
    };
    appState.grid = service.generateDataGrid(appState.NX, appState.NY, appState.NZ, appState.getColorScaleFunc(), colorArgs);
    buildComposites();
});


/* ---------------------------------------------------------------------------*/
/* ----------------------- WebGL Rendering Functions -------------------------*/

/* ---------------------------------------------------------------------------*/

/**
 * Clean the current scene
 */
function cleanScene() {
    gl.clearColor(0.3, 0.3, 0.3, 1.0);  // Clear to black, fully opaque
    gl.clearDepth(1.0);                 // Clear everything
    gl.enable(gl.DEPTH_TEST);           // Enable depth testing
    gl.depthFunc(gl.LEQUAL);            // Near things obscure far things

    // Clear the canvas before we start drawing on it.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}


/**
 * Draw the scene
 */
function drawScene() {
    gl.clearColor(0.3, 0.3, 0.3, 1.0);  // Clear to black, fully opaque
    gl.clearDepth(1.0);                 // Clear everything
    gl.enable(gl.DEPTH_TEST);           // Enable depth testing
    gl.depthFunc(gl.LEQUAL);            // Near things obscure far things

    // Clear the canvas before we start drawing on it.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    const projectionMatrix = mat4.create();

    if (cameraMode == CameraModes.PERSPECTIVE) {
        // Create a perspective matrix, a special matrix that is
        // used to simulate the distortion of perspective in a camera.
        // Our field of view is 45 degrees, with a width/height
        // ratio that matches the display size of the canvas
        // and we only want to see objects between 0.1 units
        // and 100 units away from the camera.

        const fieldOfView = 45 * Math.PI / 180;   // in radians
        const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
        const zNear = 0.1;
        const zFar = 100.0;


        // note: glmatrix.js always has the first argument
        // as the destination to receive the result.
        mat4.perspective(projectionMatrix,
            fieldOfView,
            aspect,
            zNear,
            zFar);

    } else {
        //Generates a orthogonal projection matrix with the given bounds
        const left = -2;
        const right = 2;
        const bottom = -2;
        const top = 2;
        const zNear = 0.1;
        const zFar = 100;
        mat4.ortho(projectionMatrix,
            left,
            right,
            bottom,
            top,
            zNear,
            zFar);
    }


    // Set the drawing position to the "identity" point, which is
    // the center of the scene.
    const modelViewMatrix = mat4.create();

    // Update the model view matrix if there are some changes in translation and rotation
    mat4.translate(modelViewMatrix,     // destination matrix
        modelViewMatrix,     // matrix to translate
        [transform.x, transform.y, transform.z]);  // amount to translate

    mat4.rotate(modelViewMatrix,  // destination matrix
        modelViewMatrix,  // matrix to rotate
        transform.angleZ,     // amount to rotate in radians
        [0, 0, 1]);       // axis to rotate around (Z)

    mat4.rotate(modelViewMatrix,  // destination matrix
        modelViewMatrix,  // matrix to rotate
        transform.angleY,// amount to rotate in radians
        [0, 1, 0]);       // axis to rotate around (Y)

    mat4.rotate(modelViewMatrix,  // destination matrix
        modelViewMatrix,  // matrix to rotate
        transform.angleX,// amount to rotate in radians
        [1, 0, 0]);

    /*-------------TODO - ADD YOUR DRAWING FUNCTIONS HERE ------------------*/
    textureState.determineVisibility(transform);
    drawTextures(modelViewMatrix, projectionMatrix);
}

function drawTextures(modelViewMatrix, projectionMatrix) {
    // define size and format of level 0
    const level = 0;
    const internalFormat = gl.RGBA;

    const border = 0;
    const format = gl.RGBA;
    const type = gl.UNSIGNED_BYTE;
    let interpMethod = gl.LINEAR;
    if (!textureState.bilinear) {
        interpMethod = gl.NEAREST;
    }
    let textureCoordinates = [
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0,
    ];
    let indices = [
        0, 1, 2,
        0, 2, 3,
    ];

    // for Z major
    let z0, dz;
    if (textureState.Major === TextureState.Z) {
        if (textureState.Zside === textureState.PLUS) {
            z0 = -1.0;
            dz = 2. / (textureState.NZ - 1);
        } else {
            z0 = 1.0;
            dz = -2. / (textureState.NZ - 1);
        }
        let z;
        let zcoord;
        let xyTexture = textureState.getXYTexture();
        for (z = 0, zcoord = z0; z < textureState.NZ; z++ , zcoord += dz) {
            const targetTexture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, targetTexture);
            gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
            gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, textureState.NX, textureState.NY, border, format,
                type, xyTexture[z]);
            gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, interpMethod);
            gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, interpMethod);
            gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
            gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
            gl.enable(gl.BLEND);
            let positions = [
                -1., -1., zcoord,
                -1., 1., zcoord,
                1., 1., zcoord,
                1., -1., zcoord
            ];

            const buffers = initBuffers(positions, textureCoordinates, indices);
            draw_texture_buffers(targetTexture, buffers, modelViewMatrix, projectionMatrix);
        }
    }
        
    // for Y Major
    let y0, dy;
    if (textureState.Major === TextureState.Y) {
        if (textureState.Yside === textureState.PLUS) {
            y0 = -1.0;
            dy = 2. / (textureState.NY - 1);
        } else {
            y0 = 1.0;
            dy = -2. / (textureState.NY - 1);
        }
        let y;
        let ycoord;
        let xzTexture = textureState.getXZTexture();
        for (y = 0, ycoord = y0; y < textureState.NY; y++ , ycoord += dy) {
            const targetTexture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, targetTexture);
            gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
            gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, textureState.NX, textureState.NZ, border, format,
                type, xzTexture[y]);
            gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, interpMethod);
            gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, interpMethod);
            gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
            gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
            gl.enable(gl.BLEND);
            let positions = [
                -1., ycoord, -1.,
                -1., ycoord, 1.,
                1., ycoord, 1.,
                1., ycoord, -1.
            ];
            const buffers = initBuffers(positions, textureCoordinates, indices);
            draw_texture_buffers(targetTexture, buffers, modelViewMatrix, projectionMatrix);
        }
    }

    // For X Major
    let x0, dx;
    if (textureState.Major === TextureState.X) {
        if (textureState.Xside === textureState.PLUS) {
            x0 = -1.0;
            dx = 2. / (textureState.NX - 1);
        } else {
            x0 = 1.0;
            dx = -2. / (textureState.NX - 1);
        }
        let x;
        let xcoord;
        let yzTexture = textureState.getYZTexture();
        for (x = 0, xcoord = x0; x < textureState.NX; x++ , xcoord += dx) {
            const targetTexture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, targetTexture);
            gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
            gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, textureState.NY, textureState.NZ, border, format,
                type, yzTexture[x]);
            gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, interpMethod);
            gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, interpMethod);
            gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
            gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
            gl.enable(gl.BLEND);
            let positions = [
                xcoord, -1., -1.,
                xcoord, -1., 1.,
                xcoord, 1., 1.,
                xcoord, 1., -1.
            ];
            const buffers = initBuffers(positions, textureCoordinates, indices);
            draw_texture_buffers(targetTexture, buffers, modelViewMatrix, projectionMatrix);
        }
    }
}

/**
 * Create three buffers for the texture data
 * @param {*} positions
 * @param {*} textureCoordinates
 * @param {*} indices
 */
function initBuffers(positions, textureCoordinates, indices) {
    // Vertex positions
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    // Texture coordinates
    const textureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates), gl.STATIC_DRAW);

    // indices
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    return {
        position: positionBuffer,
        textureCoord: textureCoordBuffer,
        indices: indexBuffer,
    };
}

/**
 * Draw textures to the screen
 * @param {*} targetTexture
 * @param {*} buffers
 * @param {*} modelViewMatrix
 * @param {*} projectionMatrix
 */
function draw_texture_buffers(targetTexture, buffers, modelViewMatrix,
                              projectionMatrix) {
    // Tell WebGL how to pull out the positions from the position
    // buffer into the vertexPosition attribute
    {
        const numComponents = 3;
        const type = gl.FLOAT;
        const normalize = false;
        const stride = 0;
        const offset = 0;
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
        gl.vertexAttribPointer(
            programInfo.attribLocations.vertexPosition,
            numComponents,
            type,
            normalize,
            stride,
            offset);
        gl.enableVertexAttribArray(
            programInfo.attribLocations.vertexPosition);
    }
    // Tell WebGL how to pull out the texture coordinates from
    // the texture coordinate buffer into the textureCoord attribute.
    {
        const numComponents = 2;
        const type = gl.FLOAT;
        const normalize = false;
        const stride = 0;
        const offset = 0;
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.textureCoord);
        gl.vertexAttribPointer(
            programInfo.attribLocations.textureCoord,
            numComponents,
            type,
            normalize,
            stride,
            offset);
        gl.enableVertexAttribArray(
            programInfo.attribLocations.textureCoord);
    }
    // Tell WebGL which indices to use to index the vertices
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);
    // Tell WebGL to use our program when drawing
    gl.useProgram(programInfo.program);
    // Set the shader uniforms
    gl.uniformMatrix4fv(
        programInfo.uniformLocations.projectionMatrix,
        false,
        projectionMatrix);
    gl.uniformMatrix4fv(
        programInfo.uniformLocations.modelViewMatrix,
        false,
        modelViewMatrix);
    // Specify the texture to map onto the faces.
    // Tell WebGL we want to affect texture unit 0
    gl.activeTexture(gl.TEXTURE0);
    // Bind the texture to texture unit 0
    gl.bindTexture(gl.TEXTURE_2D, targetTexture);
    // Tell the shader we bound the texture to texture unit 0
    gl.uniform1i(programInfo.uniformLocations.uSampler, 0);
    {
        const vertexCount = 6;
        const type = gl.UNSIGNED_SHORT;
        const offset = 0;
        gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
    }
}

function buildComposites() {
    textureState.compositeXY(appState.maxOpacity, appState.grid, appState.getRanges());
    textureState.compositeYZ(appState.maxOpacity, appState.grid, appState.getRanges());
    textureState.compositeXZ(appState.maxOpacity, appState.grid, appState.getRanges());
}

