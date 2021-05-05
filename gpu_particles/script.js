var canvas = document.getElementById('canvas');

const gl = canvas.getContext("webgl");
var frameId;

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
  enableFloatTextures(gl);

  //initialize the shaders
  const initInfo = twgl.createProgramInfo(gl, ['vs', 'initShader']);
  const rendererInfo = twgl.createProgramInfo(gl, ['vs_points', 'renderShader']);
  var pingpong = new PingPongShader('vs', 'simShader');

  // init uniforms
  const renderUniforms = {
    u_resolution: [gl.canvas.width, gl.canvas.height],
    u_simResolution: [simSize, simSize],
    u_simTexture: pingpong.bufferTexture,
  }
  pingpong.uniforms = {
    u_dt: .02,
    u_resolution: [gl.canvas.width, gl.canvas.height],
    u_simResolution: [simSize, simSize],
    u_speed: .2,
    u_rotationRate: 2,
  };


  //init vertex info
  const renderVertexInfo = twgl.createBufferInfoFromArrays(gl, {
    a_Index: { numComponents: 2, data: initIndices(), },
  });
  const minimalVertexInfo = twgl.createBufferInfoFromArrays(gl, {
    a_position: [-1, -1, 0, 1, -1, 0, -1, 1, 0, -1, 1, 0, 1, -1, 0, 1, 1, 0],
  });
  pingpong.vertexInfo = minimalVertexInfo;

  function initParticleTexture(mode) {
    // particle initialization
    gl.useProgram(initInfo.program);
    twgl.setBuffersAndAttributes(gl, initInfo, minimalVertexInfo);
    twgl.setUniforms(initInfo, {
      u_resolution: [gl.canvas.width, gl.canvas.height],
      u_simResolution: [simSize, simSize],
      u_mode: mode | 0,
    });
    twgl.bindFramebufferInfo(gl, pingpong.fb1);
    twgl.drawBufferInfo(gl, minimalVertexInfo);
  }
  //expose the function
  var currentMode = 0;
  window.reinit = () => {
    currentMode++;
    initParticleTexture(currentMode % 6);
  };

  initParticleTexture();
  var startTime = Date.now();

  function animate() {
    if (!pause) {
      pingpong.uniforms.u_time = (Date.now() - startTime) / 1000;
      pingpong.step();

      //update the sim Texture in renderer
      gl.useProgram(rendererInfo.program);
      renderUniforms.u_pColor = pColor;
      twgl.setBuffersAndAttributes(gl, rendererInfo, renderVertexInfo);
      twgl.setUniforms(rendererInfo, renderUniforms);
      twgl.bindFramebufferInfo(gl);
      twgl.drawBufferInfo(gl, renderVertexInfo, gl.POINTS);
    }
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

function enableFloatTextures(gl) {
  function webglError() {
    document.getElementById('webglWarning').style.display = '';
    disabled = true;
  }
  if (!gl.getExtension("OES_texture_float")) webglError();
  if (!gl.getExtension("OES_texture_float_linear")) webglError();
}

class PingPongShader {
  constructor(vs, fs, options = {}) {
    if ('vertexInfo' in options) {
      this.vertexInfo = options.vertexInfo;
    }
    if ('uniforms' in options) {
      this.uniforms = options.uniforms;
    }

    this.shaderInfo = twgl.createProgramInfo(gl, [vs, fs]);
    //initialize the buffer textures
    const attachments = [
      { format: gl.RGBA, type: gl.FLOAT, wrapS: gl.MIRRORED_REPEAT, wrapT: gl.MIRRORED_REPEAT },
    ];
    this.fb1 = twgl.createFramebufferInfo(gl, attachments);
    this.fb2 = twgl.createFramebufferInfo(gl, attachments);

  }
  step() {
    gl.useProgram(this.shaderInfo.program);
    this.uniforms.u_texture = this.fb1.attachments[0];
    twgl.setUniforms(this.shaderInfo, this.uniforms);
    twgl.setBuffersAndAttributes(gl, this.shaderInfo, this.vertexInfo);
    twgl.bindFramebufferInfo(gl, this.fb2);
    twgl.drawBufferInfo(gl, this.vertexInfo);


    // swap buffers
    var tmp = this.fb1;
    this.fb1 = this.fb2;
    this.fb2 = tmp;
  }
  get bufferTexture() {
    return this.fb1.attachments[0];
  }
}


//pause simulation when invisible for performance
window.onscroll = () => {
  var rect = gl.canvas.getBoundingClientRect();
  pause = (0 > rect.top + gl.canvas.offsetHeight)
}


init();