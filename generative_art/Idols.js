var canvas = document.getElementById('canvas');
var c = canvas.getContext("2d");


//the number of nodes per side
//each cell is 96*96, the circles are overlapping
const tileSize = 96; //100x100 has the circles barely touching
var N = 16;
//Square canvas, of size SIDE x SIDE
var SIDE = tileSize * N;

//for high res images:
const resolutionFactor = 2

canvas.height = canvas.width = resolutionFactor * (SIDE + tileSize)









///////////////////////////////////////////////////////////////////////////////
//the shapes

/**
 @abstract
 */
class Shape {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
  draw() {
  }
}



class Circle extends Shape {
  constructor(x, y) {
    super(x, y);
    this.r = R.randomInt(1, 3) * 16;
    this.concentric = R.randomInt(2) == 0;
    this.innerR = R.randomInt(3) * 16;
    this.startAngle = R.randomInt(4) * Math.PI / 2;
  }

  draw() {
    c.beginPath();
    c.arc(this.x, this.y, this.r, this.startAngle, this.startAngle + 2 * Math.PI);
    if (this.concentric)
      c.arc(this.x, this.y, this.innerR, this.startAngle, this.startAngle + 2 * Math.PI);

    c.stroke();
  }
}

class Dot extends Shape {
  constructor(x, y) {
    super(x, y);
    this.r = 4;
  }

  draw() {
    c.beginPath();
    c.arc(this.x, this.y, this.r, 0, 2 * Math.PI);
    c.fill();
  }
}

class Line extends Shape {
  constructor(x, y) {
    super(x, y);
    this.angle = R.randomInt(8) * Math.PI / 4;
    this.length = R.randomInt(1, 3) * 16;
  }

  draw() {
    c.beginPath();
    c.moveTo(this.x - Math.cos(this.angle) * this.length, this.y - Math.sin(this.angle) * this.length);
    c.lineTo(this.x + Math.cos(this.angle) * this.length, this.y + Math.sin(this.angle) * this.length);
    c.stroke();
  }
}

class smallArc extends Shape {
  constructor(x, y,) {
    super(x, y);
    this.startAngle = R.randomInt(4) * Math.PI / 2;
    this.endAngle = R.randomInt(1, 3) * Math.PI / 2 + this.startAngle;
    this.r = R.randomInt(1, 2) * 16;
  }
  draw() {
    c.beginPath();
    c.arc(this.x, this.y, this.r, this.startAngle, this.endAngle);
    c.stroke();
  }
}

class Arc extends Shape {
  constructor(x, y,) {
    super(x, y);
    this.startAngle = R.randomInt(4) * Math.PI / 2;
    this.endAngle = R.randomInt(1, 3) * Math.PI / 2 + this.startAngle;
    this.r = 48
  }
  draw() {
    c.beginPath();
    c.arc(this.x, this.y, this.r, this.startAngle, this.endAngle);
    c.stroke();
  }
}





function exportSvg() {
  var tmpC = c;
  c = new C2S(canvas.height, canvas.width);

  //reeinitialize the Random Object with the same seed as the canvas
  R = new SeededRandom(R.seed)
  regenerate(false)

  var mySerializedSVG = c.getSerializedSvg();
  c = tmpC;

  var svgBlob = new Blob([mySerializedSVG], { type: "image/svg+xml;charset=utf-8" });
  var svgUrl = URL.createObjectURL(svgBlob);
  var downloadLink = document.createElement("a");
  downloadLink.href = svgUrl;
  downloadLink.download = `${document.title}_(${R.seed}).svg`;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);

}

function regenerate(clear = true) {
  if (clear) {
    canvas.height = canvas.width = resolutionFactor * (SIDE + tileSize)
    R = new SeededRandom(initializeSeed())
  }

  c.scale(resolutionFactor, resolutionFactor);

  c.fillRect(0, 0, canvas.width, canvas.height);
  c.lineWidth = 6;
  c.lineCap = "round";
  //ensure there is a border around the canvas
  c.translate(SIDE / N, SIDE / N);


  // the actual code

  const allTypes = [Circle, Dot, Arc, Line, smallArc]
  var nodes = [];
  let coloredIn = R.randomInt(N - 6)

  for (let x = 0; x < N; x++) {
    nodes.push([]);
    for (let y = 0; y < N; y++) {
      //select a few random shapes
      let types = [];
      for (let i = 0; i < R.randomInt(2, (N - x)); i++) {
        let randomShape = allTypes[R.randomInt(allTypes.length)];
        types.push(new randomShape(x * SIDE / N, y * SIDE / N));
      }

      nodes[x].push(types);
    }
  }

  //draw the shapes
  c.fillStyle = c.strokeStyle = '#151515';
  for (let x = 0; x < N; x++) {
    for (let y = 0; y < N; y++) {

      if (!(coloredIn == y || coloredIn == x))
        nodes[x][y].forEach(e => e.draw());
    }
  }

  //only draw red ontop
  c.fillStyle = c.strokeStyle = '#f00';
  for (let x = 0; x < N; x++) {
    for (let y = 0; y < N; y++) {

      if (coloredIn == y || coloredIn == x)
        nodes[x][y].forEach(e => e.draw());
    }
  }

  c.translate(-4 * SIDE / N * resolutionFactor,
    -4 * SIDE / N * resolutionFactor);
  c.scale(4, 4);
  c.lineWidth = c.lineWidth / 4;
  nodes[5][5].forEach(e => e.draw());
}

regenerate()