var canvas = document.getElementById('canvas');
const c = canvas.getContext("2d");

//Square canvas, of size SIDE x SIDE
const SIDE = canvas.height = canvas.width;
//the number of nodes per side
const N = R.randomInt(5, 40);

c.fillRect(0, 0, SIDE, SIDE);
c.fillStyle = 'rgb(255, 255, 255)';
c.strokeStyle = 'rgb(255, 255, 255)';
c.lineWidth = 2;
//ensure there is a border around the canvas
c.translate(SIDE / N / 2, SIDE / N / 2);

var nodes = [];
for (let x = 0; x < N; x++) {
  nodes.push([]);
  for (let y = 0; y < N; y++) {
    nodes[x].push({
      x: x * SIDE / N,
      y: y * SIDE / N,
      w: R.random(),
    });
  }
}

//random velocities for animation
for (let x = 0; x < N; x++) {
  for (let y = 0; y < N; y++) {
    let node = nodes[x][y];
    node.vx = (R.random() - .5) * SIDE / N;
    node.vy = (R.random() - .5) * SIDE / N;
  }
}

const bw = false;
var startingHue;
//structured grid with increasing random motion to the right
c.globalAlpha = .5;
if (!bw) {
  c.globalCompositeOperation = 'screen';
  startingHue = R.randomInt(0, 300);
}
var time = 1;
function updatePoints() {// draw the nodes and lines between them
  if (!bw)
    c.strokeStyle = `hsl(${time * 60 + startingHue},100%,50%)`;
  for (let x = 0; x < N; x++) {
    for (let y = 0; y < N; y++) {
      let node = nodes[x][y];
      node.x += node.vx * .1 * x / N * x / N;
      node.y += node.vy * .1 * x / N * x / N;

      if (x > 0 && y > 0) {
        {
          var neighbor = nodes[x - 1][y];
          /*c.beginPath();
          c.lineTo(neighbor.x, neighbor.y);
          neighbor = nodes[x][y - 1];
          c.lineTo(neighbor.x, neighbor.y);
          c.lineTo(node.x, node.y);
          c.stroke();*/

          drawSquiglyLine(node, neighbor, .5, Math.sign(neighbor.vx) * (1 - time) * x / N)
        }
      }
    }
  }
  time -= .03;
  if (time > 0)
    requestAnimationFrame(updatePoints);
}

requestAnimationFrame(updatePoints);

/*
point grid with random lines
for (let x = 0; x < N; x++) {
  for (let y = 0; y < N; y++) {
    let node = nodes[x][y];
    //draw lines to random nodes (web like)
    c.beginPath();
    c.arc(node.x, node.y, node.w * 12, 0, 2 * Math.PI);
    c.fill();
    if (node.w > 0.95) {
      const neighbor = nodes[R.randomInt(N)][R.randomInt(N)];
      c.beginPath();
      c.moveTo(node.x, node.y);
      c.lineTo(neighbor.x, neighbor.y);
      c.stroke();
    }
  }
}*/


function drawSquiglyLine(v1, v2, center, strength) {
  let direction = sub(v2, v1);
  let orthVector = getOrthVector(direction);
  c.beginPath();
  c.moveTo(v1.x, v1.y);
  let p1Dist = 2 * center / 3;
  let p1 = add(v1, mul(direction, p1Dist), mul(orthVector, strength))
  let p2 = add(v1, mul(direction, 1 - p1Dist), mul(orthVector, -strength))
  c.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, v2.x, v2.y);
  c.stroke();
}

// subtract vector v2 from v1
function sub(v1, v2) {
  return { x: v1.x - v2.x, y: v1.y - v2.y };
}

//add arbitrary number of vectors
function add(...vectors) {
  let sum = { x: 0, y: 0 };
  for (let vector of vectors) {
    sum.x += vector.x;
    sum.y += vector.y;
  }
  return sum;
}

// multiply vector with scalar
function mul(v1, s) {
  return { x: v1.x * s, y: v1.y * s };
}

// get orthogonal vector of same length
function getOrthVector(v) {
  v = { x: v.y, y: -v.x };
  v.x = v.x;
  v.y = v.y;
  return v;
}

//get vector length
function length(v) {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}