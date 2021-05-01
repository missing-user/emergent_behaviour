var canvas = document.getElementById('canvas');

const gl = canvas.getContext("webgl");
var frameId;
const frameVertexCoords = [-1, -1, 0, 1, -1, 0, -1, 1, 0, -1, 1, 0, 1, -1, 0, 1, 1, 0];
enableFloatTextures(gl);

var disabled = false;
var iterations = 5;
if (window.devicePixelRatio > 2) {
  iterations = 2; // half the simulation steps on mobile 
}

// Simulation constants
const simSize = 1024; // width & height of the simulation textures
const pCount = simSize * simSize;


function init() {
  //initialize the render shader
  /*const rendererInfo = twgl.createProgramInfo(gl, ['vs', 'renderShader']);
  const renderUniforms = {
    u_resolution: [gl.canvas.width, gl.canvas.height],
    u_simResolution: [simSize, simSize],
    u_simTexture: initSimTexture(),
  }*/
  var simTexture = initSimTexture();
  //initialize the particle render shader
  const rendererInfo = twgl.createProgramInfo(gl, ['vs_points', 'renderShader']);
  const renderUniforms = {
    u_resolution: [gl.canvas.width, gl.canvas.height],
    u_simResolution: [simSize, simSize],
    u_simTexture: simTexture,
  }
  const renderVertexInfo = twgl.createBufferInfoFromArrays(gl, {
    a_Index: { numComponents: 2, data: initIndices(), },
  });

  //initialize the buffer textures
  var t1 = simTexture, t2 = initTexture();
  const fb1 = newFramebuffer(gl, t1), fb2 = newFramebuffer(gl, t2);

  //initialize the simulation shader
  const simVertexInfo = twgl.createBufferInfoFromArrays(gl, {
    a_position: frameVertexCoords,
  });
  const simulatorInfo = twgl.createProgramInfo(gl, ['vs', 'simShader']);
  const simUniforms = {
    u_dt: .01,
    u_resolution: [gl.canvas.width, gl.canvas.height],
    u_simResolution: [simSize, simSize],
    u_simTexture: t1,
  };
  gl.useProgram(simulatorInfo.program);
  twgl.setUniforms(simulatorInfo, simUniforms);
  twgl.setBuffersAndAttributes(gl, simulatorInfo, simVertexInfo);


  function animate() {
    gl.useProgram(simulatorInfo.program);
    // simUniforms.u_simTexture = simTexture;
    simUniforms.u_simTexture = t1;
    twgl.setUniforms(simulatorInfo, simUniforms);
    twgl.setBuffersAndAttributes(gl, simulatorInfo, simVertexInfo);
    for (var i = 0; i < iterations; i++) {
      //frame buffer swap
      gl.bindTexture(gl.TEXTURE_2D, t1);
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb2);
      twgl.drawBufferInfo(gl, simVertexInfo);

      gl.bindTexture(gl.TEXTURE_2D, t2);
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb1);
      twgl.drawBufferInfo(gl, simVertexInfo);
    }

    //update the sim Texture in renderer
    gl.useProgram(rendererInfo.program);
    //gl.bindTexture(gl.TEXTURE_2D, simTexture);
    twgl.setBuffersAndAttributes(gl, rendererInfo, renderVertexInfo);
    twgl.setUniforms(rendererInfo, renderUniforms);
    twgl.bindFramebufferInfo(gl);
    twgl.drawBufferInfo(gl, renderVertexInfo, gl.POINTS);
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
      let i = (x * simSize + y) * 2;
      pTexture[i] = (2 * Math.random() - 1); //p_x
      pTexture[i + 1] = (2 * Math.random() - 1); //p_y
      pTexture[i + 2] = (2 * Math.random() - 1); //v_x
      pTexture[i + 3] = (2 * Math.random() - 1); //v_y
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

function newFramebuffer(gl, texture) {
  var fb = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
  return fb;
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