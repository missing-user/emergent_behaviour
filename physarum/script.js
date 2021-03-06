var canvas = document.getElementById("canvas");

const gl = canvas.getContext("webgl", {
  antialias: false,
});
var frameId;
enableFloatTextures(gl);

const minimalVertexInfo = twgl.createBufferInfoFromArrays(gl, {
  a_position: [-1, -1, 0, 1, -1, 0, -1, 1, 0, -1, 1, 0, 1, -1, 0, 1, 1, 0],
});

var mouse = [-1, -1];
var disabled = false;
var pause;

// Simulation constants
var simSize = 2048; // width & height of the simulation textures
if (window.devicePixelRatio > 2) simSize = 512;
var pCount = simSize * simSize;
canvas.width = simSize;
canvas.height = simSize;

function getRangeVal(id) {
  var range_val = document.getElementById(id).value;
  document.getElementById(id + "_out").textContent = range_val;
  return parseFloat(range_val);
}

function init() {
  //initialize the particle render shader
  const rendererInfo = twgl.createProgramInfo(gl, [
    "vs_points",
    "renderShader",
  ]);
  const pointsVertexInfo = twgl.createBufferInfoFromArrays(gl, {
    a_Index: {
      numComponents: 2,
      data: initIndices(),
    },
  });

  const initInfo = twgl.createProgramInfo(gl, ["vs", "initShader"]);
  const textureRendererInfo = twgl.createProgramInfo(gl, [
    "vs",
    "textureRenderShader",
  ]);

  const diffusor = new PingPongShader("vs", "diffusionShader");
  const simulator = new PingPongShader("vs", "simShader");
  diffusor.vertexInfo = minimalVertexInfo;
  simulator.vertexInfo = minimalVertexInfo;

  //initialize the simulation shader
  var startTime = Date.now();

  // particle initialization
  gl.useProgram(initInfo.program);
  twgl.setBuffersAndAttributes(gl, initInfo, minimalVertexInfo);
  twgl.setUniforms(initInfo, {
    u_resolution: [gl.canvas.width, gl.canvas.height],
  });
  twgl.bindFramebufferInfo(gl, simulator.fb1);
  twgl.drawBufferInfo(gl, minimalVertexInfo);

  function animate() {
    if (!pause) {
      gl.disable(gl.DEPTH_TEST);
      //diffuse pheromones
      diffusor.uniforms = {
        u_resolution: [gl.canvas.width, gl.canvas.height],
        u_mousePos: mouse,
        u_evaporationRate: getRangeVal("evaporationrate"),
      };
      diffusor.step();

      //gl.enable(gl.BLEND);
      //gl.blendFunc(gl.ONE, gl.ONE_MINUS_DST_ALPHA);
      //update simulation
      simulator.uniforms = {
        u_resolution: [gl.canvas.width, gl.canvas.height],
        u_searchDistance: getRangeVal("searchdistance"),
        u_speed: getRangeVal("movementspeed"),
        u_rotationRate: getRangeVal("rotationrate"),
        u_searchAngle: getRangeVal("searchangle"),
        u_turnrandom: getRangeVal("turnrandom"),
        u_pheroTexture: diffusor.fb1.attachments[0],
        u_time: (Date.now() - startTime) / 1000,
      };
      simulator.step();
      //gl.disable(gl.BLEND);

      // render the pheromone texture to the screen
      gl.useProgram(textureRendererInfo.program);
      twgl.setBuffersAndAttributes(gl, textureRendererInfo, minimalVertexInfo);
      twgl.setUniforms(textureRendererInfo, {
        u_resolution: [gl.canvas.width, gl.canvas.height],
        u_texture: diffusor.fb2.attachments[0], //diffusor.bufferTexture, // diffusor.fb2.attachments[0]
      });
      twgl.bindFramebufferInfo(gl);
      twgl.drawBufferInfo(gl, minimalVertexInfo);

      // render the current particles as red dots
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE);

      gl.useProgram(rendererInfo.program);
      twgl.setBuffersAndAttributes(gl, rendererInfo, pointsVertexInfo);
      twgl.setUniforms(rendererInfo, {
        u_resolution: [gl.canvas.width, gl.canvas.height],
        u_texture: simulator.bufferTexture,
        u_time: (Date.now() - startTime) / 500,
      });
      twgl.bindFramebufferInfo(gl, diffusor.fb1);
      twgl.drawBufferInfo(gl, pointsVertexInfo, gl.POINTS);

      gl.disable(gl.BLEND);
    }
    frameId = requestAnimationFrame(animate);
  }
  if (!disabled) frameId = requestAnimationFrame(animate);
}

function initIndices() {
  // uv positions for sprites in the vertex shader
  // (where in the sim texture do the particles get their simulation data from)
  const simIndex = new Float32Array(~~pCount / 2 ** 2);
  for (let x = 0; x < simSize; x++) {
    for (let y = 0; y < simSize; y++) {
      let i = (x * simSize + y) * 2;
      simIndex[i] = (x + 0.5) / simSize;
      simIndex[i + 1] = (y + 0.5) / simSize;
    }
  }
  return simIndex;
}

window.onscroll = () => {
  var rect = gl.canvas.getBoundingClientRect();
  pause = 0 > rect.top + gl.canvas.offsetHeight;
};

class PingPongShader {
  constructor(vs, fs, options = {}) {
    if ("vertexInfo" in options) {
      this.vertexInfo = options.vertexInfo;
    }
    if ("uniforms" in options) {
      this.uniforms = options.uniforms;
    }

    this.shaderInfo = twgl.createProgramInfo(gl, [vs, fs]);
    //initialize the buffer textures
    const attachments = [
      {
        format: gl.RGBA,
        type: gl.FLOAT,
        filter: gl.NEAREST,
        wrapS: gl.REPEAT,
        wrapT: gl.REPEAT,
      },
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

document.addEventListener("touchmove", pointermove, false);
document.addEventListener("mousemove", pointermove, false);

function pointermove(e) {
  if (e.touches) e = e.touches[0];
  var rect = gl.canvas.getBoundingClientRect();
  mouse[0] = (e.clientX - rect.left) / gl.canvas.clientWidth;
  mouse[1] = 1 - (e.clientY - rect.top) / gl.canvas.clientHeight;
}

function enableFloatTextures(gl) {
  function webglError() {
    document.getElementById("webglWarning").style.display = "";
    disabled = true;
  }
  if (!gl.getExtension("OES_texture_float")) webglError();
  if (!gl.getExtension("OES_texture_float_linear")) webglError();
}

init();
