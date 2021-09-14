var canvas = document.getElementById('canvas');

const gl = canvas.getContext("webgl");
var frameId;

var disabled = false, pause;
var pColor = [0, 0, 0];
const mouse = [-1, -1];
//set the colorscheme
if (window.matchMedia) {
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", e => {
    pColor = e.matches ? [1, 1, 1] : [0, 0, 0];
    console.log("theme change detected, setting color to", pColor);
  });
  if (window.matchMedia("(prefers-color-scheme: dark)").matches)
    pColor = [1, 1, 1];
}

let rect = canvas.getBoundingClientRect()
let closestPower2 = Math.floor(Math.log2(rect.width * window.devicePixelRatio));
canvas.width = canvas.height = 2 ** closestPower2;

const birthRule = [0, 0, 0, 1, 0, 0, 0, 0, 0], survivalRule = [0, 0, 1, 1, 0, 0, 0, 0, 0];
function setRules(ruleString) {
  for (let i = 0; i < 9; i++)
    birthRule[i] = survivalRule[i] = 0

  let reB = /[bB]\d{0,9}/
  let res = ruleString.match(reB)
  if (res)
    for (let i = 1; i < res[0].length; i++)
      birthRule[res[0][i]] = 1


  let reS = /[sS]\d{0,9}/
  res = ruleString.match(reS)
  if (res)
    for (let i = 1; i < res[0].length; i++)
      survivalRule[res[0][i]] = 1
}
setRules("B3S23")

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
    u_birth: birthRule,
    u_survival: survivalRule,
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
    initParticleTexture(currentMode % 5);
  };

  reinit()
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
    const attachments = [//LUMINANCE
      { format: gl.RGB, wrapS: gl.REPEAT, wrapT: gl.REPEAT },
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
document.addEventListener("pointerdown", (e) => { mouseDown = true; pointermove(e) }, false);
document.addEventListener("pointerup", (e) => { mouseDown = false; mouse[0] = mouse[1] = -5 }, false);

var mouseDown;

function pointermove(e) {
  if (e.touches)
    e = e.touches[0]

  if (mouseDown && !e.touches) {
    var rect = gl.canvas.getBoundingClientRect();
    mouse[0] = (e.clientX - rect.left) / gl.canvas.clientWidth;
    if (Math.abs(mouse[0]) > 1) mouse[0] = -5
    mouse[1] = 1 - (e.clientY - rect.top) / gl.canvas.clientHeight;
    if (Math.abs(mouse[1]) > 1) mouse[1] = -5
  }
}
init();