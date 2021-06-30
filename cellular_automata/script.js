var canvas = document.getElementById('canvas');

const gl = canvas.getContext("webgl");
var frameId;

var disabled = false, pause;
var pColor = [0, 0, 0];
var mouse = [-1, -1];
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


function init() {  //initialize the shaders
  const initInfo = twgl.createProgramInfo(gl, ['vs', 'initShader']);
  const rendererInfo = twgl.createProgramInfo(gl, ['vs', 'textureRenderShader']);
  var pingpong = new PingPongShader('vs', 'simShader');

  // init uniforms
  const renderUniforms = {
    u_resolution: [gl.canvas.width, gl.canvas.height],
    u_texture: pingpong.bufferTexture,
  }
  pingpong.uniforms = {
    u_resolution: [gl.canvas.width, gl.canvas.height],
    u_mousePos: mouse,
  };


  //init vertex info
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
      u_mode: mode | 0,
    });
    twgl.bindFramebufferInfo(gl, pingpong.fb1);
    twgl.drawBufferInfo(gl, minimalVertexInfo);
  }
  //expose the function
  var currentMode = 0;
  window.reinit = () => {
    currentMode++;
    console.log(currentMode);
    initParticleTexture(currentMode % 3);
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
      twgl.setBuffersAndAttributes(gl, rendererInfo, minimalVertexInfo);
      twgl.setUniforms(rendererInfo, renderUniforms);
      twgl.bindFramebufferInfo(gl);
      twgl.drawBufferInfo(gl, minimalVertexInfo);
    }
    frameId = requestAnimationFrame(animate);
  }
  if (!disabled)
    frameId = requestAnimationFrame(animate);
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
      { format: gl.RGB, /*type: gl.UNSIGNED_INT,*/ wrapS: gl.MIRRORED_REPEAT, wrapT: gl.MIRRORED_REPEAT },
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


document.addEventListener("touchmove", pointermove, false);
document.addEventListener("mousemove", pointermove, false);
function pointermove(e) {
  if (e.touches)
    e = e.touches[0]
  var rect = gl.canvas.getBoundingClientRect();
  mouse[0] = (e.clientX - rect.left) / gl.canvas.clientWidth;
  mouse[1] = 1 - (e.clientY - rect.top) / gl.canvas.clientHeight;
}

init();