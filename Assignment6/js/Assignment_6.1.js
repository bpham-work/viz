import {PLYLoader} from './plyLoader.js';
import appstate from "./appstate.js";

/* ----------------------------------------------------------------------*/
/* --------------------- Global Variables -------------------------------*/
/* ----------------------------------------------------------------------*/
var mat4 = glMatrix.mat4;
var canvas = document.querySelector('#glcanvas');
canvas.width = $("#glcanvas").parent().width();

var gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
var programInfo, programTextureInfo;
var currentBuffers;
var currentNumbVertices;
var isShowAxes = true;
var isShowModel = false;
const CameraModes = {
    PERSPECTIVE: 'PERSPECTIVE',
    ORTHOGRAPHIC: 'ORTHOGRAPHIC',
};
var cameraMode = CameraModes.PERSPECTIVE;

var gui;

class TransformationParameters {
    constructor() {
        this.angleX = 0.0;
        this.angleY = 0.0;
        this.angleZ = 0.0;
        this.x = 0;
        this.y = 0;
        this.z = 0;
    }
}

var transform = new TransformationParameters();

/* --------------------------------------------------------------------*/
/* --------------------- Initialization -------------------------------*/
/* --------------------------------------------------------------------*/

// Initialize webGL context
initializeWebGL();
// Add GUI menu
// addGUI();


/**
 * Add GUI controls in the left-right positon of WebGL canvas
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
    //gui_interactor.open();
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

    const vsTextureSource = `
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

    const fsTextureSource = `
    varying highp vec2 vTextureCoord;
    uniform sampler2D uSampler;

    void main(void) {
      gl_FragColor = texture2D(uSampler, vTextureCoord);
    }
  `;

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
    const shaderTextureProgram = initShaderProgram(gl, vsTextureSource, fsTextureSource);

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

    programTextureInfo = {
        program: shaderTextureProgram,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(shaderTextureProgram, 'aVertexPosition'),
            textureCoord: gl.getAttribLocation(shaderTextureProgram, 'aTextureCoord'),

        },
        uniformLocations: {
            projectionMatrix: gl.getUniformLocation(shaderTextureProgram, 'uProjectionMatrix'),
            modelViewMatrix: gl.getUniformLocation(shaderTextureProgram, 'uModelViewMatrix'),
            uSampler: gl.getUniformLocation(shaderTextureProgram, 'uSampler'),

        },
    };

    // Try to load a sample data and visualize it.
    // Load and draw model
    load_and_draw_ply_model(appstate.modelPath);

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

/**
 * Show or hide axes
 */
