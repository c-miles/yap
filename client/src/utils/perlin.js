class Noise {
  constructor(seed = Math.random()) {
    this.seed = seed;
    this.permutation = this.generatePermutation();
  }

  generatePermutation() {
    const p = [];
    for (let i = 0; i < 256; i++) {
      p[i] = i;
    }
    
    let n = this.seed * 256;
    for (let i = 255; i > 0; i--) {
      n = (n * 9301 + 49297) % 233280;
      const j = Math.floor((n / 233280) * i);
      [p[i], p[j]] = [p[j], p[i]];
    }
    
    for (let i = 0; i < 256; i++) {
      p[256 + i] = p[i];
    }
    
    return p;
  }

  fade(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  lerp(t, a, b) {
    return a + t * (b - a);
  }

  grad(hash, x, y) {
    const h = hash & 3;
    const u = h < 2 ? x : y;
    const v = h < 2 ? y : x;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  perlin2(x, y) {
    const p = this.permutation;
    
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    
    x -= Math.floor(x);
    y -= Math.floor(y);
    
    const u = this.fade(x);
    const v = this.fade(y);
    
    const A = p[X] + Y;
    const B = p[X + 1] + Y;
    
    return this.lerp(v,
      this.lerp(u, this.grad(p[A], x, y), this.grad(p[B], x - 1, y)),
      this.lerp(u, this.grad(p[A + 1], x, y - 1), this.grad(p[B + 1], x - 1, y - 1))
    );
  }
}

export default Noise;