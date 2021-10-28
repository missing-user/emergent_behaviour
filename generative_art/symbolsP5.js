var N = 8;
var SIDE;
var coloredIn;
var nodes;
function setup() {
  SIDE = canvas.height = canvas.width = 96 * N;
  createCanvas(SIDE, SIDE);

  nodes = [];
  coloredIn = randomInt(N);

  for (let x = 0; x < N; x++) {
    nodes.push([]);
    for (let y = 0; y < N; y++) {
      //select a few random shapes
      let types = [];
      for (let i = 0; i < randomInt(2, N - y); i++) {
        let randomShape = random([Circle, Dot, Arc, Line, smallArc]);
        types.push(new randomShape((x * SIDE) / N, (y * SIDE) / N));
      }

      nodes[x].push(types);
    }
  }

  strokeCap(ROUND);
  strokeWeight(4);
}

function randomInt(a, b) {
  //if both are set, return a random integer between them, otherwise return a random integer between 0 and the argument
  if (a != undefined && b) return a + Math.floor(random() * (b - a + 1));
  else if (a && a > 0) return Math.floor(random() * a);
  else console.error("input of randomInt(a,b) has to be a valid number", a, b);
  return 0;
}

///////////////////////////////////////////////////////////////////////////////
//the shapes

function periodGenerator(period) {
  if (period != 0) {
    let currentTime = 0;
    return function () {
      currentTime += ((deltaTime / 1000) * TWO_PI) / period;
      return currentTime;
    };
  }
  return () => 0;
}

/**
 @abstract
 */
class Shape {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
  draw() {}
}

class Circle extends Shape {
  constructor(x, y) {
    super(x, y);
    this.r = randomInt(1, 2) * 32;
    this.concentric = randomInt(2) == 0;
    this.innerR = randomInt(1,2) * 32;
    this.startAngle = randomInt(4) * HALF_PI;
    this.time = periodGenerator(randomInt(-3, 3));
  }

  draw() {
    //drawing
    noFill();
    arc(
      this.x,
      this.y,
      this.r,
      this.r,
      this.startAngle,
      this.startAngle + TWO_PI
    );
    if (this.concentric) {
      arc(
        this.x,
        this.y,
        this.innerR,
        this.innerR,
        this.startAngle,
        this.startAngle + TWO_PI
      );
      line(
        this.x + (this.r * sin(this.startAngle)) / 2,
        this.y + (this.r * cos(this.startAngle)) / 2,
        this.x + (this.innerR * sin(this.startAngle)) / 2,
        this.y + (this.innerR * cos(this.startAngle)) / 2
      );
    }

    //animation
    this.startAngle = this.time();
  }
}

class Dot extends Shape {
  constructor(x, y) {
    super(x, y);
    this.r = 4;
  }

  draw() {
    circle(this.x, this.y, this.r);
  }
}

class Line extends Shape {
  constructor(x, y) {
    super(x, y);
    this.startangle = randomInt(8) * QUARTER_PI;
    this.angle = randomInt(8) * QUARTER_PI;
    this.startlength = randomInt(3) * 16;
    this.length = this.startlength;
    this.time = periodGenerator(randomInt(3, 6));
  }

  draw() {
    line(
      this.x - Math.cos(this.angle) * this.length,
      this.y - Math.sin(this.angle) * this.length,
      this.x + Math.cos(this.angle) * this.length,
      this.y + Math.sin(this.angle) * this.length
    );

    //animation
    //this.length = sin(this.time()) *this.startlength
    this.angle = cos(this.time()) * PI + this.startangle;
  }
}

class smallArc extends Shape {
  constructor(x, y) {
    super(x, y);
    this.startAngle = randomInt(4) * HALF_PI;
    this.endAngle = randomInt(1, 3) * HALF_PI + this.startAngle;
    this.r = randomInt(1,3) * 32;
    this.time = periodGenerator(randomInt(4, 6) * (random() < 0.5 ? -1 : 1));
  }
  draw() {
    noFill();
    arc(
      this.x,
      this.y,
      this.r,
      this.r,
      this.startAngle + this.time(),
      this.endAngle + this.time()
    );
  }
}

class Arc extends Shape {
  constructor(x, y) {
    super(x, y);
    this.startAngle = randomInt(4) * HALF_PI;
    this.endAngle = randomInt(1, 3) * HALF_PI + this.startAngle;
    this.r = 96;
    this.time = periodGenerator(randomInt(4, 6) * (random() < 0.5 ? -1 : 1));
  }
  draw() {
    noFill();
    arc(
      this.x,
      this.y,
      this.r,
      this.r,
      this.startAngle + this.time(),
      this.endAngle + this.time()
    );
  }
}

function draw() {
  noLoop()
  background(0);
  translate(SIDE / N / 2, SIDE / N / 2);

  //draw the shapes
  fill("#acacac");
  stroke("#acacac");
  for (let x = 0; x < N; x++) {
    for (let y = 0; y < N; y++) {
      if (!(coloredIn == y || coloredIn == x))
        nodes[x][y].forEach((e) => e.draw());
    }
  }

  fill("#f00");
  stroke("#f00");
  for (let x = 0; x < N; x++) {
    for (let y = 0; y < N; y++) {
      if (coloredIn == y || coloredIn == x)
        nodes[x][y].forEach((e) => e.draw());
    }
  }
}
