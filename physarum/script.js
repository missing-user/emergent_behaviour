var canvas = document.getElementById('canvas');

const gl = canvas.getContext("webgl");
var frameId;
const frameVertexCoords = [-1, -1, 0, 1, -1, 0, -1, 1, 0, -1, 1, 0, 1, -1, 0, 1, 1, 0];
enableFloatTextures(gl);

const minimalVertexInfo = twgl.createBufferInfoFromArrays(gl, {
  a_position: frameVertexCoords,
});

var disabled = false;

// Simulation constants
const simSize = 1024; // width & height of the simulation textures
const pCount = simSize * simSize;


function init() {
  //initialize the particle render shader
  const rendererInfo = twgl.createProgramInfo(gl, ['vs_points', 'renderShader']);
  const pointsVertexInfo = twgl.createBufferInfoFromArrays(gl, {
    a_Index: { numComponents: 2, data: initIndices(), },
  });

  const initInfo = twgl.createProgramInfo(gl, ['vs', 'initShader']);

  //initialize the texture render shader
  const textureRendererInfo = twgl.createProgramInfo(gl, ['vs', 'textureRenderShader']);

  //initialize the simulation buffer textures
  let fb1 = newFramebuffer(gl); //sim 1
  let fb2 = newFramebuffer(gl); //sim 2
  let fb3 = newFramebuffer(gl); //for the pheromones


  //initialize the simulation shader
  const simulatorInfo = twgl.createProgramInfo(gl, ['vs', 'simShader']);
  const simUniforms = {
    u_dt: .02,
    u_resolution: [gl.canvas.width, gl.canvas.height],
    u_simResolution: [simSize, simSize],
    u_searchDistance: 5,
    u_speed: .3,
    u_rotationRate: 2,
    u_searchAngle: .2,
    u_time: 0,
  };
  var startTime = Date.now();

  // particle initialization
  gl.useProgram(initInfo.program);
  twgl.setBuffersAndAttributes(gl, initInfo, minimalVertexInfo);
  twgl.setUniforms(initInfo, {
    u_resolution: [gl.canvas.width, gl.canvas.height],
    u_simResolution: [simSize, simSize],
  });
  twgl.bindFramebufferInfo(gl, fb1);
  twgl.drawBufferInfo(gl, minimalVertexInfo);

  function animate() {
    //update simulation
    gl.useProgram(simulatorInfo.program);
    twgl.setBuffersAndAttributes(gl, simulatorInfo, minimalVertexInfo);
    simUniforms.u_simTexture = fb1.attachments[0];
    simUniforms.u_pheroTexture = fb3.attachments[0];
    twgl.setUniforms(simulatorInfo, simUniforms);
    twgl.bindFramebufferInfo(gl, fb2);
    twgl.drawBufferInfo(gl, minimalVertexInfo);

    // render the current particles
    gl.useProgram(rendererInfo.program);
    twgl.setBuffersAndAttributes(gl, rendererInfo, pointsVertexInfo);
    twgl.setUniforms(rendererInfo, {
      u_resolution: [gl.canvas.width, gl.canvas.height],
      u_simResolution: [simSize, simSize],
      u_simTexture: fb2.attachments[0],
      u_time: (Date.now() - startTime) / 500
    });
    twgl.bindFramebufferInfo(gl, fb3);
    twgl.drawBufferInfo(gl, pointsVertexInfo, gl.POINTS);

    // swap buffers
    tmp = fb1;
    fb1 = fb2;
    fb2 = tmp;


    //update pheromone texture
    /*gl.useProgram(pheromoneInfo.program);
    twgl.setUniforms(pheromoneInfo, pheroUniforms);
    twgl.setBuffersAndAttributes(gl, pheromoneInfo, minimalVertexInfo);
    for (var i = 0; i < iterations; i++) {
      //frame buffer swap
      gl.bindTexture(gl.TEXTURE_2D, pt1);
      gl.bindFramebuffer(gl.FRAMEBUFFER, pfb2);
      twgl.drawBufferInfo(gl, minimalVertexInfo);


      gl.bindTexture(gl.TEXTURE_2D, pt2);
      gl.bindFramebuffer(gl.FRAMEBUFFER, pfb1);
      twgl.drawBufferInfo(gl, minimalVertexInfo);
    }

    // render the current particles
    gl.useProgram(rendererInfo.program);
    twgl.setBuffersAndAttributes(gl, rendererInfo, pointsVertexInfo);
    twgl.setUniforms(rendererInfo, {
      u_resolution: [gl.canvas.width, gl.canvas.height],
      u_simResolution: [simSize, simSize],
    });
    gl.bindFramebuffer(gl.FRAMEBUFFER, renderBuffer);
    twgl.drawBufferInfo(gl, pointsVertexInfo, gl.POINTS);*/


    gl.useProgram(textureRendererInfo.program);
    twgl.setBuffersAndAttributes(gl, textureRendererInfo, minimalVertexInfo);
    twgl.setUniforms(textureRendererInfo, {
      u_resolution: [gl.canvas.width, gl.canvas.height],
      u_simResolution: [simSize, simSize],
      u_simTexture: fb3.attachments[0],
    });
    twgl.bindFramebufferInfo(gl);
    twgl.drawBufferInfo(gl, minimalVertexInfo);
    frameId = requestAnimationFrame(animate);
  }
  if (!disabled)
    frameId = requestAnimationFrame(animate);
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

function newFramebuffer(gl, h = simSize, w = simSize) {
  const floatBuffer = new Float32Array(w * h * 4);
  var texture = twgl.createTexture(gl, {
    src: floatBuffer,
    width: w,
  });
  //creates a float32 framebuffer object
  var fb = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
  return { framebuffer: fb, attachments: [texture], height: h, width: w };
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