$("#davim_set_axes").click(function () {
    if ($('#davim_set_axes').is(':checked')) {
        isShowAxes = true;
    } else {
        isShowAxes = false;
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
 * Change PLY models
 */
$("#davim_select_model").change(function () {
    // Step 1:  Clean the scene
    cleanScene();

    // Step 2: Load the selected model
    $("#davim_select_model option:selected").each(function () {

        // Get the file name
        var ply_name = $(this).val() + ".ply";
        var ply_path = "./models/" + ply_name;
        appstate.modelPath = ply_path;

        // Load and draw model
        load_and_draw_ply_model(appstate.modelPath);

    });
});

$('#show_mag_color_plot').change((e) => {
    appstate.showVectorMagColorPlot = e.target.checked;
    appstate.showVecMagColorPlot();
});

$('#show_angle_color_plot').change((e) => {
    appstate.showVectorAngleColorPlot = e.target.checked;
    appstate.showVecAngleColorPlot();
});

$('#show_x_color_plot').change((e) => {
    appstate.showVectorXColorPlot = e.target.checked;
    appstate.showVecXColorPlot();
});

$('#show_y_color_plot').change((e) => {
    appstate.showVectorYColorPlot = e.target.checked;
    appstate.showVecYColorPlot();
});


/**
 * Change color map
 */
$("#davim_select_color_map").change(function (e) {
    let colorMap = e.target.value;
    appstate.colorScale = colorMap;
    load_and_draw_ply_model(appstate.modelPath);
});


/* ---------------------------------------------------------------------------*/
/* ----------------------- WebGL Rendering Functions -------------------------*/
/* ---------------------------------------------------------------------------*/

var currentColorPlotBuffers;

/**
 * Load the input model and draw it in the WebGL scene
 * @param {string} ply_path Path to the ply file
 */
function load_and_draw_ply_model(ply_path) {
    var loader = new PLYLoader();
    loader.load(ply_path, function (ply_data) {
        appstate.positions = ply_data.attributes.position.array;
        appstate.vectorValues = ply_data.attributes.velocityVector.array;
        for (let i = 0; i < appstate.vectorValues.length; i+=3) {
            let vx = appstate.vectorValues[i];
            let vy = appstate.vectorValues[i+1];
            let norm = getMagnitude(vx, vy);
            appstate.vectorValues[i] = vx / norm;
            appstate.vectorValues[i+1] = vy / norm;
        }

        // Create a buffer for the vertex positions.
        const positionBuffer = gl.createBuffer();

        // Select the positionBuffer as the one to apply buffer
        // operations to from here out.

        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

        // Now create an array of positions for the model.

        const positions = ply_data.attributes.position.array;

        // Now pass the list of positions into WebGL to build the
        // shape. We do this by creating a Float32Array from the
        // JavaScript array, then use it to fill the current buffer.

        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

        // Now set up the colors for the vertices.
        // I have created a dummy scalarField array with all the values as 0 and computed color of vertices
        // based on that (It's all white). But once you modify plyLoader.js according to instructions in assignment-2
        // you should be able to access scalarField from geometry.attributes, using this array if you compute
        // colors it will look beautifull, just like what we shown you in class.
        const colors = Array(4 * positions.length / 3).fill(0);

        const colorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

        // Build the element array buffer; this specifies the indices
        // into the vertex arrays for each face's vertices.

        const indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        const vertex_indices = ply_data.index.array;

        // Now send the element array to GL

        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
            new Uint16Array(vertex_indices), gl.STATIC_DRAW);

        const buffers = {
            position: positionBuffer,
            indices: indexBuffer,
            color: colorBuffer
        };

        // Update drawing buffers
        currentNumbVertices = vertex_indices.length;
        currentBuffers = buffers;

        setMaxMinVectorValues();
        let arrowScale = 0.05;
        if (appstate.modelPath.includes('dipole')) {
            arrowScale = 0.01;
        }
        buildArrows(appstate.positions, appstate.vectorValues, arrowScale);
        render_vec_img();
        gen_noise_tex();
        computeLICImage();
    });
}

function setMaxMinVectorValues() {
    for (let i = 0; i < appstate.vectorValues.length; i += 3) {
        let vx = appstate.vectorValues[i];
        let vy = appstate.vectorValues[i + 1];
        appstate.maxVX = Math.max(vx, appstate.maxVX);
        appstate.minVX = Math.min(vx, appstate.minVX);
        appstate.maxVY = Math.max(vy, appstate.maxVY);
        appstate.minVY = Math.min(vy, appstate.minVY);

        let x = appstate.positions[i];
        let y = appstate.positions[i+1];
        appstate.maxX = Math.max(x, appstate.maxX);
        appstate.minX = Math.min(x, appstate.minX);
        appstate.maxY = Math.max(y, appstate.maxY);
        appstate.minY = Math.min(y, appstate.minY);
    }
}

function drawColorPlot(vectorValues, modelViewMatrix, projectionMatrix) {
    if (currentBuffers) {
        if (appstate.showVectorMagColorPlot) {
            let colorBuffer = getVectorMagColorBuffer(vectorValues);
            currentBuffers.color = colorBuffer;
            drawSceneWithoutClearing(modelViewMatrix, projectionMatrix);
        } else if (appstate.showVectorAngleColorPlot) {
            let colorBuffer = getVectorAngleColorBuffer(vectorValues);
            currentBuffers.color = colorBuffer;
            drawSceneWithoutClearing();
        } else if (appstate.showVectorXColorPlot) {
            let colorBuffer = getVectorXColorPlot(vectorValues);
            currentBuffers.color = colorBuffer;
            drawSceneWithoutClearing(modelViewMatrix, projectionMatrix);
        } else if (appstate.showVectorYColorPlot) {
            let colorBuffer = getVectorYColorPlot(vectorValues);
            currentBuffers.color = colorBuffer;
            drawSceneWithoutClearing(modelViewMatrix, projectionMatrix);
        }
    }
}

function getMagnitude(vx, vy) {
    return Math.sqrt(Math.pow(vx, 2) + Math.pow(vy, 2));
}

function getVectorMagColorBuffer(vectorValues) {
    let vectorMagnitudes = [];
    for (let k = 0; k < vectorValues.length; k += 3) {
        let vx = vectorValues[k];
        let vy = vectorValues[k + 1];
        let magnitude = getMagnitude(vx, vy);
        vectorMagnitudes.push(magnitude);
    }
    const minimum = Math.min(...vectorMagnitudes);
    const maximum = Math.max(...vectorMagnitudes);

    let colors = [];
    for (let k = 0; k < vectorMagnitudes.length; k++) {
        let rgb = appstate.getColorScaleFunc()({sMin: minimum, sMax: maximum, s: vectorMagnitudes[k]});
        colors.push(rgb[0], rgb[1], rgb[2], 1.0);
    }

    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    return colorBuffer;
}

function getVectorAngleColorBuffer(vectorValues) {
    // TODO: ask professor
}

function getVectorXColorPlot(vectorValues) {
    let xVals = [];
    for (let k = 0; k < vectorValues.length; k += 3) {
        let vx = vectorValues[k];
        xVals.push(vx);
    }
    const minimum = Math.min(...xVals);
    const maximum = Math.max(...xVals);

    let colors = [];
    for (let k = 0; k < xVals.length; k++) {
        let rgb = appstate.getColorScaleFunc()({sMin: minimum, sMax: maximum, s: xVals[k]});
        colors.push(rgb[0], rgb[1], rgb[2], 1.0);
    }

    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    return colorBuffer;
}

function getVectorYColorPlot(vectorValues) {
    let yVals = [];
    for (let k = 0; k < vectorValues.length; k += 3) {
        let vy = vectorValues[k + 1];
        yVals.push(vy);
    }
    const minimum = Math.min(...yVals);
    const maximum = Math.max(...yVals);

    let colors = [];
    for (let k = 0; k < yVals.length; k++) {
        let rgb = appstate.getColorScaleFunc()({sMin: minimum, sMax: maximum, s: yVals[k]});
        colors.push(rgb[0], rgb[1], rgb[2], 1.0);
    }

    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    return colorBuffer;
}

function drawArrows(modelViewMatrix, projectionMatrix) {
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(appstate.arrowPositions), gl.STATIC_DRAW);
    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(appstate.arrowColors), gl.STATIC_DRAW);
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(appstate.arrowIndices), gl.STATIC_DRAW);
    var nVertices = appstate.arrowIndices.length;

    // Now, draw axes
    {
        const numComponents = 3;
        const type = gl.FLOAT;
        const normalize = false;
        const stride = 0;
        const offset = 0;
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
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
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
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
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

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
    gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
    gl.clearDepth(1.0);                 // Clear everything
    gl.enable(gl.DEPTH_TEST);           // Enable depth testing
    gl.depthFunc(gl.LEQUAL);            // Near things obscure far things

    // Clear the canvas before we start drawing on it.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

function drawSceneWithoutClearing(modelViewMatrix, projectionMatrix) {
    drawModel(currentBuffers, currentNumbVertices, modelViewMatrix, projectionMatrix);
}

/**
 * Draw the scene
 */
const IMG_RES = 512;
let noise_tex = new Uint8Array(IMG_RES * IMG_RES * 3);
let vec_img = new Uint8Array(IMG_RES * IMG_RES * 4);
let LIC_tex = new Uint8Array(IMG_RES * IMG_RES * 4);

function drawScene() {
    canvas.width = IMG_RES;
    canvas.height = IMG_RES;
    gl.viewport(0, 0, IMG_RES, IMG_RES);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
    gl.clearDepth(1.0);                 // Clear everything
    gl.enable(gl.DEPTH_TEST);           // Enable depth testing
    gl.depthFunc(gl.LEQUAL);            // Near things obscure far things

    // Clear the canvas before we start drawing on it.

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const projectionMatrix = mat4.create();

    //Generates a orthogonal projection matrix with the given bounds

    const left = 0;
    const right = 1;
    const bottom = 0;
    const top = 1;
    const zNear = 0.1;
    const zFar = 100;
    mat4.ortho(projectionMatrix,
        left,
        right,
        bottom,
        top,
        zNear,
        zFar);

    // Set the drawing position to the "identity" point, which is
    // the center of the scene.
    const modelViewMatrix = mat4.create();
    // Update the model view matrix if there are some changes in translation and rotation
    mat4.translate(modelViewMatrix,     // destination matrix
        modelViewMatrix,     // matrix to translate
        [0, 0., -1]);  // amount to translate

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

    // drawModel(currentBuffers, currentNumbVertices, modelViewMatrix, projectionMatrix);
    if (appstate.showColorPlot) {
        drawColorPlot(appstate.vectorValues, modelViewMatrix, projectionMatrix);
    } else if (appstate.showLIC) {
        drawLICImage(modelViewMatrix, projectionMatrix);
    }
    if (appstate.showArrows) {
        drawArrows(modelViewMatrix, projectionMatrix);
    }
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

function rotate2D_around_point(x, y, cx, cy, angle_in_radian) {
    var xTemp = x - cx;
    var yTemp = y - cy;
    var rotatedX = xTemp * Math.cos(angle_in_radian) - yTemp * Math.sin(angle_in_radian);
    var rotatedY = xTemp * Math.sin(angle_in_radian) + yTemp * Math.cos(angle_in_radian);
    return {x: rotatedX + cx, y: rotatedY + cy};
}

/**
 *  Draw textures to the screen
 * @param {*} targetTexture
 * @param {*} buffers
 * @param {*} modelViewMatrix
 * @param {*} projectionMatrix
 */
function draw_texture_buffers(targetTexture, buffers, modelViewMatrix, projectionMatrix) {
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
            programTextureInfo.attribLocations.vertexPosition,
            numComponents,
            type,
            normalize,
            stride,
            offset);
        gl.enableVertexAttribArray(
            programTextureInfo.attribLocations.vertexPosition);
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
            programTextureInfo.attribLocations.textureCoord,
            numComponents,
            type,
            normalize,
            stride,
            offset);
        gl.enableVertexAttribArray(
            programTextureInfo.attribLocations.textureCoord);
    }

    // Tell WebGL which indices to use to index the vertices
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);

    // Tell WebGL to use our program when drawing

    gl.useProgram(programTextureInfo.program);

    // Set the shader uniforms

    gl.uniformMatrix4fv(
        programTextureInfo.uniformLocations.projectionMatrix,
        false,
        projectionMatrix);
    gl.uniformMatrix4fv(
        programTextureInfo.uniformLocations.modelViewMatrix,
        false,
        modelViewMatrix);

    // Specify the texture to map onto the faces.

    // Tell WebGL we want to affect texture unit 0
    gl.activeTexture(gl.TEXTURE0);

    // Bind the texture to texture unit 0
    gl.bindTexture(gl.TEXTURE_2D, targetTexture);

    // Tell the shader we bound the texture to texture unit 0
    gl.uniform1i(programTextureInfo.uniformLocations.uSampler, 0);

    {
        const vertexCount = 6;
        const type = gl.UNSIGNED_SHORT;
        const offset = 0;
        gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
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
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates),
        gl.STATIC_DRAW);

    // indices
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
        new Uint16Array(indices), gl.STATIC_DRAW);

    return {
        position: positionBuffer,
        textureCoord: textureCoordBuffer,
        indices: indexBuffer,
    };
}

