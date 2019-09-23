import { PLYLoader } from './plyLoader.js';

/* -------------------------------------------------------------------*/
/* --------------------- Color Mapping -------------------------------*/
/* -------------------------------------------------------------------*/

/**
 * Rainbow color mapping 
 */
function rainbow(s_min, s_max, s) {
  //Compute rgb color values and return as an array
  var hsv = [];
  var t = (s - s_min) / (s_max - s_min);
  // make sure t is between 0 and 1, if not, rgb should be black
  if(t < 0 || t > 1) {
    var rgb = [];
    rgb[0] = rgb[1] = rgb[2] = 0.0;
    return rgb;
  }
  // map the scalar value linearly to the hue channel of the HSV
  hsv[0] = (1 - t)*240;
  // set the saturation and value as 1
  hsv[1] = 1.0;
  hsv[2] = 1.0;
  // Call the HSV to RGB conversion function
  var rgb = hsvRgb(hsv);
  return rgb;
}

function blueWhiteRed(s_min, s_max, s) {
  var hsv = [];
  var t = (s - s_min) / (s_max - s_min);
  if(t < 0 || t > 1) {
    var rgb = [];
    rgb[0] = rgb[1] = rgb[2] = 0.0;
    return rgb;
  }
  var s_mid = getBWRThreshold();
  if ((s_max - s_mid) < Math.pow(10, -3) || s < s_mid) {
    // blue
    hsv[0] = 240;
    hsv[1] = (s - s_mid) / (s_min - s_mid);
    hsv[2] = 1.0;
  } else {
    // red
    hsv[0] = 0.0;
    hsv[1] = (s - s_mid) / (s_max - s_mid);
    hsv[2] = 1.0;
  }
  return hsvRgb(hsv);
}

function heatmap(s_min, s_max, s) {
  var rgb = [];
  var t = (s - s_min) / (s_max - s_min);
  if(t < 0 || t > 1) {
    rgb[0] = rgb[1] = rgb[2] = 0.0;
    return rgb;
  }
  if (t <= (1/3)) {
    rgb[0] = t / (1/3);
    rgb[1] = rgb[2] = 0.0;
  } else if (t <= (2/3)) {
    rgb[0] = 1.0;
    rgb[1] = t / (2/3);
    rgb[2] = 0.0;
  } else {
    rgb[0] = rgb[1] = 1.0;
    rgb[2] = t;
  }
  return rgb;
}

function discrete(s_min, s_max, s) {
  var t = (s - s_min) / (s_max - s_min);
  if(t < 0 || t > 1) {
    var rgb = [];
    rgb[0] = rgb[1] = rgb[2] = 0.0;
    return rgb;
  }
  var hsv = [];
  var N = getNumOfIntervals();
  var sChunk = (s_max - s_min) / N;
  var colorChunk = 240 / (N-1);
  var colorInterval = 1;
  while (s > s_min + colorInterval * sChunk) {
    colorInterval++;
  }
  colorInterval--;
  var hue = 240 - colorInterval * colorChunk;
  hsv[0] = hue;
  hsv[1] = 1.0;
  hsv[2] = 1.0;
  return hsvRgb(hsv);
}

function log(s_min, s_max, s) {
  var t = (s - s_min) / (s_max - s_min);
  if(t < 0 || t > 1) {
    var rgb = [];
    rgb[0] = rgb[1] = rgb[2] = 0.0;
    return rgb;
  }
  var hsv = [];
  hsv[0] = 0;
  hsv[1] = Math.log10(t+0.1) + 1;
  hsv[2] = 1.0;
  return hsvRgb(hsv);
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

  // if (s == 0.0) {
  //   rgb[0] = rgb[1] = rgb[2] = v;
  //   return;
  // }


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

var colorScale = 'rainbow';
var modelPath = './models/diesel_field1.ply';
var colorScaleFuncMap = {
  'rainbow': rainbow,
  'blue-white-red': blueWhiteRed,
  'heatmap': heatmap,
  'discrete': discrete,
  'log': log
};

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
  gui = new dat.GUI({ autoPlace: false });
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
  load_and_draw_ply_model(modelPath);

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
    isAxesShown = true;
  } else {
    isAxesShown = false;
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
    modelPath = ply_path;
  });
});


/**
* Change color map 
*/
$("#davim_select_color_map").change(function () {
  colorScale = $("#davim_select_color_map option:selected").val();
  load_and_draw_ply_model(modelPath);
});

