var canvas = document.getElementById('canvas');
const c = canvas.getContext("2d", { alpha: false });


//Square canvas, of size SIDE x SIDE
const SIDE = canvas.height = canvas.width;
//the number of nodes per side
const N = R.randomInt(5, 50);

c.fillRect(0, 0, SIDE, SIDE);
c.fillStyle = 'rgb(255, 255, 255)';
c.strokeStyle = 'rgb(255, 255, 255)';
c.lineWidth = 2;
c.globalAlpha = 1;
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

//structured grid with increasing random motion to the right



//point grid with random lines
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
}