function drawLICImage(modelViewMatrix, projectionMatrix) {
    canvas.width = IMG_RES;
    canvas.height = IMG_RES;
    gl.viewport(0, 0, IMG_RES, IMG_RES);
    gl.clearColor(0.0, 0.0, 0.0, 1.0); // Clear to black, fully opaque
    gl.clearDepth(1.0); // Clear everything
    gl.enable(gl.DEPTH_TEST); // Enable depth testing
    gl.depthFunc(gl.LEQUAL); // Near things obscure far things
    // Clear the canvas before we start drawing on it.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // define size and format of level 0
    const level = 0;
    const internalFormat = gl.RGBA;
    const border = 0;
    const format = gl.RGBA;
    const type = gl.UNSIGNED_BYTE;
    const targetTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, targetTexture);
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, IMG_RES, IMG_RES, border,
        format,
        type, LIC_tex);
    gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.enable(gl.BLEND);
    let textureCoordinates = [
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0,
    ];
    let positions = [
        appstate.minX, appstate.minY, 0,
        appstate.minX, appstate.maxY, 0,
        appstate.maxX, appstate.maxY, 0,
        appstate.maxX, appstate.minY, 0,
    ];
    let indices = [
        0, 1, 2,
        0, 2, 3,
    ];
    const buffers = initBuffers(positions, textureCoordinates, indices);
    draw_texture_buffers(targetTexture, buffers, modelViewMatrix, projectionMatrix);
}

