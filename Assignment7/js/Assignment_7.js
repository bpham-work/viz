import appState from './appstate.js';
import { AssignmentService } from "./service.js";

/* ----------------------------------------------------------------------*/
/* --------------------- Global Variables -------------------------------*/
/* ----------------------------------------------------------------------*/
var mat4 = glMatrix.mat4;
var canvas = document.querySelector('#glcanvas');
canvas.width = $("#glcanvas").parent().width();

var gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
var programInfo;
var currentBuffers;
var currentNumbVertices;
var isAxesShown = true;
const CameraModes = {
    PERSPECTIVE: 'PERSPECTIVE',
    ORTHOGRAPHIC: 'ORTHOGRAPHIC',
};
var cameraMode = CameraModes.PERSPECTIVE;
var gui;

let service = new AssignmentService();

class TransformationParameters {
    constructor() {
        this.angleX = 0.0;
        this.angleY = 0.0;
        this.angleZ = 0.0;
        this.x = 0;
        this.y = 0;
        this.z = -7.0;
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
    attribute vec4 aVertexColor;
    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;
    varying lowp vec4 vColor;
    void main(void) {
      gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
      vColor = aVertexColor;
    }
  `;

    // Fragment shader program

    const fsSource = `
    varying lowp vec4 vColor;
    void main(void) {
      gl_FragColor = vColor;
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
            vertexColor: gl.getAttribLocation(shaderProgram, 'aVertexColor'),
        },
        uniformLocations: {
            projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
            modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
        },
    };

