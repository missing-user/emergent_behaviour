var canvas = document.getElementById('canvas');
const c = canvas.getContext("2d");

var seedQuery = location.search.substring(6);
var seed = seedQuery ? seedQuery : Math.random().toString(36).substring(3)
document.getElementById('seed').textContent = seed;
document.getElementById('seed').href = '?seed=' + seed;
const R = new SeededRandom(seed)

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const exponent = Math.floor(6 + R.random() * 8)
const NUM_POINTS = 2 ** exponent;
var remainingSteps = 2 ** Math.floor(9 + R.random() * 4);

document.getElementById('age').textContent = 'age: ' + remainingSteps;
document.getElementById('resolution').textContent = 'resolution: ' + NUM_POINTS;

//homogenous random distribution around the center 0
const hrandom = () => R.random() * 2 - 1;

class vertex {
  constructor(x, y, vx, vy, w) {
    this.x = x * WIDTH;
    this.y = y * HEIGHT;
    if (vx == undefined)
      this.vx = hrandom();
    if (vy == undefined)
      this.vy = hrandom();
    if (w == undefined)
      this.w = R.random() * (10 - exponent / 2);
  }
}

const points = [];
function generatePoints(seed) {
  switch (Math.floor(seed) % 5) {
    case 0:
      // create the points on a circle
      for (let i = 0; i < NUM_POINTS; i++)
        points.push(new vertex(
          (Math.sin(2 * Math.PI * i / NUM_POINTS) + 2) / 4,
          (Math.cos(2 * Math.PI * i / NUM_POINTS) + 2) / 4));
      break;
    default:
    case 1:
      // create the points on a line
      for (let i = 0; i < NUM_POINTS; i++)
        points.push(new vertex(i / NUM_POINTS, .5));
      break;

    case 2:
      // create the points on a diagonal
      for (let i = 0; i < NUM_POINTS; i++)
        points.push(new vertex(i / NUM_POINTS, i / NUM_POINTS));
      break;

    case 3:
      // create the points on a triangle
      var pointsPerSide = NUM_POINTS / 3;
      var sideLength = Math.sqrt(3) / 4;
      for (let i = 0; i < pointsPerSide; i++) {
        points.push(new vertex(.5 - sideLength / 2 + (i / pointsPerSide) * sideLength / 2,
          5 / 8 - (i / pointsPerSide) * 3 / 8));
        points.push(new vertex(.5 + sideLength / 2 - (i / pointsPerSide) * sideLength / 2,
          5 / 8 - (i / pointsPerSide) * 3 / 8));
        points.push(new vertex(.5 + (i / pointsPerSide - .5) * sideLength, 5 / 8));
      }
      break;
    case 4:
      // create the points on a square
      var pointsPerSide = NUM_POINTS / 4;
      for (let i = 0; i < pointsPerSide; i++) {
        points.push(new vertex((1 + i / pointsPerSide) / 4, (2 - i / pointsPerSide) / 4));
        points.push(new vertex((3 - i / pointsPerSide) / 4, (2 - i / pointsPerSide) / 4));
        points.push(new vertex((3 - i / pointsPerSide) / 4, (2 + i / pointsPerSide) / 4));
        points.push(new vertex((1 + i / pointsPerSide) / 4, (2 + i / pointsPerSide) / 4));
      }
      break;

  }
}




var alpha = .02;
//draw all points with a variable alpha
function drawPoints() {
  c.globalAlpha = alpha;
  //draw dots
  for (const point of points) {
    c.beginPath();
    c.arc(point.x, point.y, point.w, 0, 2 * Math.PI, false);
    c.fill();
    c.closePath();
  } /* 
  for (const point of points) {
    c.fillRect(point.x, point.y, point.w, point.w)
  }*/
}


const wind = { vx: 0, vy: 0 };
//update all points
function updatePoints() {
  remainingSteps--;
  for (const point of points) {
    point.x += point.vx;
    point.y += point.vy;
    point.vx = wind.vx;
    point.vy = hrandom() + wind.vy;
    //point.w *= .997;
  }
  drawPoints();
  //wind.vx += hrandom() * 1e-3;
  wind.vy += hrandom() * .05;
  if (remainingSteps > 0)
    requestAnimationFrame(updatePoints);
  else
    console.log('finished');

}

generatePoints(R.random() * 5)
//prepare the canvas
//low chance to have a bright background with dark strokes
if (R.random() < .05) {
  c.fillStyle = `hsl(${R.random() * 360},${R.random() * 15}%,92%)`;
  document.body.style.background = c.fillStyle;
  c.fillRect(0, 0, WIDTH, HEIGHT);
  c.fillStyle = '#000';
} else {
  c.fillStyle = `hsl(${R.random() * 360},${R.random() * 100}%,8%)`;
  document.body.style.background = c.fillStyle;
  c.fillRect(0, 0, WIDTH, HEIGHT);
  c.fillStyle = '#fff';
}

console.log(remainingSteps);
requestAnimationFrame(updatePoints);