function gen_noise_tex() {
    let idx = 0;
    for (let x = 0; x < IMG_RES; x++) {
        for (let y = 0; y < IMG_RES; y++) {
            let rand = Math.floor(255 * Math.random());
            noise_tex[idx] = rand;
            noise_tex[idx + 1] = rand;
            noise_tex[idx + 2] = rand;
            idx = idx + 3;
        }
    }
}

function render_vec_img() {
    if (currentBuffers) {
        canvas.width = IMG_RES;
        canvas.height = IMG_RES;
        gl.viewport(0, 0, IMG_RES, IMG_RES);

        // Clear the canvas before we start drawing on it.
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.clearColor(0.0, 0.0, 0.0, 1.0); // Clear to black, fully opaque
        gl.clearDepth(1.0); // Clear everything
        gl.enable(gl.DEPTH_TEST); // Enable depth testing
        gl.depthFunc(gl.LEQUAL); // Near things obscure far things

        const projectionMatrix = mat4.create();
        //Generates a orthogonal projection matrix with the given bounds
        const left = appstate.minX;
        const right = appstate.maxX;
        const bottom = appstate.minY;
        const top = appstate.maxY;
        const zNear = 0.1;
        const zFar = 100;
        mat4.ortho(projectionMatrix,
            left,
            right,
            bottom,
            top,
            zNear,
            zFar);
        // Set the drawing position to the "identity" point, which is
        // the center of the scene.
        const modelViewMatrix = mat4.create();
        // Update the model view matrix if there are some changes in translation and rotation
        mat4.translate(modelViewMatrix, // destination matrix
            modelViewMatrix, // matrix to translate
            [0, 0., -1]); // amount to translate
        mat4.rotate(modelViewMatrix, // destination matrix
            modelViewMatrix, // matrix to rotate
            transform.angleZ, // amount to rotate in radians
            [0, 0, 1]); // axis to rotate around (Z)
        mat4.rotate(modelViewMatrix, // destination matrix
            modelViewMatrix, // matrix to rotate
            transform.angleY,// amount to rotate in radians
            [0, 1, 0]); // axis to rotate around (Y)
        mat4.rotate(modelViewMatrix, // destination matrix
            modelViewMatrix, // matrix to rotate
            transform.angleX,// amount to rotate in radians
            [1, 0, 0]);

        //determine the color for this vertex based on its vector value
        let colors = [];
        for (let i = 0; i < appstate.vectorValues.length; i += 3) {
            let vx = appstate.vectorValues[i];
            let vy = appstate.vectorValues[i + 1];
            let red = (vx - appstate.minVX) / (appstate.maxVX - appstate.minVX); // red channel
            let green = (vy - appstate.minVY) / (appstate.maxVY - appstate.minVY); // green channel
            colors.push(red, green, 0, 1.0);
        }
        const colorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
        currentBuffers.color = colorBuffer;
        //draw the mesh
        drawSceneWithoutClearing(modelViewMatrix, projectionMatrix);

        gl.readPixels(0, 0, IMG_RES, IMG_RES, gl.RGBA, gl.UNSIGNED_BYTE, vec_img);
    }
}

