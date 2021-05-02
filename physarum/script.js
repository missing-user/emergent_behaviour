var canvas = document.getElementById('canvas');

const gl = canvas.getContext("webgl");
var frameId;
const frameVertexCoords = [-1, -1, 0, 1, -1, 0, -1, 1, 0, -1, 1, 0, 1, -1, 0, 1, 1, 0];
enableFloatTextures(gl);

var disabled = false;
var iterations = 2;
if (window.devicePixelRatio > 2) {
  iterations = 1; // half the simulation steps on mobile 
}

// Simulation constants
const simSize = 1024; // width & height of the simulation textures
const pCount = simSize * simSize;
const debug = false;


function init() {
  //initialize the particle render shader
  const rendererInfo = twgl.createProgramInfo(gl, [debug ? 'vs' : 'vs_points', 'renderShader']);
  const renderUniforms = {
    u_resolution: [gl.canvas.width, gl.canvas.height],
    u_simResolution: [simSize, simSize],
  }
  const renderVertexInfo = twgl.createBufferInfoFromArrays(gl, {
    a_Index: { numComponents: 2, data: initIndices(), },
  });

  //initialize the simulation buffer textures
  var t1 = initSimTexture(), t2 = initTexture();
  const fb1 = newFramebuffer(gl, t1), fb2 = newFramebuffer(gl, t2);

  //initialize the simulation shader
  const simVertexInfo = twgl.createBufferInfoFromArrays(gl, {
    a_position: frameVertexCoords,
  });
  const simulatorInfo = twgl.createProgramInfo(gl, ['vs', 'simShader']);
  const simUniforms = {
    u_dt: .02,
    u_resolution: [gl.canvas.width, gl.canvas.height],
    u_simResolution: [simSize, simSize],
    u_searchDistance: 5,
    u_speed: .2,
    u_rotationRate: 2,
    u_searchAngle: .2,
    u_time: 0,
  };
  var startTime = Date.now();


  //pheromone shader
  var pt1 = initTexture(),
    pt2 = initTexture(),
    renderTexture = initTexture();
  const pheromoneInfo = twgl.createProgramInfo(gl, ['vs', 'pheroShader']);
  const pheroUniforms = {
    u_resolution: [gl.canvas.width, gl.canvas.height],
    u_simResolution: [simSize, simSize],
  }
  const pfb1 = newFramebuffer(gl, pt1),
    pfb2 = newFramebuffer(gl, pt2),
    renderBuffer = newFramebuffer(gl, renderTexture);


  function animate() {

    //update simulation
    gl.useProgram(simulatorInfo.program);
    simUniforms.u_time = (Date.now() - startTime) / 1000;
    twgl.setUniforms(simulatorInfo, simUniforms);
    twgl.setBuffersAndAttributes(gl, simulatorInfo, simVertexInfo);
    for (var i = 0; i < iterations; i++) {
      //frame buffer swap
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, t1);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, pt1);
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb2);
      twgl.drawBufferInfo(gl, simVertexInfo);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, t2);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, pt1);
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb1);
      twgl.drawBufferInfo(gl, simVertexInfo);
    }


    //update pheromone texture
    gl.useProgram(pheromoneInfo.program);
    twgl.setUniforms(pheromoneInfo, pheroUniforms);
    twgl.setBuffersAndAttributes(gl, pheromoneInfo, simVertexInfo);
    for (var i = 0; i < iterations; i++) {
      //frame buffer swap
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, t1);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, pt1);
      gl.bindFramebuffer(gl.FRAMEBUFFER, pfb2);
      twgl.drawBufferInfo(gl, simVertexInfo);


      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, t1);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, pt2);
      gl.bindFramebuffer(gl.FRAMEBUFFER, pfb1);
      twgl.drawBufferInfo(gl, simVertexInfo);
    }

    // render the current particles
    gl.useProgram(rendererInfo.program);
    twgl.setBuffersAndAttributes(gl, rendererInfo, renderVertexInfo);
    twgl.setUniforms(rendererInfo, renderUniforms);
    twgl.bindFramebufferInfo(gl);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, t1);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, pt1);

    twgl.drawBufferInfo(gl, renderVertexInfo, debug ? undefined : gl.POINTS);
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
      pTexture[i + 2] = Math.random() * 2 * Math.PI; //orientation from 0 to 2pi
      pTexture[i + 3] = Math.random(); //pheromones
    }
  }
  return twgl.createTexture(gl, {
    target: gl.TEXTURE_2D,
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
    target: gl.TEXTURE_2D,
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