var canvas = document.querySelector('canvas');
var ctx = canvas.getContext('2d');
const stepsPerFrame = 50;
var dt = .1 / stepsPerFrame;
const W = canvas.width;
const H = canvas.height;
const center = { x: W / 2, y: H / 2 };
const attractorStrength = .05;


var numBalls = 20;

var maincolor = "#333";
//set the colorscheme
if (window.matchMedia) {
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", e => {
    maincolor = e.matches ? "#d3d7cf" : "#333";
    console.log("theme change detected, setting color to", maincolor);
  });
  if (window.matchMedia("(prefers-color-scheme: dark)").matches)
    maincolor = "#d3d7cf";
}

function Ball(x, y, dx, dy, r) {
  this.x = x;
  this.y = y;
  this.dx = dx;
  this.dy = dy;
  this.r = r;
  this.locationHistory = []

  this.draw = function () {
    this.locationHistory.push([this.x, this.y])
    while (this.locationHistory.length > 2 / stepsPerFrame / dt)
      this.locationHistory.shift();
    ctx.beginPath()
    for (let i = 0; i < this.locationHistory.length; i++) {
      const hist = this.locationHistory[i];
      ctx.lineTo(hist[0], hist[1])
    }
    ctx.strokeStyle = "#999"
    ctx.stroke()


    //fill the circle
    ctx.fillStyle = this.colliding ? 'red' : maincolor;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, 2 * Math.PI);
    ctx.fill();

    if (this.colliding > 0)
      this.colliding--;
  }

  this.update = function () {
    this.x += this.dx * dt;
    this.y += this.dy * dt;
    this.dx -= (this.x - center.x) * dt * attractorStrength;
    this.dy -= (this.y - center.y) * dt * attractorStrength;
  }
}


var balls = [];

function reset() {
  balls = [];
  for (var i = 0; i < numBalls; i++) {
    var x = Math.random() * W;
    var y = Math.random() * H;
    var r = Math.random() * W / 50 + 10;
    balls.push(new Ball(x, y, Math.random() * W / 10 - W / 20, Math.random() * H / 10 - H / 20, r));
  }
}
reset();

function animate() {
  ctx.clearRect(0, 0, W, H);

  for (let i = 0; i < stepsPerFrame; i++) {
    for (var ball of balls) {
      ball.update();
      for (var ball2 of balls) {
        if (ball !== ball2) {
          var collision = checkCollision(ball, ball2);
          if (collision[0]) {
            adjustPositions(ball, ball2, collision[1]);
          }
        }
      }
    }

  }
  for (var ball of balls)
    ball.draw()

  requestAnimationFrame(animate);
}

animate();

function checkCollision(ballA, ballB) {
  var rSum = ballA.r + ballB.r;
  var dx = ballB.x - ballA.x;
  var dy = ballB.y - ballA.y;
  return [rSum * rSum > dx * dx + dy * dy, rSum - Math.sqrt(dx * dx + dy * dy)];
}

function adjustPositions(ballA, ballB, depth) {
  const pushStrength = .5;
  var correction = depth * pushStrength;

  if (depth < 0.01);
  ballA.colliding = ballB.colliding = 10

  var normal = [ballB.x - ballA.x, ballB.y - ballA.y];
  const mag = Math.sqrt(normal[0] * normal[0] + normal[1] * normal[1]);
  normal = [normal[0] / mag, normal[1] / mag];
  correction = [correction * normal[0], correction * normal[1]];
  ballA.x -= correction[0];
  ballA.y -= correction[1];
  ballB.x += correction[0];
  ballB.y += correction[1];
}