    // Try to load a sample data and visualize it.
    // Load and draw model
    appState.grid = service.generateDataGrid(appState.NX, appState.NY, appState.NZ);
    setMinMaxVectorMags();
    buildArrows();
    buildStreamlines();

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
    dX = (e.pageX - old_x) * 2 * Math.PI / canvas.width,
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

var xSlider = $("#x_slider").slider({
    min: -1,
    max: 1,
    step: 0.02,
    value: [-1,1],
    focus: true});
xSlider.on("change", function () {
    // Print out the current values
    let min = xSlider.slider('getValue')[0];
    let max = xSlider.slider('getValue')[1];
    $('#x_min').text(min);
    $('#x_max').text(max);
    appState.setXRange(min, max);
    draw(true);
});

var ySlider = $("#y_slider").slider({
    min: -1,
    max: 1,
    step: 0.02,
    value: [-1,1],
    focus: true});
ySlider.on("change", function () {
    // Print out the current values
    let min = ySlider.slider('getValue')[0];
    let max = ySlider.slider('getValue')[1];
    $('#y_min').text(min);
    $('#y_max').text(max);
    appState.setYRange(min, max);
    draw(true);
});

var zSlider = $("#z_slider").slider({
    min: -1,
    max: 1,
    step: 0.02,
    value: [-1,1],
    focus: true});
zSlider.on("change", function () {
    // Print out the current values
    let min = zSlider.slider('getValue')[0];
    let max = zSlider.slider('getValue')[1];
    $('#z_min').text(min);
    $('#z_max').text(max);
    appState.setZRange(min, max);
    draw(true);
});

var sSlider = $("#s_slider").slider({
    min: 0.0,
    max: 100.0,
    step: 0.02,
    value: [0.0,100.0],
    focus: true});
sSlider.on("change", function () {
    // Print out the current values
    let min = sSlider.slider('getValue')[0];
    let max = sSlider.slider('getValue')[1];
    $('#s_min').text(min);
    $('#s_max').text(max);
    appState.setSRange(min, max);
    draw(true);
});

var gSlider = $("#g_slider").slider({
    min: 0.0,
    max: 320.0,
    step: 1.0,
    value: [0.0,320.0],
    focus: true});
gSlider.on("change", function () {
    // Print out the current values
    let min = gSlider.slider('getValue')[0];
    let max = gSlider.slider('getValue')[1];
    $('#g_min').text(min);
    $('#g_max').text(max);
    appState.setGRange(min, max);
    draw(true);
});

var isoSlider = $("#iso-s").slider({
    min: 0.0,
    max: 100.0,
    step: 0.1,
    value: 30,
    focus: true});
isoSlider.on("change", function () {
    // Print out the current values
    let val = isoSlider.slider('getValue');
    $('#iso_s_val').text(val);
    appState.isocontourScalar = val;
    draw(true);
});

var xySlider = $("#xy-pos").slider({
    min: 0.0,
    max: appState.NZ-1,
    step: 1,
    value: appState.NZ / 2,
    focus: true});
xySlider.on("change", function () {
    let index = xySlider.slider('getValue');
    let interval = 2 / (appState.NZ-1);
    $('#xy-pos_val').text((-1 + (index * interval)).toFixed(2));
    appState.fixedZPos = index;
    draw(true);
});

var yzSlider = $("#yz-pos").slider({
    min: 0.0,
    max: appState.NX-1,
    step: 1,
    value: appState.NX / 2,
    focus: true});
yzSlider.on("change", function () {
    let index = yzSlider.slider('getValue');
    let interval = 2 / (appState.NX-1);
    $('#yz-pos_val').text((-1 + (index * interval)).toFixed(2));
    appState.fixedXPos = index;
    draw(true);
});

var xzSlider = $("#xz-pos").slider({
    min: 0.0,
    max: appState.NY-1,
    step: 1,
    value: appState.NY / 2,
    focus: true});
xzSlider.on("change", function () {
    let index = xzSlider.slider('getValue');
    let interval = 2 / (appState.NY-1);
    $('#xz-pos_val').text((-1 + (index * interval)).toFixed(2));
    appState.fixedYPos = index;
    draw(true);
});

$('#xy_check').change((e) => {
    appState.showXYPlane = e.target.checked;
    draw(true);
});

$('#yz_check').change((e) => {
    appState.showYZPlane = e.target.checked;
    draw(true);
});

$('#xz_check').change((e) => {
    appState.showXZPlane = e.target.checked;
    draw(true);
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
 * Change simulation options
 */
$("#davim_select_simulation").change(function (e) {
    // Step 1:  Clean the scene
    cleanScene();

    // Step 2: Load the selected model
    let simulation = $("#davim_select_simulation option:selected").val();
    appState.setSimulationOption(simulation);
    draw();
});

/**
 * Change color map
 */
$("#davim_select_color_map").change(function (e) {
    let colorMap = $("#davim_select_color_map option:selected").val();
    appState.setColorMap(colorMap);
    draw(true);
});


/* ---------------------------------------------------------------------------*/
/* ----------------------- WebGL Rendering Functions -------------------------*/

/* ---------------------------------------------------------------------------*/

/**
 * Draw 3D axes (red for x-axis, green for y-axis, and blue for z-axis)
 * @param {mat4} modelViewMatrix Model View matrix
 * @param {mat4} projectionMatrix Projection matrix
 */
function drawAxes(modelViewMatrix, projectionMatrix) {

    // Create a buffer for the vertex positions.

    const positionBuffer = gl.createBuffer();

    // Select the positionBuffer as the one to apply buffer
    // operations to from here out.

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    // Now create an array of positions
    const positions = [
        0.0, 0.0, 0.0,
        1.0, 0.0, 0.0,
        0.0, 0.0, 0.0,
        0.0, 1.0, 0.0,
        0.0, 0.0, 0.0,
        0.0, 0.0, 1.0,
    ];

    // Now pass the list of positions into WebGL to build the
    // shape. We do this by creating a Float32Array from the
    // JavaScript array, then use it to fill the current buffer.

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    // Now set up the colors for axes.

    const lineColors = [
        [1.0, 0.0, 0.0, 1.0],    // x axis: red
        [1.0, 0.0, 0.0, 1.0],
        [0.0, 1.0, 0.0, 1.0],    // y axis: green
        [0.0, 1.0, 0.0, 1.0],
        [0.0, 0.0, 1.0, 1.0],    // z axis: blue
        [0.0, 0.0, 1.0, 1.0],
    ];

    var colors = [];
    for (var j = 0; j < lineColors.length; ++j) {
        const c = lineColors[j];

        colors = colors.concat(lineColors[j]);
    }


    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);


    // Build the element array buffer; this specifies the indices
    // into the vertex arrays for each line's vertices.
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    const indices = [
        0, 1, // x axis
        2, 3, // y axis
        4, 5  // z axis
    ];

    // Now send the element array to GL

    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
        new Uint16Array(indices), gl.STATIC_DRAW);

    const buffers = {
        position: positionBuffer,
        color: colorBuffer,
        indices: indexBuffer,
    };

    var nVertices = indices.length;

    // Now, draw axes
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

    // Tell WebGL how to pull out the colors from the color buffer
    // into the vertexColor attribute.
    {
        const numComponents = 4;
        const type = gl.FLOAT;
        const normalize = false;
        const stride = 0;
        const offset = 0;
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
        gl.vertexAttribPointer(
            programInfo.attribLocations.vertexColor,
            numComponents,
            type,
            normalize,
            stride,
            offset);
        gl.enableVertexAttribArray(
            programInfo.attribLocations.vertexColor);
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

    {
        const vertexCount = nVertices;
        const type = gl.UNSIGNED_SHORT;
        const offset = 0;
        gl.drawElements(gl.LINES, vertexCount, type, offset);
    }

}


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
    clearBuffers();
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
    // drawArrows(modelViewMatrix, projectionMatrix);
    drawStreamlines(modelViewMatrix, projectionMatrix);

    if (isAxesShown) {
        drawAxes(modelViewMatrix, projectionMatrix);
    }
}

function getCurrentVecField(node) {
    if (appState.showField1) {
        return node.vectorFields.field1;
    } else if (appState.showField2) {
        return node.vectorFields.field2;
    } else {
        return node.vectorFields.field3;
    }
}

function getCurrentColorScaleArgs(node) {
    if (appState.showField1) {
        return {sMin: appState.sMinField1, sMax: appState.sMaxField1, s: node.getField1VectorMag()};
    } else if (appState.showField2) {
        return {sMin: appState.sMinField2, sMax: appState.sMaxField2, s: node.getField2VectorMag()};
    } else {
        return {sMin: appState.sMinField3, sMax: appState.sMaxField3, s: node.getField3VectorMag()};
    }
}

/**
 * Draw the loaded PLY model
 * @param buffers The buffer data contains vertex positions, colors and indices
 * @param {number} nVertices The number of vertices
 * @param {mat4} modelViewMatrix The model view matrix
 * @param {mat4} projectionMatrix The projection matrix
 */
function drawModel(buffers, nVertices, modelViewMatrix, projectionMatrix, mode=gl.TRIANGLES) {
    if (buffers) { // if the data is valid

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

        // Tell WebGL how to pull out the colors from the color buffer
        // into the vertexColor attribute.
        {
            const numComponents = 4;
            const type = gl.FLOAT;
            const normalize = false;
            const stride = 0;
            const offset = 0;
            gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
            gl.vertexAttribPointer(
                programInfo.attribLocations.vertexColor,
                numComponents,
                type,
                normalize,
                stride,
                offset);
            gl.enableVertexAttribArray(
                programInfo.attribLocations.vertexColor);
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

        {
            const vertexCount = nVertices;
            const type = gl.UNSIGNED_SHORT;
            const offset = 0;
            gl.drawElements(mode, vertexCount, type, offset);
        }
    }
}

function clearBuffers() {
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([]), gl.STATIC_DRAW);

    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([]), gl.STATIC_DRAW);