function computeLICImage() {
    let idx = 0;
    for (let i = 0; i < IMG_RES; i++) {
        for (let j = 0; j < IMG_RES; j++) {
            let y = i+.5;
            let x = j+.5;
            let next_i = i;
            let next_j = j;
            let noiseTexVals = [];
            let numSteps = 20;

            let forwardCounter = 0;
            let vx = Number.MAX_VALUE;
            let vy = Number.MAX_VALUE;
            while (forwardCounter < numSteps &&
                next_i >= 0 && next_j >= 0 &&
                next_i < IMG_RES && next_j < IMG_RES &&
                getMagnitude(vx, vy) > Math.pow(10, -6)) {
                    vx = appstate.minVX + (appstate.maxVX - appstate.minVX) * vec_img[(next_i + next_j * IMG_RES) * 4] / 255.0;
                    vy = appstate.minVY + (appstate.maxVY - appstate.minVY) * vec_img[(next_i + next_j * IMG_RES) * 4 + 1] / 255.0;
                    let noiseTex = noise_tex[(next_i + next_j * IMG_RES) * 3];
                    noiseTexVals.push(noiseTex);
                    x += vy;
                    y += vx;
                    next_i = Math.floor(y);
                    next_j = Math.floor(x);
                    forwardCounter++
            }

            let backwardCounter = 0;
            y = i+.5;
            x = j+.5;
            next_i = i;
            next_j = j;
            vx = Number.MAX_VALUE;
            vy = Number.MAX_VALUE;
            while (backwardCounter < numSteps &&
                next_i >= 0 && next_j >= 0 &&
                next_i < IMG_RES && next_j < IMG_RES &&
                getMagnitude(vx, vy) > Math.pow(10, -6)) {
                    vx = appstate.minVX + (appstate.maxVX - appstate.minVX) * vec_img[(next_i + next_j * IMG_RES) * 4] / 255.0;
                    vy = appstate.minVY + (appstate.maxVY - appstate.minVY) * vec_img[(next_i + next_j * IMG_RES) * 4 + 1] / 255.0;
                    let noiseTex = noise_tex[(next_i + next_j * IMG_RES) * 3];
                    noiseTexVals.push(noiseTex);
                    x -= vy;
                    y -= vx;
                    next_i = Math.floor(y);
                    next_j = Math.floor(x);
                    backwardCounter++
            }
            let streamlinePixelCount = noiseTexVals.length;
            let noiseTexAvg = noiseTexVals.reduce((v1, v2) => v1 + v2) / streamlinePixelCount;
            LIC_tex[idx] = noiseTexAvg;
            LIC_tex[idx+1] = noiseTexAvg;
            LIC_tex[idx+2] = noiseTexAvg;
            LIC_tex[idx+3] = 255;
            idx += 4;
        }
    }
}

