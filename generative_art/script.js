var canvas = document.getElementById('canvas');
const c = canvas.getContext("2d");
const WIDTH = canvas.width;
const HEIGHT = canvas.height;
var res = Math.floor(6 + Math.random() * 8);
const NUM_POINTS = 2 ** res;

//homogenous random distribution around the center 0
const hrandom = () => Math.random() * 2 - 1;

class vertex {
  constructor(x, y, vx, vy, w) {
    this.x = x * WIDTH;
    this.y = y * HEIGHT;
    if (vx == undefined)
      this.vx = hrandom();
    if (vy == undefined)
      this.vy = hrandom();
    if (w == undefined)
      this.w = Math.random() * 6;
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




var alpha = .1;
//draw all points with a variable alpha
function drawPoints() {
  c.fillStyle = `rgba(255, 255, 255, ${alpha})`;

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

const wind = { vx: 0, vy: 0, ax: 0, ay: 0 };
//update all points
function updatePoints() {
  for (const point of points) {
    point.x += point.vx + wind.vx;
    point.y += point.vy + wind.vy;
    point.w *= .997;
  }
  drawPoints();
  //wind.vx += wind.ax;
  wind.vy += wind.ay;
  wind.ax = hrandom() * .005;
  wind.ay = hrandom() * .05 - .0025;
  requestAnimationFrame(updatePoints);
}

generatePoints(Math.random() * 5)
//prepare the canvas
c.fillStyle = '#111';
c.fillRect(0, 0, WIDTH, HEIGHT);

requestAnimationFrame(updatePoints);