$("#bwr-threshold-slider").change(function () {
  var value = $("#bwr-threshold-slider").val();
  $("#bwr-threshold-value").val(value);
  load_and_draw_ply_model(modelPath, true);
});

$("#bwr-threshold-value").change(function () {
  load_and_draw_ply_model(modelPath, true);
});

$("#discrete-intervals").keyup(function () {
  load_and_draw_ply_model(modelPath, true);
});

$("#bwr-slider-step").change(function () {
  var newStep = $("#bwr-slider-step").val();
  $("#bwr-threshold-slider")[0].step = newStep;
});

var getBWRThreshold = function() {
  return parseFloat($("#bwr-threshold-value").val());
};

var getNumOfIntervals = function() {
  return parseInt($("#discrete-intervals").val());
};

var updateControls = function(args) {
  var min = args.min;
  var max = args.max;
  var mid = (min + max) / 2;
  var decimals = 5;
  $("#bwr-threshold-slider")[0].min = min;
  $("#bwr-threshold-slider")[0].max = max;
  $("#bwr-threshold-slider")[0].value = mid;
  $("#bwr-min").text(min.toFixed(decimals));
  $("#bwr-max").text(max.toFixed(decimals));
  $("#bwr-threshold-value").val(mid);
}


/* ---------------------------------------------------------------------------*/
/* ----------------------- WebGL Rendering Functions -------------------------*/
/* ---------------------------------------------------------------------------*/

/**
 * Load the input model and draw it in the WebGL scene 
 * @param {string} ply_path Path to the ply file
 */
function load_and_draw_ply_model(ply_path, reload=false) {


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

    // Get scalar values and convert to colors .
    const scalarField = ply_data.attributes.scalar.array;
 
    const minimum = Math.min(...scalarField);
    const maximum = Math.max(...scalarField);

    var dataArgs = {'min': minimum, 'max': maximum};
    if (!reload) {
      updateControls(dataArgs);
    }

    var colors = [];
    const nScalars = scalarField.length;
    for (var k = 0; k < nScalars; k++) {
      // var rgb = rainbow(minimum, maximum, scalarField[k]);
      var colorScaleFunc = colorScaleFuncMap[colorScale];
      var rgb = colorScaleFunc(minimum, maximum, scalarField[k]);
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
    console.log(vertex_indices);
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


    //Get the center point of the model, and translate camera close to it
    ply_data.computeBoundingBox();
    var boundingBox = ply_data.boundingBox;
    transform.x = (boundingBox.min.x + boundingBox.max.x) / 2.0;
    transform.y = (boundingBox.min.y + boundingBox.max.y) / 2.0;
    transform.z = (boundingBox.min.z + boundingBox.max.z) / 2.0 - 3;

    // Re-draw the scene
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
 * Load a sample PLY model
 */

function loadSamplePLY() {


  var loader = new PLYLoader();
  loader.load('./models/distance_field2.ply', function (geometry) {

    // Create a buffer for the vertex positions.
    console.log(geometry);

    const positionBuffer = gl.createBuffer();

    // Select the positionBuffer as the one to apply buffer
    // operations to from here out.

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    // Now create an array of positions


    const positions = geometry.attributes.position.array;

    // Now pass the list of positions into WebGL to build the
    // shape. We do this by creating a Float32Array from the
    // JavaScript array, then use it to fill the current buffer.

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);


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

    // Create indices
    const indices = geometry.index.array;

    // Now send the element array to GL

    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array(indices), gl.STATIC_DRAW);

    const buffers = {
      position: positionBuffer,
      color: colorBuffer,
      indices: indexBuffer,
    };
    var nVertices = indices.length;
    currentBuffers = buffers;
    currentNumbVertices = nVertices;

    //Get the center point of the model, and translate camera to it
    geometry.computeBoundingBox();
    var boundingBox = geometry.boundingBox;
    transform.x = (boundingBox.min.x + boundingBox.max.x) / 2.0;
    transform.y = (boundingBox.min.y + boundingBox.max.y) / 2.0;
    transform.z = (boundingBox.min.z + boundingBox.max.z) / 2.0 - 6;

  });

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
function drawScene() {


  gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
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

  /*-------------IMPORTANT!!! ADD YOUR DRAWING FUNCTIONS HERE ------------------*/

  drawModel(currentBuffers, currentNumbVertices, modelViewMatrix, projectionMatrix);

  if (isAxesShown)
    drawAxes(modelViewMatrix, projectionMatrix);

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