function buildArrows(positions, vectorValues, arrowScale=1.0) {
    let arrowPositions = [];
    let colors = [];
    let indices = [];
    let idx = 0;
    for (let k = 0; k < vectorValues.length; k += 3) {
        let vx = vectorValues[k] * arrowScale;
        let vy = vectorValues[k + 1] * arrowScale;
        let x0 = positions[k];
        let y0 = positions[k + 1];
        let x1 = x0 + vx;
        let y1 = y0 + vy;

        var pivot = {x: x0 + 0.8 * (x1 - x0), y: y0 + 0.8 * (y1 - y0)};
        // rotate
        var angle1 = 30 * Math.PI / 180;
        var angle2 = 300 * Math.PI / 180;
        var p0 = rotate2D_around_point(pivot.x, pivot.y, x1, y1, angle1);
        var p1 = {x: x1, y: y1};
        var p2 = rotate2D_around_point(pivot.x, pivot.y, x1, y1, angle2);

        // Now create an array of positions
        const oneArrowPosition = [
            x0, y0, 0.0,
            p0.x, p0.y, 0.0,
            p1.x, p1.y, 0.0,
            p2.x, p2.y, 0.0,
        ];
        arrowPositions = arrowPositions.concat(oneArrowPosition);

        colors.push(1.0, 1.0, 0.0, 1.0);
        colors.push(1.0, 1.0, 0.0, 1.0);
        colors.push(1.0, 1.0, 0.0, 1.0);
        colors.push(1.0, 1.0, 0.0, 1.0);

        indices.push(
            idx, idx+2,
            idx+1, idx+2,
            idx+2, idx+3
        );
        idx += 4;
    }
    appstate.arrowPositions = arrowPositions;
    appstate.arrowColors = colors;
    appstate.arrowIndices = indices;
}