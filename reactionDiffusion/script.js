var canvas = document.getElementById('canvas');

const gl = canvas.getContext("webgl");
var frameId;
var mouse = [-1, -1];
enableFloatTextures(gl);

var disabled = false;
var iterations = 10;
if (window.devicePixelRatio > 2) {
  iterations = 5
}

const vertexInfo = twgl.createBufferInfoFromArrays(gl, { a_position: [-1, -1, 0, 1, -1, 0, -1, 1, 0, -1, 1, 0, 1, -1, 0, 1, 1, 0], });
function init() {
  //initialize the render shader
  const rendererInfo = twgl.createProgramInfo(gl, ['vs', 'renderShader']);
  gl.useProgram(rendererInfo.program);
  twgl.setBuffersAndAttributes(gl, rendererInfo, vertexInfo);
  twgl.setUniforms(rendererInfo, { resolution: [gl.canvas.width, gl.canvas.height] });

  //initialize the simulation shader
  const simulatorInfo = twgl.createProgramInfo(gl, ['vs', 'simShader']);
  const simUniforms = {
    dt: 1, //Math.max(time - prevTime, 20) / 50,
    resolution: [gl.canvas.width, gl.canvas.height],
    D_a: 0.2,
    D_b: 0.1,
    f: 0.0545,
    k: 0.062,
    mouse: mouse,
  };
  gl.useProgram(simulatorInfo.program);
  twgl.setUniforms(simulatorInfo, simUniforms);
  twgl.setBuffersAndAttributes(gl, simulatorInfo, vertexInfo);

  //initialize the textures
  var t1 = initTexture(), t2 = initTexture();
  const fb1 = newFramebuffer(gl, t1), fb2 = newFramebuffer(gl, t2);


  function animate() {
    gl.useProgram(simulatorInfo.program);

    //update parameters
    simUniforms.D_a = document.getElementById('daslider').value;
    simUniforms.D_b = document.getElementById('dbslider').value;
    simUniforms.f = document.getElementById('fslider').value;
    simUniforms.k = document.getElementById('kslider').value;
    simUniforms.mouse = mouse;

    twgl.setUniforms(simulatorInfo, simUniforms);
    for (var i = 0; i < iterations; i++) {
      //frame buffer swap
      gl.bindTexture(gl.TEXTURE_2D, t1);
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb2);
      twgl.drawBufferInfo(gl, vertexInfo);

      gl.bindTexture(gl.TEXTURE_2D, t2);
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb1);
      twgl.drawBufferInfo(gl, vertexInfo);
    }

    gl.useProgram(rendererInfo.program);
    gl.bindTexture(gl.TEXTURE_2D, t1);
    twgl.bindFramebufferInfo(gl);
    twgl.drawBufferInfo(gl, vertexInfo);
    frameId = requestAnimationFrame(animate);
  }
  if (frameId)
    window.cancelAnimationFrame(frameId);
  if (!disabled)
    frameId = requestAnimationFrame(animate);
}

function initTexture() {
  var floatBuffer = new Float32Array(4 * gl.canvas.width * gl.canvas.height);

  for (var y = 0; y < gl.canvas.height; y++) {
    for (var x = 0; x < gl.canvas.width; x++) {
      var i = gl.canvas.width * y + x;
      const dx = x - Math.ceil(x / 256) * 256;
      const dy = y - Math.ceil(y / 256) * 256;
      var dot = dx * dx + dy * dy < 90;
      if (dot) {
        floatBuffer[4 * i + 0] = 0.7 + Math.random() * 0.1;
        floatBuffer[4 * i + 1] = 1 - floatBuffer[4 * i + 0];
      }
    }
  }

  return twgl.createTexture(gl, {
    src: floatBuffer,
    width: gl.canvas.width,
  });
}

function setPreset(params) {
  params = JSON.parse(params)
  document.getElementById('daslider').value = params.D_a;
  document.getElementById('dbslider').value = params.D_b;
  document.getElementById('fslider').value = params.f;
  document.getElementById('kslider').value = params.k;
}

function newFramebuffer(gl, texture) {
  var fb = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
  return fb;
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

function enableFloatTextures(gl) {
  function webglError() {
    document.getElementById('webglWarning').style.display = '';
    disabled = true;
  }
  if (!gl.getExtension("OES_texture_float")) webglError();
  if (!gl.getExtension("OES_texture_float_linear")) webglError();
}

init();