    // Build the element array buffer; this specifies the indices
    // into the vertex arrays for each line's vertices.
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    const indices = [];
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
        new Uint16Array(indices), gl.STATIC_DRAW);

    const buffers = {
        position: positionBuffer,
        color: colorBuffer,
        indices: indexBuffer,
    };

    currentNumbVertices = indices.length;
    currentBuffers = buffers;
}

///calculate the cross production of two vectors
function cross(v1, v2) {
    var tmp = [];
    tmp[0] = v1[1]*v2[2] - v2[1]*v1[2];
    tmp[1] = v2[0]*v1[2] - v1[0]*v2[2];
    tmp[2] = v1[0]*v2[1] - v2[0]*v1[1];
    return tmp;
}

///Normalize vector
function unit(vin) {
    let dist = Math.sqrt(vin[0]*vin[0] + vin[1]*vin[1] + vin[2]*vin[2]);
    let vout = [0, 0, 0];
    if (dist > 0.0) {
        let f = 1.0 / dist;
        vout[0] = f * vin[0];
        vout[1] = f * vin[1];
        vout[2] = f * vin[2];
    }
    else
    {
        vout[0] = vin[0];
        vout[1] = vin[1];
        vout[2] = vin[2];
    }
    return [vout, dist];
}

function buildArrows() {
    let idx = 0;
    let vertices = [];
    let indices = [];
    let colors = [];
    for (let gridy = 0; gridy < appState.NY; gridy++) {
        for (let gridz = 0; gridz < appState.NZ; gridz++) {
            for (let gridx = 0; gridx < appState.NX; gridx++) {
                let node = appState.grid[gridx][gridy][gridz];
                let vecField = getCurrentVecField(node);
                let tail = [node.x, node.y, node.z];
                let headX = node.x + vecField[0] * appState.arrowScale;
                let headY = node.y + vecField[1] * appState.arrowScale;
                let headZ = node.z + vecField[2] * appState.arrowScale;
                let head = [headX, headY, headZ];
                let color = appState.getColorScaleFunc()(getCurrentColorScaleArgs(node));

                /* size of wings as fraction of length: */
                let WINGS = 0.10;
                /* axes: */
                let X = 1;
                let Y = 2;
                let Z = 3;

                /* x, y, z, axes: */
                let axx = [ 1., 0., 0. ];
                let ayy = [ 0., 1., 0. ];
                let azz = [ 0., 0., 1. ];

                let u = [];
                let v = [];
                let w = [];     /* arrow coordinate system */
                let d;          /* wing distance */
                let x, y, z;    /* point to plot */
                let mag;        /* magnitude of major direction */
                let f;          /* fabs of magnitude */
                let axis;       /* which axis is the major */

                /* set w direction in u-v-w coordinate system: */
                w[0] = head[0] - tail[0];
                w[1] = head[1] - tail[1];
                w[2] = head[2] - tail[2];

                /* determine major direction: */
                axis = X;
                mag = Math.abs(w[0]);
                if ((f=Math.abs(w[1])) > mag) {
                    axis = Y;
                    mag = f;
                }
                if ((f=Math.abs(w[2])) > mag) {
                    axis = Z;
                    mag = f;
                }
                /* set size of wings and turn w into a unit vector: */
                let wNorm = unit(w);
                w = wNorm[0];
                d = WINGS * wNorm[1];

                /* draw the shaft of the arrow: */
                vertices = vertices.concat(tail, head);

                // Put coordinates of head and tail in your vertex buffer
                /* draw two sets of wings in the non-major directions: */
                if (axis !== X) {
                    v = cross(w, axx);
                    v = unit(v)[0];
                    u = cross(v, w);
                    x = head[0] + d * ( u[0] - w[0] );
                    y = head[1] + d * ( u[1] - w[1] );
                    z = head[2] + d * ( u[2] - w[2] );
                    // Put coordinates of head and x,y,z computed above in your vertex buffer
                    vertices.push(head[0], head[1], head[2], x, y, z);
                    x = head[0] + d * ( -1 * u[0] - w[0] );
                    y = head[1] + d * ( -1 * u[1] - w[1] );
                    z = head[2] + d * ( -1 * u[2] - w[2] );
                    // Put coordinates of head and x,y,z computed above in your vertex buffer
                    vertices.push(head[0], head[1], head[2], x, y, z);
                }
                if (axis !== Y) {
                    v = cross(w, ayy);
                    v = unit(v)[0];
                    u = cross(v, w);
                    x = head[0] + d * ( u[0] - w[0] );
                    y = head[1] + d * ( u[1] - w[1] );
                    z = head[2] + d * ( u[2] - w[2] );
                    // Put coordinates of head and x,y,z computed above in your vertex buffer
                    vertices.push(head[0], head[1], head[2], x, y, z);
                    x = head[0] + d * ( -1 * u[0] - w[0] );
                    y = head[1] + d * ( -1 * u[1] - w[1] );
                    z = head[2] + d * ( -1 * u[2] - w[2] );
                    // Put coordinates of head and x,y,z computed above in your vertex buffer
                    vertices.push(head[0], head[1], head[2], x, y, z);
                }
                if (axis !== Z) {
                    v = cross(w, azz);
                    v = unit(v)[0];
                    u = cross( v, w);
                    x = head[0] + d * ( u[0] - w[0] );
                    y = head[1] + d * ( u[1] - w[1] );
                    z = head[2] + d * ( u[2] - w[2] );
                    // Put coordinates of head and x,y,z computed above in your vertex buffer
                    vertices.push(head[0], head[1], head[2], x, y, z);
                    x = head[0] + d * ( -1 * u[0] - w[0] );
                    y = head[1] + d * ( -1 * u[1] - w[1] );
                    z = head[2] + d * ( -1 * u[2] - w[2] );
                    // Put coordinates of head and x,y,z computed above in your vertex buffer
                    vertices.push(head[0], head[1], head[2], x, y, z);
                }
                /* done: */

                const lineColors = [
                    [color[0], color[1], color[2],color[3]],
                    [color[0], color[1], color[2],color[3]],
                    [color[0], color[1], color[2],color[3]],
                    [color[0], color[1], color[2],color[3]],
                    [color[0], color[1], color[2],color[3]],
                    [color[0], color[1], color[2],color[3]],
                    [color[0], color[1], color[2],color[3]],
                    [color[0], color[1], color[2],color[3]],
                    [color[0], color[1], color[2],color[3]],
                    [color[0], color[1], color[2],color[3]],
                ];
                for (let j = 0; j < lineColors.length; ++j) {
                    colors = colors.concat(lineColors[j]);
                }
                indices.push(
                    idx, idx+1,
                    idx+2, idx+3,
                    idx+4, idx+5,
                    idx+6, idx+7,
                    idx+8, idx+9
                );
                idx += 10;
            }
        }
    }

    appState.arrowVertices = vertices;
    appState.arrowColors = colors;
    appState.arrowIndices = indices;
}

