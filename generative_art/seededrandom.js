class SeededRandom {
  constructor(seed) {
    this.seed = seed;
    this.seedf = this.xmur3(seed);
  }

  resetSeed() {
    //resets the random object to the initial seed
    this.seedf = this.xmur3(seed);
  }

  xmur3(str) {
    for (var i = 0, h = 1779033703 ^ str.length; i < str.length; i++)
      h = Math.imul(h ^ str.charCodeAt(i), 3432918353),
        h = h << 13 | h >>> 19;
    return function () {
      h = Math.imul(h ^ h >>> 16, 2246822507);
      h = Math.imul(h ^ h >>> 13, 3266489909);
      return (h ^= h >>> 16) >>> 0;
    }
  }

  sfc32(a, b, c, d) {
    return function () {
      a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0;
      var t = (a + b) | 0;
      a = b ^ b >>> 9;
      b = c + (c << 3) | 0;
      c = (c << 21 | c >>> 11);
      d = d + 1 | 0;
      t = t + d | 0;
      c = c + t | 0;
      return (t >>> 0) / 4294967296;
    }
  }

  random() {
    return this.sfc32(this.seedf(), this.seedf(), this.seedf(), this.seedf())();
  }

  randomInt(a, b) {
    //if both are set, return a random integer between them, otherwise return a random integer between 0 and the argument
    if (a != undefined && b)
      return a + Math.floor(this.random() * (b - a + 1));
    else if (a && a > 0)
      return Math.floor(this.random() * a);
    else
      console.error("input of randomInt(a,b) has to be a valid number", a, b);
    return 0;
  }
}


function initializeSeed() {
  var seedQuery = location.search.substring(6);
  var tseed = seedQuery ? seedQuery : Math.random().toString(36).substring(3)
  document.getElementById('seed').textContent = tseed;
  document.getElementById('seed').href = '?seed=' + tseed;
  return tseed;
}

var R = new SeededRandom(initializeSeed());
