import { PLYLoader } from './plyLoader.js';

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
}
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
//addGUI();


/**
 * Add GUI controls in the left-right positon of WebGL canvas
 */
function addGUI() {
  gui = new dat.GUI({ autoPlace: false });
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
  var sample_ply_fileName = "./models/bnoise.ply";
  // Load and draw model
  load_and_draw_ply_model(sample_ply_fileName);

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
  };
});


/**
 * Change camera mode
 */
$("#davim_set_perspective").click(function () {
  if ($('#davim_set_perspective').is(':checked')) {

    cameraMode = CameraModes.PERSPECTIVE;

  } else {
    cameraMode = CameraModes.ORTHOGRAPHIC;
  };
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

    // Load and draw model
    load_and_draw_ply_model(ply_path);

  });
});


/**
* Change color map 
*/
$("#davim_select_color_map").change(function () {
  alert($("#davim_select_color_map option:selected").val());
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
    const scalarField = Array(positions.length/3).fill(0);
 
    const minimum = Math.min(...scalarField);
    const maximum = Math.max(...scalarField);
    var colors = [];
    const nScalars = scalarField.length;
    for (var k = 0; k < nScalars; k++) {
      var rgb = rainbow(minimum, maximum, scalarField[k]);
      colors.push(rgb[0], rgb[1], rgb[2], 1.0);
    }

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
      color: colorBuffer,
      indices: indexBuffer,
    };

    // Update drawing buffers
    currentNumbVertices = vertex_indices.length;
    currentBuffers = buffers;

    drawScene();
  });
}



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
  gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
  gl.clearDepth(1.0);                 // Clear everything
  gl.enable(gl.DEPTH_TEST);           // Enable depth testing
  gl.depthFunc(gl.LEQUAL);            // Near things obscure far things

  // Clear the canvas before we start drawing on it.
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}


/**
 * Draw the scene 
 */
const IMG_RES = 512;
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

  drawModel(currentBuffers, currentNumbVertices, modelViewMatrix, projectionMatrix);

 

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
  return { x: rotatedX + cx, y: rotatedY + cy };
}

/**
 * Draw an arrow
 * @param {*} x0 - The x coordinate value of the first point 
 * @param {*} y0 - The y coordinate value of the first point
 * @param {*} x1 - The x coordinate value of the second point
 * @param {*} y1 - The y coordinate value of the second point
 * @param {*} modelViewMatrix 
 * @param {*} projectionMatrix 
 */
function draw_arrow(x0, y0, x1, y1, modelViewMatrix, projectionMatrix) {


  var arrow_direction = { x: x1 - x0, y: y1 - y0 };
  var pivot = { x: x0 + 0.8 * (x1 - x0), y: y0 + 0.8 * (y1 - y0) };
  // rotate
  var angle1 = 30 * Math.PI / 180;
  var angle2 = 300 * Math.PI / 180;
  var p0 = rotate2D_around_point(pivot.x, pivot.y, x1, y1, angle1);
  var p1 = { x: x1, y: y1 };
  var p2 = rotate2D_around_point(pivot.x, pivot.y, x1, y1, angle2);

  // Create a buffer for the vertex positions.

  const positionBuffer = gl.createBuffer();

  // Select the positionBuffer as the one to apply buffer
  // operations to from here out.

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // Now create an array of positions
  const positions = [
    x0, y0, 0.0,
    p0.x, p0.y, 0.0,
    p1.x, p1.y, 0.0,
    p2.x, p2.y, 0.0,
  ];

  // Now pass the list of positions into WebGL to build the
  // shape. We do this by creating a Float32Array from the
  // JavaScript array, then use it to fill the current buffer.

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  // Now set up the colors for axes.

  const lineColors = [
    [1.0, 1.0, 0.0, 1.0],
    [1.0, 1.0, 0.0, 1.0],
    [1.0, 1.0, 0.0, 1.0],
    [1.0, 1.0, 0.0, 1.0],
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
    0, 2,
    1, 2,
    2, 3
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






/* -------------------------------------------------------------------*/
/* --------------------- Color Mapping -------------------------------*/
/* -------------------------------------------------------------------*/

/**
 * Rainbow color mapping 
 */
function rainbow(min, max, value) {
  //Compute rgb color values and return as an array
  var hsv = [];
  var t = (value - min) / (max - min);
  hsv[0] = 240 * (1 - t);
  hsv[1] = hsv[2] = 1.0;
  var rgb = hsvRgb(hsv);
  return rgb;
}


/**
 * Convert HSV to RGB color 
 */
function hsvRgb(hsv) {
  var rgb = [];
  var h, s, v;      // hue, sat, value
  var r, g, b;      // red, green, blue
  var i, f, p, q, t;    // interim values


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
    return;
  }


  // get an rgb from the hue itself:

  i = Math.floor(h);
  f = h - i;
  p = v * (1. - s);
  q = v * (1. - s * f);
  t = v * (1. - (s * (1. - f)));

  switch (Math.floor(i)) {
    case 0:
      r = v; g = t; b = p;
      break;

    case 1:
      r = q; g = v; b = p;
      break;

    case 2:
      r = p; g = v; b = t;
      break;

    case 3:
      r = p; g = q; b = v;
      break;

    case 4:
      r = t; g = p; b = v;
      break;

    case 5:
      r = v; g = p; b = q;
      break;
  }


  rgb[0] = r;
  rgb[1] = g;
  rgb[2] = b;

  return rgb;
}