function buildStreamlines() {
    let positions = [];
    let indices = [];
    let colors = [];
    let idx = 0;
    for (let i = 0; i < 7; i++) {
        for (let j = 0; j < 7; j++) {
            for (let k = 0; k < 7; k++) {
                let startNode = appState.grid[i][j][k];
                let x = startNode.x;
                let y = startNode.y;
                let z = startNode.z;
                let numSteps = 1000;
                let stepSize = 0.1;

                let forward = 0;
                while (forward < numSteps && inBounds(x, y, z)) {
                        let vec = service.getField1VectorComponentsNormalized(x, y, z);
                        if (getMagnitude(vec[0], vec[1], vec[2]) < Math.pow(10, -6))
                            break;
                        let newX = x + vec[0] * stepSize;
                        let newY = y + vec[1] * stepSize;
                        let newZ = z + vec[2] * stepSize;
                        if (inBounds(newX, newY, newZ)) {
                            positions.push(x, y, z, newX, newY, newZ);
                            indices.push(idx, idx+1);
                            idx += 2;
                            colors.push(1.0, 0.0, 0.0, 1.0, 1.0, 0.0, 0.0, 1.0);
                        }
                        x = newX;
                        y = newY;
                        z = newZ;
                        forward++;
                }

                x = startNode.x;
                y = startNode.y;
                z = startNode.z;
                let backward = 0;
                while (backward < numSteps && inBounds(x, y, z)) {
                    let vec = service.getField1VectorComponentsNormalized(x, y, z);
                    if (getMagnitude(vec[0], vec[1], vec[2]) < Math.pow(10, -6))
                        break;
                    let newX = x - vec[0] * stepSize;
                    let newY = y - vec[1] * stepSize;
                    let newZ = z - vec[2] * stepSize;
                    if (inBounds(newX, newY, newZ)) {
                        positions.push(x, y, z, newX, newY, newZ);
                        indices.push(idx, idx+1);
                        idx += 2;
                        colors.push(1.0, 0.0, 0.0, 1.0, 1.0, 0.0, 0.0, 1.0);
                    }
                    x = newX;
                    y = newY;
                    z = newZ;
                    backward++;
                }
            }
        }
    }
    appState.streamlineVertices = positions;
    appState.streamlineIndices = indices;
    appState.streamlineColors = colors;
}

