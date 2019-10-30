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
        this.z = -4.5;
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
    buildArrowsForAllVectorFields();
    buildStreamlinesForAllVectorFields();
    buildProbeStreamlineForAllVectorFields();
    buildRibbonsForAllVectorFields();

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

var ribbonXPos = $("#ribbon-x-pos").slider({
    min: -1.0,
    max: 1.0,
    step: 0.01,
    value: 0.0,
    focus: true});
ribbonXPos.on("change", function () {
    let index = ribbonXPos.slider('getValue');
    $('#ribbonx-pos_val').text(index);
    appState.xRibbonPosition = parseFloat(index);
    buildRibbonsForAllVectorFields();
});

var ribbonYPos = $("#ribbon-y-pos").slider({
    min: -1.0,
    max: 1.0,
    step: 0.01,
    value: 0.0,
    focus: true});
ribbonYPos.on("change", function () {
    let index = ribbonYPos.slider('getValue');
    $('#ribbony-pos_val').text(index);
    appState.yRibbonPosition = parseFloat(index);
    buildRibbonsForAllVectorFields();
});

var ribbonZPos = $("#ribbon-z-pos").slider({
    min: -1.0,
    max: 1.0,
    step: 0.01,
    value: 0.0,
    focus: true});
ribbonZPos.on("change", function () {
    let index = ribbonZPos.slider('getValue');
    $('#ribbonz-pos_val').text(index);
    appState.zRibbonPosition = parseFloat(index);
    buildRibbonsForAllVectorFields();
});

var xySlider = $("#probe-x-pos").slider({
    min: -1.0,
    max: 1.0,
    step: 0.01,
    value: 0.0,
    focus: true});
xySlider.on("change", function () {
    let index = xySlider.slider('getValue');
    $('#xy-pos_val').text(index);
    appState.xProbePosition = parseFloat(index);
    buildProbeStreamlineForAllVectorFields();
});

var yzSlider = $("#probe-y-pos").slider({
    min: -1.0,
    max: 1.0,
    step: 0.01,
    value: 0.0,
    focus: true});
yzSlider.on("change", function () {
    let index = yzSlider.slider('getValue');
    $('#yz-pos_val').text(index);
    appState.yProbePosition = parseFloat(index);
    buildProbeStreamlineForAllVectorFields();
});

var xzSlider = $("#probe-z-pos").slider({
    min: -1.0,
    max: 1.0,
    step: 0.01,
    value: 0.0,
    focus: true});
xzSlider.on("change", function () {
    let index = xzSlider.slider('getValue');
    $('#xz-pos_val').text(index);
    appState.zProbePosition = parseFloat(index);
    buildProbeStreamlineForAllVectorFields();
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
    cleanScene();
    let selectedField = $("#davim_select_simulation option:selected").val();
    if (selectedField === 'field1') {
        appState.selectField1();
    } else if (selectedField === 'field2') {
        appState.selectField2()
    } else {
        appState.selectField3();
    }
});

/**
 * Change color map
 */
$("#davim_select_color_map").change(function (e) {
    let mode = $("#davim_select_color_map option:selected").val();
    if (mode === 'arrows') {
        appState.selectArrows();
    } else if (mode === 'streamlines') {
        appState.selectStreamlines()
    } else {
        appState.selectRibbon();
    }
});

$('#show_mag_color_plot').change((e) => {
    appState.useEuler = true;
});

