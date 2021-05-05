var canvas = document.getElementById('canvas');

const gl = canvas.getContext("webgl");
var frameId;
var mousepos = [0, 0];
const frameVertexCoords = [-1, -1, 0, 1, -1, 0, -1, 1, 0, -1, 1, 0, 1, -1, 0, 1, 1, 0];
enableFloatTextures(gl);

var disabled = false, pause;
var pColor = [0, 0, 0];
//set the colorscheme
if (window.matchMedia) {
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", e => {
    pColor = e.matches ? [1, 1, 1] : [0, 0, 0];
    console.log("theme change detected, setting color to", pColor);
  });
  if (window.matchMedia("(prefers-color-scheme: dark)").matches)
    pColor = [1, 1, 1];
}


// Simulation constants
var simSize = 1024; // width & height of the simulation textures
if (window.devicePixelRatio > 2)
  simSize = 512;
var pCount = simSize * simSize;
canvas.width = simSize;
canvas.height = simSize;


function init() {
  //initialize the buffer textures
  const attachments = [
    { format: gl.RGBA, type: gl.FLOAT, wrapS: gl.REPEAT, wrapT: gl.REPEAT },
  ];
  let fb1 = twgl.createFramebufferInfo(gl, attachments);
  let fb2 = twgl.createFramebufferInfo(gl, attachments); //sim 2

  //initialize the shaders
  const initInfo = twgl.createProgramInfo(gl, ['vs', 'initShader']);
  const rendererInfo = twgl.createProgramInfo(gl, ['vs_points', 'renderShader']);
  const simulatorInfo = twgl.createProgramInfo(gl, ['vs', 'simShader']);

  // init uniforms
  const renderUniforms = {
    u_resolution: [gl.canvas.width, gl.canvas.height],
    u_simResolution: [simSize, simSize],
    u_simTexture: fb1.attachments[0],
  }
  const simUniforms = {
    u_dt: .02,
    u_resolution: [gl.canvas.width, gl.canvas.height],
    u_simResolution: [simSize, simSize],
    u_simTexture: fb1.attachments[0],
    u_speed: .2,
    u_rotationRate: 2,
    u_time: 0,
  };

  //init vertex info
  const renderVertexInfo = twgl.createBufferInfoFromArrays(gl, {
    a_Index: { numComponents: 2, data: initIndices(), },
  });
  const minimalVertexInfo = twgl.createBufferInfoFromArrays(gl, {
    a_position: frameVertexCoords,
  });

  // particle initialization
  gl.useProgram(initInfo.program);
  twgl.setBuffersAndAttributes(gl, initInfo, minimalVertexInfo);
  twgl.setUniforms(initInfo, {
    u_resolution: [gl.canvas.width, gl.canvas.height],
    u_simResolution: [simSize, simSize],
  });
  twgl.bindFramebufferInfo(gl, fb1);
  twgl.drawBufferInfo(gl, minimalVertexInfo);

  var startTime = Date.now();

  function animate() {
    if (!pause) {
      gl.useProgram(simulatorInfo.program);
      // simUniforms.u_simTexture = simTexture;
      simUniforms.u_simTexture = fb1.attachments[0];
      simUniforms.u_time = (Date.now() - startTime) / 1000;
      simUniforms.u_forceField = mousepos;
      twgl.setUniforms(simulatorInfo, simUniforms);
      twgl.setBuffersAndAttributes(gl, simulatorInfo, minimalVertexInfo);
      twgl.bindFramebufferInfo(gl, fb2);
      twgl.drawBufferInfo(gl, minimalVertexInfo);

      //update the sim Texture in renderer
      gl.useProgram(rendererInfo.program);
      renderUniforms.u_pColor = pColor;
      twgl.setBuffersAndAttributes(gl, rendererInfo, renderVertexInfo);
      twgl.setUniforms(rendererInfo, renderUniforms);
      twgl.bindFramebufferInfo(gl);

      // swap buffers
      var tmp = fb1;
      fb1 = fb2;
      fb2 = tmp;

      twgl.drawBufferInfo(gl, renderVertexInfo, gl.POINTS);
    }
    frameId = requestAnimationFrame(animate);
  }
  if (!disabled)
    frameId = requestAnimationFrame(animate);
}

function initSimTexture() {
  // simulation texture, stores positions in xy and velocities in zw
  const pTexture = new Float32Array(pCount * 4);
  for (let x = 0; x < simSize; x++) {
    for (let y = 0; y < simSize; y++) {
      let i = (x * simSize + y) * 4;
      pTexture[i] = x / simSize * 2 - 1 //(2 * Math.random() - 1); //p_x
      pTexture[i + 1] = y / simSize * 2 - 1 //(2 * Math.random() - 1); //p_y
      pTexture[i + 2] = Math.acos(pTexture[i] / pTexture[i + 1]); //orientation from 0 to 2pi
      pTexture[i + 3] = Math.random(); //pheromones
    }
  }
  return twgl.createTexture(gl, {
    src: pTexture,
    width: simSize,
  });
}

function initIndices() {
  // uv positions for sprites in the vertex shader 
  // (where in the sim texture do the particles get their simulation data from)
  const simIndex = new Float32Array(pCount * 2);
  for (let x = 0; x < simSize; x++) {
    for (let y = 0; y < simSize; y++) {
      let i = (x * simSize + y) * 2;
      simIndex[i] = x;
      simIndex[i + 1] = y;
    }
  }
  return simIndex;
}

function initTexture() {
  const floatBuffer = new Float32Array(gl.canvas.width * gl.canvas.height * 4);
  return twgl.createTexture(gl, {
    src: floatBuffer,
    width: gl.canvas.width,
  });
}

function resetAnim() {
  if (frameId)
    cancelAnimationFrame(frameId);
  init();
}

function enableFloatTextures(gl) {
  if (!gl.getExtension("OES_texture_float")) disableSim();
  if (!gl.getExtension("OES_texture_float_linear")) disableSim();
}

function disableSim() {
  document.getElementById('webglWarning').style.display = '';
  disabled = true;
}
init();

window.onscroll = () => {
  var rect = gl.canvas.getBoundingClientRect();
  pause = (0 > rect.top + gl.canvas.offsetHeight)
}

//mouse interactivity, might remove, cause I like the geometric patterns better

function setMousePos(e) {
  var rect = gl.canvas.getBoundingClientRect();
  mousepos[0] = (e.clientX - rect.left) / gl.canvas.clientWidth;
  mousepos[1] = 1 - (e.clientY - rect.top) / gl.canvas.clientHeight;
  for (let i = 0; i < 2; i++)
    mousepos[i] = mousepos[i] * 2 - 1;
}

canvas.addEventListener('mousemove', setMousePos);

canvas.addEventListener('mouseleave', () => {
  mousepos[0] = 0;
  mousepos[1] = 0;
});