function inBounds(x, y, z) {
    return x >= -1 && y >= -1 && z >= -1 &&
    x <= 1 && y <= 1 && z <= 1;
}

function drawArrows(modelViewMatrix, projectionMatrix) {
    drawWithBuffer({
        positions: appState.arrowVertices,
        colors: appState.arrowColors,
        indices: appState.arrowIndices
    }, modelViewMatrix, projectionMatrix, gl.LINES);
}

function drawStreamlines(modelViewMatrix, projectionMatrix) {
    drawWithBuffer({
        positions: appState.streamlineVertices,
        colors: appState.streamlineColors,
        indices: appState.streamlineIndices
    }, modelViewMatrix, projectionMatrix, gl.LINES);
}

function drawWithBuffer(buffer, modelViewMatrix, projectionMatrix, mode) {
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(buffer.positions), gl.STATIC_DRAW);

    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(buffer.colors), gl.STATIC_DRAW);

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
        new Uint16Array(buffer.indices), gl.STATIC_DRAW);
    const buffer2 = {
        position: vertexBuffer,
        color: colorBuffer,
        indices: indexBuffer,
    };
    drawModel(buffer2, buffer.indices.length, modelViewMatrix, projectionMatrix, mode);
}

function setMinMaxVectorMags() {
    for (let gridy = 0; gridy < appState.NY; gridy++) {
        for (let gridz = 0; gridz < appState.NZ; gridz++) {
            for (let gridx = 0; gridx < appState.NX; gridx++) {
                let node = appState.grid[gridx][gridy][gridz];
                let field1Mag = node.getField1VectorMag();
                let field2Mag = node.getField2VectorMag();
                let field3Mag = node.getField3VectorMag();
                appState.sMinField1 = Math.min(appState.sMinField1, field1Mag);
                appState.sMaxField1 = Math.max(appState.sMaxField1, field1Mag);
                appState.sMinField2 = Math.min(appState.sMinField2, field2Mag);
                appState.sMaxField2 = Math.max(appState.sMaxField2, field2Mag);
                appState.sMinField3 = Math.min(appState.sMinField3, field3Mag);
                appState.sMaxField3 = Math.max(appState.sMaxField3, field3Mag);
            }
        }
    }
}

function getMagnitude(vx, vy, vz) {
    return Math.sqrt(Math.pow(vx, 2) + Math.pow(vy, 2) + + Math.pow(vz, 2));
}