$('#show_angle_color_plot').change((e) => {
    appState.useEuler = false;
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
        [0.94, 0.52, 0.2, 1.0],    // x axis: red
        [0.94, 0.52, 0.2, 1.0],
        [0.94, 0.52, 0.2, 1.0],    // y axis: green
        [0.94, 0.52, 0.2, 1.0],
        [0.94, 0.52, 0.2, 1.0],    // z axis: blue
        [0.94, 0.52, 0.2, 1.0],
    ];

    var colors = [];
    for (var j = 0; j < lineColors.length; ++j) {
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
    if (appState.showArrows) {
        drawArrows(modelViewMatrix, projectionMatrix);
    } else if (appState.showStreamlines) {
        drawStreamlines(modelViewMatrix, projectionMatrix);
        drawProbeStreamline(modelViewMatrix, projectionMatrix);
    } else {
        drawRibbon(modelViewMatrix, projectionMatrix);
    }
    if (isAxesShown) {
        drawAxes(modelViewMatrix, projectionMatrix);
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

function buildArrowsForAllVectorFields() {
    let field1 = buildArrows('field1', appState.sMinField1, appState.sMaxField1, (node) => node.getField1VectorMag(), 0.02);
    let field2 = buildArrows('field2', appState.sMinField2, appState.sMaxField2, (node) => node.getField2VectorMag(), 0.1);
    let field3 = buildArrows('field3', appState.sMinField3, appState.sMaxField3, (node) => node.getField3VectorMag(), 0.25);
    appState.field1ArrowVertices = field1.arrowVertices;
    appState.field1ArrowColors = field1.arrowColors;
    appState.field1ArrowIndices = field1.arrowIndices;
    appState.field2ArrowVertices = field2.arrowVertices;
    appState.field2ArrowColors = field2.arrowColors;
    appState.field2ArrowIndices = field2.arrowIndices;
    appState.field3ArrowVertices = field3.arrowVertices;
    appState.field3ArrowColors = field3.arrowColors;
    appState.field3ArrowIndices = field3.arrowIndices;
}

function buildArrows(field, fieldSmin, fieldSmax, vectorMagCmd, arrowScale=1.0) {
    let idx = 0;
    let vertices = [];
    let indices = [];
    let colors = [];
    for (let gridy = 0; gridy < appState.NY; gridy++) {
        for (let gridz = 0; gridz < appState.NZ; gridz++) {
            for (let gridx = 0; gridx < appState.NX; gridx++) {
                let node = appState.grid[gridx][gridy][gridz];
                let vecField = node.vectorFields[field];
                let tail = [node.x, node.y, node.z];
                let headX = node.x + vecField[0] * arrowScale;
                let headY = node.y + vecField[1] * arrowScale;
                let headZ = node.z + vecField[2] * arrowScale;
                let head = [headX, headY, headZ];
                let color = appState.getColorScaleFunc()({
                    sMin: fieldSmin,
                    sMax: fieldSmax,
                    s: vectorMagCmd(node)
                });

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

    return {
        arrowVertices: vertices,
        arrowColors: colors,
        arrowIndices: indices
    };
}

function buildProbeStreamlineForAllVectorFields() {
    let lineColor = [1.0, 0.0, 0.0, 1.0];
    let eulerCmd = (x, y, z, vec, stepSize, fieldId, negative=false) => {
        let direction = negative ? -1 : 1;
        return [x + direction * vec[0] * stepSize, y + direction * vec[1] * stepSize, z + direction * vec[2] * stepSize];
    };
    let field1Euler = buildStreamlineAtPoint(
        appState.xProbePosition, appState.yProbePosition, appState.zProbePosition,
        appState.numSteps, appState.stepSize,
        (x, y, z) => service.getField1VectorComponentsNormalized(x, y, z), 
        eulerCmd, 'field1', 0, lineColor);
    let field2Euler = buildStreamlineAtPoint(
        appState.xProbePosition, appState.yProbePosition, appState.zProbePosition,
        appState.numSteps, appState.stepSize,
        (x, y, z) => service.getField2VectorComponentsNormalized(x, y, z),
        eulerCmd, 'field2', 0, lineColor);
    let field3Euler = buildStreamlineAtPoint(
        appState.xProbePosition, appState.yProbePosition, appState.zProbePosition,
        appState.numSteps, appState.stepSize,
        (x, y, z) => service.getField3VectorComponentsNormalized(x, y, z),
        eulerCmd, 'field3', 0, lineColor);
    appState.field1ProbeStreamlineVerticesEuler = field1Euler.streamlineVertices;
    appState.field1ProbeStreamlineColorsEuler = field1Euler.streamlineColors;
    appState.field1ProbeStreamlineIndicesEuler = field1Euler.streamlineIndices;
    appState.field2ProbeStreamlineVerticesEuler = field2Euler.streamlineVertices;
    appState.field2ProbeStreamlineColorsEuler = field2Euler.streamlineColors;
    appState.field2ProbeStreamlineIndicesEuler = field2Euler.streamlineIndices;
    appState.field3ProbeStreamlineVerticesEuler = field3Euler.streamlineVertices;
    appState.field3ProbeStreamlineColorsEuler = field3Euler.streamlineColors;
    appState.field3ProbeStreamlineIndicesEuler = field3Euler.streamlineIndices;

    let rk2Cmd = (x, y, z, vec, stepSize, fieldId, negative=false) => {
        let direction = negative ? -1 : 1;
        let tempPos = [x + direction * vec[0] * stepSize, y + direction * vec[1] * stepSize, z + direction * vec[2] * stepSize];
        let tempVec = [];
        if (fieldId === 'field1') {
            tempVec = service.getField1VectorComponentsNormalized(tempPos[0], tempPos[1], tempPos[2]);
        } else if (fieldId === 'field2') {
            tempVec = service.getField2VectorComponentsNormalized(tempPos[0], tempPos[1], tempPos[2]);
        } else {
            tempVec = service.getField3VectorComponentsNormalized(tempPos[0], tempPos[1], tempPos[2]);
        }
        vec[0] = (vec[0] + tempVec[0]) / 2;
        vec[1] = (vec[1] + tempVec[1]) / 2;
        vec[2] = (vec[2] + tempVec[2]) / 2;
        return [x + direction * vec[0] * stepSize, y + direction * vec[1] * stepSize, z + direction * vec[2] * stepSize];
    };
    let field1RK2 = buildStreamlineAtPoint(
        appState.xProbePosition, appState.yProbePosition, appState.zProbePosition,
        appState.numSteps, appState.stepSize,
        (x, y, z) => service.getField1VectorComponentsNormalized(x, y, z),
        rk2Cmd, 'field1', 0, lineColor);
    let field2RK2 = buildStreamlineAtPoint(
        appState.xProbePosition, appState.yProbePosition, appState.zProbePosition,
        appState.numSteps, appState.stepSize,
        (x, y, z) => service.getField2VectorComponentsNormalized(x, y, z),
        rk2Cmd, 'field2', 0, lineColor);
    let field3RK2 = buildStreamlineAtPoint(
        appState.xProbePosition, appState.yProbePosition, appState.zProbePosition,
        appState.numSteps, appState.stepSize,
        (x, y, z) => service.getField3VectorComponentsNormalized(x, y, z),
        rk2Cmd, 'field3', 0, lineColor);
    appState.field1ProbeStreamlineVerticesRK2 = field1RK2.streamlineVertices;
    appState.field1ProbeStreamlineColorsRK2 = field1RK2.streamlineColors;
    appState.field1ProbeStreamlineIndicesRK2 = field1RK2.streamlineIndices;
    appState.field2ProbeStreamlineVerticesRK2 = field2RK2.streamlineVertices;
    appState.field2ProbeStreamlineColorsRK2 = field2RK2.streamlineColors;
    appState.field2ProbeStreamlineIndicesRK2 = field2RK2.streamlineIndices;
    appState.field3ProbeStreamlineVerticesRK2 = field3RK2.streamlineVertices;
    appState.field3ProbeStreamlineColorsRK2 = field3RK2.streamlineColors;
    appState.field3ProbeStreamlineIndicesRK2 = field3RK2.streamlineIndices;
}

function buildStreamlinesForAllVectorFields() {
    let eulerCmd = (x, y, z, vec, stepSize, fieldId, negative=false) => {
        let direction = negative ? -1 : 1;
        return [x + direction * vec[0] * stepSize, y + direction * vec[1] * stepSize, z + direction * vec[2] * stepSize];
    };
    let field1Euler = buildStreamlines(
        (x, y, z) => service.getField1VectorComponentsNormalized(x, y, z), eulerCmd, 'field1');
    let field2Euler = buildStreamlines((x, y, z) => service.getField2VectorComponentsNormalized(x, y, z), eulerCmd, 'field2');
    let field3Euler = buildStreamlines((x, y, z) => service.getField3VectorComponentsNormalized(x, y, z), eulerCmd, 'field3');
    appState.field1StreamlineVerticesEuler = field1Euler.streamlineVertices;
    appState.field1StreamlineColorsEuler = field1Euler.streamlineColors;
    appState.field1StreamlineIndicesEuler = field1Euler.streamlineIndices;
    appState.field2StreamlineVerticesEuler = field2Euler.streamlineVertices;
    appState.field2StreamlineColorsEuler = field2Euler.streamlineColors;
    appState.field2StreamlineIndicesEuler = field2Euler.streamlineIndices;
    appState.field3StreamlineVerticesEuler = field3Euler.streamlineVertices;
    appState.field3StreamlineColorsEuler = field3Euler.streamlineColors;
    appState.field3StreamlineIndicesEuler = field3Euler.streamlineIndices;

    let rk2Cmd = (x, y, z, vec, stepSize, fieldId, negative=false) => {
        let direction = negative ? -1 : 1;
        let tempPos = [x + direction * vec[0] * stepSize, y + direction * vec[1] * stepSize, z + direction * vec[2] * stepSize];
        let tempVec = [];
        if (fieldId === 'field1') {
            tempVec = service.getField1VectorComponentsNormalized(tempPos[0], tempPos[1], tempPos[2]);
        } else if (fieldId === 'field2') {
            tempVec = service.getField2VectorComponentsNormalized(tempPos[0], tempPos[1], tempPos[2]);
        } else {
            tempVec = service.getField3VectorComponentsNormalized(tempPos[0], tempPos[1], tempPos[2]);
        }
        vec[0] = (vec[0] + tempVec[0]) / 2;
        vec[1] = (vec[1] + tempVec[1]) / 2;
        vec[2] = (vec[2] + tempVec[2]) / 2;
        return [x + direction * vec[0] * stepSize, y + direction * vec[1] * stepSize, z + direction * vec[2] * stepSize];
    };
    let field1RK2 = buildStreamlines(
        (x, y, z) => service.getField1VectorComponentsNormalized(x, y, z), rk2Cmd, 'field1');
    let field2RK2 = buildStreamlines((x, y, z) => service.getField2VectorComponentsNormalized(x, y, z), rk2Cmd, 'field2');
    let field3RK2 = buildStreamlines((x, y, z) => service.getField3VectorComponentsNormalized(x, y, z), rk2Cmd, 'field3');
    appState.field1StreamlineVerticesRK2 = field1RK2.streamlineVertices;
    appState.field1StreamlineColorsRK2 = field1RK2.streamlineColors;
    appState.field1StreamlineIndicesRK2 = field1RK2.streamlineIndices;
    appState.field2StreamlineVerticesRK2 = field2RK2.streamlineVertices;
    appState.field2StreamlineColorsRK2 = field2RK2.streamlineColors;
    appState.field2StreamlineIndicesRK2 = field2RK2.streamlineIndices;
    appState.field3StreamlineVerticesRK2 = field3RK2.streamlineVertices;
    appState.field3StreamlineColorsRK2 = field3RK2.streamlineColors;
    appState.field3StreamlineIndicesRK2 = field3RK2.streamlineIndices;
}

function buildStreamlines(vectorFieldComputeCmd, integrationCmd, fieldId) {
    let positions = [];
    let indices = [];
    let colors = [];
    let idx = 0;
    for (let i = 0; i < appState.NX; i++) {
        for (let j = 0; j < appState.NY; j++) {
            for (let k = 0; k < appState.NZ; k++) {
                let startNode = appState.grid[i][j][k];
                let x = startNode.x;
                let y = startNode.y;
                let z = startNode.z;
                let numSteps = appState.numSteps;
                let stepSize = appState.stepSize;

                let streamData = buildStreamlineAtPoint(x, y, z, numSteps, stepSize, vectorFieldComputeCmd, integrationCmd, fieldId, idx);
                positions = positions.concat(streamData.streamlineVertices);
                indices = indices.concat(streamData.streamlineIndices);
                colors = colors.concat(streamData.streamlineColors);
                idx += streamData.streamlineIndices.length;
            }
        }
    }
    return {
        streamlineVertices: positions,
        streamlineIndices: indices,
        streamlineColors: colors
    };
}

function buildStreamlineAtPoint(x, y, z, numSteps, stepSize, vectorFieldComputeCmd, integrationCmd, fieldId, idx, lineColor=[0.45, 0.98, 0.99, 1.0]) {
    let positions = [];
    let colors = [];
    let indices = [];
    let tempX = x;
    let tempY = y;
    let tempZ = z;
    
    let forward = 0;
    while (forward < numSteps && inBounds(tempX, tempY, tempZ)) {
        let vec = vectorFieldComputeCmd(tempX, tempY, tempZ);
        if (getMagnitude(vec[0], vec[1], vec[2]) < Math.pow(10, -6))
            break;
        let integrationResult = integrationCmd(tempX, tempY, tempZ, vec, stepSize, fieldId);
        let newX = integrationResult[0];
        let newY = integrationResult[1];
        let newZ = integrationResult[2];
        if (inBounds(newX, newY, newZ)) {
            positions.push(tempX, tempY, tempZ, newX, newY, newZ);
            indices.push(idx, idx+1);
            idx += 2;
            colors.push(...lineColor, ...lineColor);
        }
        tempX = newX;
        tempY = newY;
        tempZ = newZ;
        forward++;
    }

    tempX = x;
    tempY = y;
    tempZ = z;
    let backward = 0;
    while (backward < numSteps && inBounds(tempX, tempY, tempZ)) {
        let vec = vectorFieldComputeCmd(tempX, tempY, tempZ);
        if (getMagnitude(vec[0], vec[1], vec[2]) < Math.pow(10, -6))
            break;
        let integrationResult = integrationCmd(tempX, tempY, tempZ, vec, stepSize, fieldId, true);
        let newX = integrationResult[0];
        let newY = integrationResult[1];
        let newZ = integrationResult[2];
        if (inBounds(newX, newY, newZ)) {
            positions.push(tempX, tempY, tempZ, newX, newY, newZ);
            indices.push(idx, idx+1);
            idx += 2;
            colors.push(...lineColor, ...lineColor);
        }
        tempX = newX;
        tempY = newY;
        tempZ = newZ;
        backward++;
    }

    return {
        streamlineVertices: positions,
        streamlineIndices: indices,
        streamlineColors: colors
    };
}

function inBounds(x, y, z) {
    return x >= -1 && y >= -1 && z >= -1 &&
    x <= 1 && y <= 1 && z <= 1;
}

function buildRibbonsForAllVectorFields() {
    let eulerCmd = (x, y, z, vec, stepSize, fieldId, negative=false) => {
        let direction = negative ? -1 : 1;
        return [x + direction * vec[0] * stepSize, y + direction * vec[1] * stepSize, z + direction * vec[2] * stepSize];
    };
    let field1Euler = buildStreamRibbon(
        (x, y, z) => service.getField1VectorComponentsNormalized(x, y, z), eulerCmd, 'field1');
    let field2Euler = buildStreamRibbon((x, y, z) => service.getField2VectorComponentsNormalized(x, y, z), eulerCmd, 'field2');
    let field3Euler = buildStreamRibbon((x, y, z) => service.getField3VectorComponentsNormalized(x, y, z), eulerCmd, 'field3');
    appState.field1RibbonVerticesEuler = field1Euler.positions;
    appState.field1RibbonColorsEuler = field1Euler.colors;
    appState.field1RibbonIndicesEuler = field1Euler.indices;
    appState.field2RibbonVerticesEuler = field2Euler.positions;
    appState.field2RibbonColorsEuler = field2Euler.colors;
    appState.field2RibbonIndicesEuler = field2Euler.indices;
    appState.field3RibbonVerticesEuler = field3Euler.positions;
    appState.field3RibbonColorsEuler = field3Euler.colors;
    appState.field3RibbonIndicesEuler = field3Euler.indices;

    let rk2Cmd = (x, y, z, vec, stepSize, fieldId, negative=false) => {
        let direction = negative ? -1 : 1;
        let tempPos = [x + direction * vec[0] * stepSize, y + direction * vec[1] * stepSize, z + direction * vec[2] * stepSize];
        let tempVec = [];
        if (fieldId === 'field1') {
            tempVec = service.getField1VectorComponentsNormalized(tempPos[0], tempPos[1], tempPos[2]);
        } else if (fieldId === 'field2') {
            tempVec = service.getField2VectorComponentsNormalized(tempPos[0], tempPos[1], tempPos[2]);
        } else {
            tempVec = service.getField3VectorComponentsNormalized(tempPos[0], tempPos[1], tempPos[2]);
        }
        vec[0] = (vec[0] + tempVec[0]) / 2;
        vec[1] = (vec[1] + tempVec[1]) / 2;
        vec[2] = (vec[2] + tempVec[2]) / 2;
        return [x + direction * vec[0] * stepSize, y + direction * vec[1] * stepSize, z + direction * vec[2] * stepSize];
    };
    let field1RK2 = buildStreamRibbon(
        (x, y, z) => service.getField1VectorComponentsNormalized(x, y, z), rk2Cmd, 'field1');
    let field2RK2 = buildStreamRibbon((x, y, z) => service.getField2VectorComponentsNormalized(x, y, z), rk2Cmd, 'field2');
    let field3RK2 = buildStreamRibbon((x, y, z) => service.getField3VectorComponentsNormalized(x, y, z), rk2Cmd, 'field3');
    appState.field1RibbonVerticesRK2 = field1RK2.positions;
    appState.field1RibbonColorsRK2 = field1RK2.colors;
    appState.field1RibbonIndicesRK2 = field1RK2.indices;
    appState.field2RibbonVerticesRK2 = field2RK2.positions;
    appState.field2RibbonColorsRK2 = field2RK2.colors;
    appState.field2RibbonIndicesRK2 = field2RK2.indices;
    appState.field3RibbonVerticesRK2 = field3RK2.positions;
    appState.field3RibbonColorsRK2 = field3RK2.colors;
    appState.field3RibbonIndicesRK2 = field3RK2.indices;
}

function buildStreamRibbon(vectorFieldComputeCmd, integrationCmd, fieldId, lineColor=[0.0, 1.0, 0.0, 1.0]) {
    let primaryPointX = appState.xRibbonPosition;
    let primaryPointY = appState.yRibbonPosition;
    let primaryPointZ = appState.zRibbonPosition;
    let secondaryPointX = appState.xRibbonPosition;
    let secondaryPointY = appState.yRibbonPosition;
    let secondaryPointZ = appState.zRibbonPosition + 0.2;

    let positions = [];
    let indices = [];
    let colors = [];
    let numSteps = appState.numSteps;
    let stepSize = appState.stepSize;

    let primaryLine = buildStreamlineAtPoint(primaryPointX, primaryPointY, primaryPointZ, numSteps, stepSize, vectorFieldComputeCmd, integrationCmd, fieldId, lineColor);
    let secondaryLine = buildStreamlineAtPoint(secondaryPointX, secondaryPointY, secondaryPointZ, numSteps, stepSize, vectorFieldComputeCmd, integrationCmd, fieldId, lineColor);

    let len = Math.min(primaryLine.streamlineVertices.length, secondaryLine.streamlineVertices.length);
    let quadIndex = 0;
    for (let i = 0; i < len; i+=6) {
        positions = positions.concat(primaryLine.streamlineVertices.slice(i, i+6));
        positions = positions.concat(secondaryLine.streamlineVertices.slice(i, i+6));
        indices.push(quadIndex+2, quadIndex+3, quadIndex); // First triangle of quad;
        indices.push(quadIndex+3, quadIndex+1, quadIndex); // Second triangle of quad;
        quadIndex += 4;
        colors.push(...lineColor, ...lineColor, ...lineColor, ...lineColor);
    }
    
    return {
        positions: positions,
        colors: colors,
        indices: indices
    };
}

function drawArrows(modelViewMatrix, projectionMatrix) {
    let buffer = {
        positions: appState.field3ArrowVertices,
        colors: appState.field3ArrowColors,
        indices: appState.field3ArrowIndices
    };
    if (appState.showField1) {
        buffer.positions = appState.field1ArrowVertices;
        buffer.colors = appState.field1ArrowColors;
        buffer.indices = appState.field1ArrowIndices;
    } else if (appState.showField2) {
        buffer.positions = appState.field2ArrowVertices;
        buffer.colors = appState.field2ArrowColors;
        buffer.indices = appState.field2ArrowIndices;
    }
    drawWithBuffer(buffer, modelViewMatrix, projectionMatrix, gl.LINES);
}

function drawStreamlines(modelViewMatrix, projectionMatrix) {
    let buffer = {};
    if (appState.useEuler) {
        buffer = {
            positions: appState.field3StreamlineVerticesEuler,
            colors: appState.field3StreamlineColorsEuler,
            indices: appState.field3StreamlineIndicesEuler
        };
        if (appState.showField1) {
            buffer.positions = appState.field1StreamlineVerticesEuler;
            buffer.colors = appState.field1StreamlineColorsEuler;
            buffer.indices = appState.field1StreamlineIndicesEuler;
        } else if (appState.showField2) {
            buffer.positions = appState.field2StreamlineVerticesEuler;
            buffer.colors = appState.field2StreamlineColorsEuler;
            buffer.indices = appState.field2StreamlineIndicesEuler;
        }
    } else {
        buffer = {
            positions: appState.field3StreamlineVerticesRK2,
            colors: appState.field3StreamlineColorsRK2,
            indices: appState.field3StreamlineIndicesRK2
        };
        if (appState.showField1) {
            buffer.positions = appState.field1StreamlineVerticesRK2;
            buffer.colors = appState.field1StreamlineColorsRK2;
            buffer.indices = appState.field1StreamlineIndicesRK2;
        } else if (appState.showField2) {
            buffer.positions = appState.field2StreamlineVerticesRK2;
            buffer.colors = appState.field2StreamlineColorsRK2;
            buffer.indices = appState.field2StreamlineIndicesRK2;
        }
    }

    drawWithBuffer(buffer, modelViewMatrix, projectionMatrix, gl.LINES);
}

function drawProbeStreamline(modelViewMatrix, projectionMatrix) {
    let buffer = {};
    if (appState.useEuler) {
        buffer = {
            positions: appState.field3ProbeStreamlineVerticesEuler,
            colors: appState.field3ProbeStreamlineColorsEuler,
            indices: appState.field3ProbeStreamlineIndicesEuler
        };
        if (appState.showField1) {
            buffer.positions = appState.field1ProbeStreamlineVerticesEuler;
            buffer.colors = appState.field1ProbeStreamlineColorsEuler;
            buffer.indices = appState.field1ProbeStreamlineIndicesEuler;
        } else if (appState.showField2) {
            buffer.positions = appState.field2ProbeStreamlineVerticesEuler;
            buffer.colors = appState.field2ProbeStreamlineColorsEuler;
            buffer.indices = appState.field2ProbeStreamlineIndicesEuler;
        }
    } else {
        buffer = {
            positions: appState.field3ProbeStreamlineVerticesRK2,
            colors: appState.field3ProbeStreamlineColorsRK2,
            indices: appState.field3ProbeStreamlineIndicesRK2
        };
        if (appState.showField1) {
            buffer.positions = appState.field1ProbeStreamlineVerticesRK2;
            buffer.colors = appState.field1ProbeStreamlineColorsRK2;
            buffer.indices = appState.field1ProbeStreamlineIndicesRK2;
        } else if (appState.showField2) {
            buffer.positions = appState.field2ProbeStreamlineVerticesRK2;
            buffer.colors = appState.field2ProbeStreamlineColorsRK2;
            buffer.indices = appState.field2ProbeStreamlineIndicesRK2;
        }
    }

    drawWithBuffer(buffer, modelViewMatrix, projectionMatrix, gl.LINES);
}

function drawRibbon(modelViewMatrix, projectionMatrix) {
    let buffer = {};
    if (appState.useEuler) {
        buffer = {
            positions: appState.field3RibbonVerticesEuler,
            colors: appState.field3RibbonColorsEuler,
            indices: appState.field3RibbonIndicesEuler
        };
        if (appState.showField1) {
            buffer.positions = appState.field1RibbonVerticesEuler;
            buffer.colors = appState.field1RibbonColorsEuler;
            buffer.indices = appState.field1RibbonIndicesEuler;
        } else if (appState.showField2) {
            buffer.positions = appState.field2RibbonVerticesEuler;
            buffer.colors = appState.field2RibbonColorsEuler;
            buffer.indices = appState.field2RibbonIndicesEuler;
        }
    } else {
        buffer = {
            positions: appState.field3RibbonVerticesRK2,
            colors: appState.field3RibbonColorsRK2,
            indices: appState.field3RibbonIndicesRK2
        };
        if (appState.showField1) {
            buffer.positions = appState.field1RibbonVerticesRK2;
            buffer.colors = appState.field1RibbonColorsRK2;
            buffer.indices = appState.field1RibbonIndicesRK2;
        } else if (appState.showField2) {
            buffer.positions = appState.field2RibbonVerticesRK2;
            buffer.colors = appState.field2RibbonColorsRK2;
            buffer.indices = appState.field2RibbonIndicesRK2;
        }
    }

    drawWithBuffer(buffer, modelViewMatrix, projectionMatrix, gl.TRIANGLES);
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