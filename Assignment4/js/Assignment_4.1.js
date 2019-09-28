import appState from './appstate.js';
import { Assignment4Service } from "./service.js";

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

let service = new Assignment4Service();

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
    appState.allQuads = service.buildQuadsForWholeCube(appState.grid, appState.NX, appState.NY, appState.NZ);
    draw();

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

$('#num_nodes').keyup((e) => {
    delay(function(){
        console.log('new dimension: ', e.target.value);
        let numNodes = parseInt(e.target.value);
        if (numNodes % 2 !== 0) {
            alert('Please enter an even dimension size');
        } else {
            appState.NX = appState.NY = appState.NZ = numNodes;
            appState.grid = service.generateDataGrid(appState.NX, appState.NY, appState.NZ);
            appState.allQuads = service.buildQuadsForWholeCube(appState.grid, appState.NX, appState.NY, appState.NZ);
            draw();
        }
    }, 1000);
});

var delay = (function(){
    var timer = 0;
    return function(callback, ms){
        clearTimeout (timer);
        timer = setTimeout(callback, ms);
    };
})();

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
    drawModel(currentBuffers, currentNumbVertices, modelViewMatrix, projectionMatrix);
    if (appState.areBothSimulationsSelected() || appState.isIsoSurfacingSelected()) {
        drawIsoContour(appState.isoContourData, modelViewMatrix, projectionMatrix);
    }
    if (isAxesShown)
        drawAxes(modelViewMatrix, projectionMatrix);
}

function renderVolumeSlicing() {
    let nodes = [];
    let quads = [];
    let indexOffset = 0;
    if (appState.showXYPlane) {
        let xygrid = service.getXYGrid(appState.grid, appState.NX, appState.NY, appState.fixedZPos, appState.getRanges());
        let xyflat = xygrid.flat(3);
        let xycol = xygrid.length > 0 ? xygrid[0].length : 0;
        let xyquads = service.buildQuads(xyflat, xygrid.length, xycol);
        indexOffset += xyflat.length;
        nodes = nodes.concat(xyflat);
        quads = quads.concat(xyquads);
    }
    if (appState.showYZPlane) {
        let yzgrid = service.getYZGrid(appState.grid, appState.NY, appState.NZ, appState.fixedXPos, appState.getRanges());
        let yzflat = yzgrid.flat(3);
        let yzcol = yzgrid.length > 0 ? yzgrid[0].length : 0;
        let yzquads = service.buildQuads(yzflat, yzgrid.length, yzcol, indexOffset);
        indexOffset += yzflat.length;
        nodes = nodes.concat(yzflat);
        quads = quads.concat(yzquads);
    }
    if (appState.showXZPlane) {
        let xzgrid = service.getXZGrid(appState.grid, appState.NX, appState.NZ, appState.fixedYPos, appState.getRanges());
        let xzflat = xzgrid.flat(3);
        let xzcol = xzgrid.length > 0 ? xzgrid[0].length : 0;
        let xzquads = service.buildQuads(xzflat, xzgrid.length, xzcol, indexOffset);
        nodes = nodes.concat(xzflat);
        quads = quads.concat(xzquads);
    }
    buildDatBuffers(nodes, quads);
    drawScene();
}

function renderIsoSurfacing(sStar) {
    calculateAndStoreIsoContours(appState.allQuads, sStar);
    drawScene();
}

/**
 * Draw the loaded PLY model
 * @param {array} buffers The buffer data contains vertex positions, colors and indices
 * @param {integer} nVertices The number of vertices
 * @param {mat4} modelViewMatrix The model view matrix
 * @param {mat4} projectionMatrix The projection matrix
 */
function drawModel(buffers, nVertices, modelViewMatrix, projectionMatrix) {
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
            gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
        }
    }
}

function buildDatBuffers(nodes, globalMeshes) {
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    var positions = [];
    nodes.forEach((node) => positions.push(node.x, node.y, node.z));
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    var colors = [];
    for (let k = 0; k < nodes.length; k++) {
        const colorScaleFunc = appState.getColorScaleFunc();
        const rgb = colorScaleFunc({sMin: 0, sMax: 100, s: nodes[k].getS()});
        if (!nodes[k].visible) {
            colors.push(0.0, 0.0, 0.0, 0.0);
        } else {
            colors.push(rgb[0], rgb[1], rgb[2], 1.0);
        }
    }
    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

    // Build the element array buffer; this specifies the indices
    // into the vertex arrays for each line's vertices.
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    const indices = [];
    for (let quadIndex in globalMeshes) {
        let quad = globalMeshes[quadIndex];
        let topLeft = quad.edges[0].v1.index;
        let topRight = quad.edges[0].v2.index;
        let bottomRight = quad.edges[2].v1.index;
        let bottomLeft = quad.edges[2].v2.index;
        indices.push(topLeft, topRight, bottomLeft);
        indices.push(topRight, bottomRight, bottomLeft);
    }
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

function drawIsoContour(isoContourData, modelViewMatrix, projectionMatrix) {
    let lineSegCoords = isoContourData.lineSegCoords;
    let connectingIndices = isoContourData.connectingIndicies;
    let vertexIndex = isoContourData.vertexIndex;
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(lineSegCoords), gl.STATIC_DRAW);

    let colors = [];
    for (let i = 0; i <= vertexIndex; i++) {
        colors.push(0.0, 0.0, 0.0, 1.0);
    }
    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(connectingIndices), gl.STATIC_DRAW);

    const buffers = {
        position: positionBuffer,
        color: colorBuffer,
        indices: indexBuffer,
    };

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

    const vertexCount = connectingIndices.length;
    const type = gl.UNSIGNED_SHORT;
    const offset = 0;
    gl.drawElements(gl.LINES, vertexCount, type, offset);
}

