// Procedural noise texture used for walls, floors, ceilings.
// Pure helper — only depends on Three.js.
import * as THREE from 'three';

export function makeNoiseTexture(size, base, variance, scale = 1) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(size, size);
  for (let i = 0; i < size * size; i++) {
    const n = (Math.random() - 0.5) * variance;
    img.data[i*4]   = Math.max(0, Math.min(255, base[0] + n));
    img.data[i*4+1] = Math.max(0, Math.min(255, base[1] + n * 0.9));
    img.data[i*4+2] = Math.max(0, Math.min(255, base[2] + n * 0.7));
    img.data[i*4+3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(scale, scale);
  return tex;
}
