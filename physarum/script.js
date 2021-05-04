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

function getRangeVal(id) {
  return document.getElementById(id).value;
}

function init() {
  //initialize the particle render shader
  const rendererInfo = twgl.createProgramInfo(gl, ['vs_points', 'renderShader']);
  const pointsVertexInfo = twgl.createBufferInfoFromArrays(gl, {
    a_Index: { numComponents: 2, data: initIndices(), },
  });

  const initInfo = twgl.createProgramInfo(gl, ['vs', 'initShader']);
  const diffInfo = twgl.createProgramInfo(gl, ['vs', 'diffusionShader']);
  const simulatorInfo = twgl.createProgramInfo(gl, ['vs', 'simShader']);
  const textureRendererInfo = twgl.createProgramInfo(gl, ['vs', 'textureRenderShader']);


  const attachments = [
    { format: gl.RGBA, type: gl.FLOAT, wrapS: gl.REPEAT, wrapT: gl.REPEAT },
    { format: gl.DEPTH_STENCIL, },
  ];
  //initialize the simulation buffer textures
  //let fb1 = newFramebuffer(gl); //sim 1
  let fb1 = twgl.createFramebufferInfo(gl, attachments);
  let fb2 = twgl.createFramebufferInfo(gl, attachments); //sim 2

  let pfb1 = twgl.createFramebufferInfo(gl, attachments);
  let pfb2 = twgl.createFramebufferInfo(gl, attachments);



  //initialize the simulation shader
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
    //diffuse pheromones
    gl.useProgram(diffInfo.program);
    twgl.setBuffersAndAttributes(gl, diffInfo, minimalVertexInfo);
    twgl.setUniforms(diffInfo, {
      u_resolution: [gl.canvas.width, gl.canvas.height],
      u_simResolution: [simSize, simSize],
      u_pheroTexture: pfb1.attachments[0],
      u_evaporationRate: getRangeVal('evaporationrate'),
    });
    twgl.bindFramebufferInfo(gl, pfb2);
    twgl.drawBufferInfo(gl, minimalVertexInfo);

    //update simulation
    gl.useProgram(simulatorInfo.program);
    twgl.setBuffersAndAttributes(gl, simulatorInfo, minimalVertexInfo);

    twgl.setUniforms(simulatorInfo, {
      u_dt: .05,
      u_resolution: [gl.canvas.width, gl.canvas.height],
      u_simResolution: [simSize, simSize],
      u_searchDistance: getRangeVal('searchdistance'),
      u_speed: getRangeVal('movementspeed'),
      u_rotationRate: getRangeVal('rotationrate'),
      u_searchAngle: getRangeVal('searchangle'),
      u_pheroTexture: pfb2.attachments[0],
      u_simTexture: fb1.attachments[0],
      u_time: (Date.now() - startTime) / 1000,
    });
    twgl.bindFramebufferInfo(gl, fb2);
    twgl.drawBufferInfo(gl, minimalVertexInfo);

    // render the current particles
    gl.useProgram(rendererInfo.program);
    twgl.setBuffersAndAttributes(gl, rendererInfo, pointsVertexInfo);
    twgl.setUniforms(rendererInfo, {
      u_resolution: [gl.canvas.width, gl.canvas.height],
      u_simResolution: [simSize, simSize],
      u_simTexture: fb1.attachments[0],
      u_time: (Date.now() - startTime) / 500,
    });
    twgl.bindFramebufferInfo(gl, pfb2);
    twgl.drawBufferInfo(gl, pointsVertexInfo, gl.POINTS);

    // render the texture to the screen
    gl.useProgram(textureRendererInfo.program);
    twgl.setBuffersAndAttributes(gl, textureRendererInfo, minimalVertexInfo);
    twgl.setUniforms(textureRendererInfo, {
      u_resolution: [gl.canvas.width, gl.canvas.height],
      u_simResolution: [simSize, simSize],
      u_texture: pfb1.attachments[0],
    });
    twgl.bindFramebufferInfo(gl);
    twgl.drawBufferInfo(gl, minimalVertexInfo);

    // swap buffers
    var tmp = fb1;
    fb1 = fb2;
    fb2 = tmp;

    // swap pheromone buffers
    tmp = pfb1;
    pfb1 = pfb2;
    pfb2 = tmp;

    frameId = requestAnimationFrame(animate);
  }
  if (!disabled)
    frameId = requestAnimationFrame(animate);
}

function initIndices() {
  // uv positions for sprites in the vertex shader 
  // (where in the sim texture do the particles get their simulation data from)
  const simIndex = new Float32Array(pCount / 4);
  for (let x = 0; x < simSize; x++) {
    for (let y = 0; y < simSize; y++) {
      let i = (x * simSize + y) * 2;
      simIndex[i] = x;
      simIndex[i + 1] = y;
    }
  }
  return simIndex;
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