function calculateAndStoreIsoContours(quads, sStar) {
    if (quads.length > 0) {
        var lineSegCoords = [];
        var connectingIndicies = [];
        let vertexIndex = 0;
        for (let meshIndex in quads) {
            let quad = quads[meshIndex];
            let intersectingEdges = [];
            for (let edgeIndex in quad.edges) {
                let edge = quad.edges[edgeIndex];
                if (edge.v1.getS() === edge.v2.getS() && edge.v1.getS() !== sStar) {
                    // Account for divide by zero case
                    continue;
                }
                if (edge.v1.getS() === edge.v2.getS() && edge.v1.getS() === sStar) {
                    // Account for edge with same value as isocontour scalar
                    intersectingEdges.push(edge);
                } else if ((sStar > edge.v1.getS() && sStar < edge.v2.getS()) || (sStar < edge.v1.getS() && sStar > edge.v2.getS())) {
                    intersectingEdges.push(edge);
                }
            }
            if (intersectingEdges.length === 1 && intersectingEdges[0].edge.v1.getS() === intersectingEdges[0].edge.v2.getS()) {
                // Account for edge with same value as isocontour scalar
                let edge = intersectingEdges[0];
                lineSegCoords.push(edge.v1.x, edge.v1.y, edge.v1.z);
                lineSegCoords.push(edge.v2.x, edge.v2.y, edge.v2.z);
                connectingIndicies.push(vertexIndex, vertexIndex + 1);
                vertexIndex += 2;
            } else if (intersectingEdges.length === 2) {
                for (let i in intersectingEdges) {
                    let edge = intersectingEdges[i];
                    let interpCoords = interpolateCoords(edge.v1, edge.v2, sStar);
                    lineSegCoords.push(interpCoords.xStar, interpCoords.yStar, interpCoords.zStar);
                    connectingIndicies.push(vertexIndex);
                    vertexIndex++;
                }
            } else if (intersectingEdges.length === 4) {
                // Account for 4 intersections
                console.log('4 intersections');
                let M = 0;
                intersectingEdges.forEach((edge) => {
                    M += edge.v1.getS();
                });
                M /= 4;
                let edge01 = intersectingEdges[2];
                let edge02 = intersectingEdges[3];
                let edge13 = intersectingEdges[1];
                let edge23 = intersectingEdges[0];
                let interpCoords01 = interpolateCoords(edge01.v1, edge01.v2, sStar);
                let interpCoords02 = interpolateCoords(edge02.v1, edge02.v2, sStar);
                let interpCoords13 = interpolateCoords(edge13.v1, edge13.v2, sStar);
                let interpCoords23 = interpolateCoords(edge23.v1, edge23.v2, sStar);
                if (sStar < M) {
                    lineSegCoords.push(interpCoords01.xStar, interpCoords01.yStar, interpCoords01.zStar);
                    lineSegCoords.push(interpCoords02.xStar, interpCoords02.yStar, interpCoords02.zStar);
                    lineSegCoords.push(interpCoords13.xStar, interpCoords13.yStar, interpCoords13.zStar);
                    lineSegCoords.push(interpCoords23.xStar, interpCoords23.yStar, interpCoords23.zStar);
                } else {
                    lineSegCoords.push(interpCoords01.xStar, interpCoords01.yStar, interpCoords01.zStar);
                    lineSegCoords.push(interpCoords13.xStar, interpCoords13.yStar, interpCoords13.zStar);
                    lineSegCoords.push(interpCoords02.xStar, interpCoords02.yStar, interpCoords02.zStar);
                    lineSegCoords.push(interpCoords23.xStar, interpCoords23.yStar, interpCoords23.zStar);
                }
                connectingIndicies.push(vertexIndex, vertexIndex + 1, vertexIndex + 2, vertexIndex + 3);
                vertexIndex += 4;
            }
        }
        appState.isoContourData = {
            vertexIndex: vertexIndex,
            lineSegCoords: lineSegCoords,
            connectingIndicies: connectingIndicies
        };
    }
}

var interpolateCoords = function (vertex1, vertex2, sStar) {
    let v0 = vertex1.getS() < vertex2.getS() ? vertex1 : vertex2;
    let v1 = vertex1.getS() > vertex2.getS() ? vertex1 : vertex2;
    let s0 = v0.getS();
    let s1 = v1.getS();
    let tStar = (sStar - s0) / (s1 - s0);
    let xStar = (1 - tStar) * v0.x + tStar * v1.x;
    let yStar = (1 - tStar) * v0.y + tStar * v1.y;
    let zStar = (1 - tStar) * v0.z + tStar * v1.z;
    return {
        tStar: tStar,
        xStar: xStar,
        yStar: yStar,
        zStar: zStar
    };
};

function draw(reload=false) {
    if (appState.isVolumeSlicingSelected()) {
        renderVolumeSlicing();
    } else if (appState.isIsoSurfacingSelected()) {
        renderIsoSurfacing(appState.isocontourScalar);
    } else if (appState.areBothSimulationsSelected()) {
        renderIsoSurfacing(appState.isocontourScalar);
        renderVolumeSlicing();
    }
}



