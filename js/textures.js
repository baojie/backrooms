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

// --- Floor-1 specific builders. Tuned to mimic the canonical "Lobby"
// reference photo: yellow wallpaper + damp mottled carpet + drop-ceiling
// tiles. Per-face proportions assume one tile per CELL=4m wall face.

// Vertical-seam yellow wallpaper. Adds 8 vertical seams (~50cm in world),
// a darker baseboard band, faint horizontal chair-rail line, plus random
// water stains and drip streaks for that 'damp' look.
export function makeWallpaperTexture(size, base, repeat = 1) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(size, size);
  for (let i = 0; i < size * size; i++) {
    const n = (Math.random() - 0.5) * 18;
    img.data[i*4]   = Math.max(0, Math.min(255, base[0] + n));
    img.data[i*4+1] = Math.max(0, Math.min(255, base[1] + n * 0.9));
    img.data[i*4+2] = Math.max(0, Math.min(255, base[2] + n * 0.5));
    img.data[i*4+3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  const seamCol = `rgba(${Math.max(0,base[0]-55)|0},${Math.max(0,base[1]-55)|0},${Math.max(0,base[2]-30)|0},0.55)`;
  ctx.strokeStyle = seamCol;
  ctx.lineWidth = 1;
  const seams = 8;
  for (let i = 1; i < seams; i++) {
    const x = (i / seams) * size + (Math.random() - 0.5) * 1.5;
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, size); ctx.stroke();
  }
  // baseboard (bottom ~6%) — slightly darker yellow-brown band
  ctx.fillStyle = `rgba(${Math.max(0,base[0]-70)|0},${Math.max(0,base[1]-65)|0},${Math.max(0,base[2]-40)|0},0.85)`;
  ctx.fillRect(0, size * 0.94, size, size * 0.06);
  ctx.strokeStyle = 'rgba(20,15,5,0.6)';
  ctx.beginPath(); ctx.moveTo(0, size * 0.94); ctx.lineTo(size, size * 0.94); ctx.stroke();
  // crown (top ~3%)
  ctx.fillStyle = `rgba(${Math.max(0,base[0]-40)|0},${Math.max(0,base[1]-40)|0},${Math.max(0,base[2]-20)|0},0.65)`;
  ctx.fillRect(0, 0, size, size * 0.03);
  // water-stain blobs
  for (let i = 0; i < 6; i++) {
    const cx = Math.random() * size;
    const cy = size * (0.05 + Math.random() * 0.85);
    const r = size * (0.05 + Math.random() * 0.10);
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, 'rgba(60,40,15,0.32)');
    g.addColorStop(1, 'rgba(60,40,15,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.fill();
  }
  // vertical drip streaks below stains
  for (let i = 0; i < 4; i++) {
    const x = Math.random() * size;
    const y0 = size * (0.1 + Math.random() * 0.4);
    const len = size * (0.15 + Math.random() * 0.30);
    const grd = ctx.createLinearGradient(x, y0, x, y0 + len);
    grd.addColorStop(0, 'rgba(45,28,8,0.30)');
    grd.addColorStop(1, 'rgba(45,28,8,0)');
    ctx.strokeStyle = grd; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y0 + len); ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat, repeat);
  return tex;
}

// Mottled damp carpet — large soft blobs of darker/lighter shades over a
// solid base, plus fine pixel grain. Looks like stained low-pile carpet.
export function makeCarpetTexture(size, base, repeat = 1) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  ctx.fillStyle = `rgb(${base[0]|0},${base[1]|0},${base[2]|0})`;
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 220; i++) {
    const cx = Math.random() * size;
    const cy = Math.random() * size;
    const r = 6 + Math.random() * 38;
    const dark = Math.random() < 0.62;
    const v = dark ? -28 : 18;
    const a = 0.10 + Math.random() * 0.22;
    const r2 = Math.max(0, Math.min(255, base[0] + v))|0;
    const g2 = Math.max(0, Math.min(255, base[1] + v * 0.9))|0;
    const b2 = Math.max(0, Math.min(255, base[2] + v * 0.55))|0;
    const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    grd.addColorStop(0, `rgba(${r2},${g2},${b2},${a})`);
    grd.addColorStop(1, `rgba(${r2},${g2},${b2},0)`);
    ctx.fillStyle = grd;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.fill();
  }
  const img = ctx.getImageData(0, 0, size, size);
  for (let i = 0; i < size*size; i++) {
    const n = (Math.random() - 0.5) * 22;
    img.data[i*4]   = Math.max(0, Math.min(255, img.data[i*4]   + n));
    img.data[i*4+1] = Math.max(0, Math.min(255, img.data[i*4+1] + n));
    img.data[i*4+2] = Math.max(0, Math.min(255, img.data[i*4+2] + n));
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat, repeat);
  return tex;
}

// Drop-ceiling acoustic tiles. Per-tile colour wobble, grid lines, random
// water-stain blotches in some tiles. `tilesPerSide` repeats inside the
// texture; pair with a sensible `repeat` to land tile sizes near 2m.
export function makeCeilingTileTexture(size, base, tilesPerSide = 2, repeat = 1) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const tile = size / tilesPerSide;
  for (let ix = 0; ix < tilesPerSide; ix++) {
    for (let iz = 0; iz < tilesPerSide; iz++) {
      const v = (Math.random() - 0.5) * 24;
      const r = Math.max(0, Math.min(255, base[0] + v))|0;
      const g = Math.max(0, Math.min(255, base[1] + v))|0;
      const b = Math.max(0, Math.min(255, base[2] + v))|0;
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(ix * tile, iz * tile, tile, tile);
      // fine pinhole texture inside the tile
      const img = ctx.getImageData(ix * tile, iz * tile, tile, tile);
      for (let i = 0; i < tile*tile; i++) {
        if (Math.random() > 0.85) continue;
        const n = (Math.random() - 0.5) * 16;
        img.data[i*4]   = Math.max(0, Math.min(255, img.data[i*4]   + n));
        img.data[i*4+1] = Math.max(0, Math.min(255, img.data[i*4+1] + n));
        img.data[i*4+2] = Math.max(0, Math.min(255, img.data[i*4+2] + n));
      }
      ctx.putImageData(img, ix * tile, iz * tile);
      // stain blotch in ~30% of tiles
      if (Math.random() < 0.30) {
        const cx = ix * tile + tile * (0.2 + Math.random()*0.6);
        const cy = iz * tile + tile * (0.2 + Math.random()*0.6);
        const sr = tile * (0.15 + Math.random() * 0.25);
        const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, sr);
        grd.addColorStop(0, 'rgba(70,50,20,0.42)');
        grd.addColorStop(1, 'rgba(70,50,20,0)');
        ctx.fillStyle = grd;
        ctx.beginPath(); ctx.arc(cx, cy, sr, 0, Math.PI*2); ctx.fill();
      }
    }
  }
  ctx.strokeStyle = 'rgba(35,25,12,0.65)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= tilesPerSide; i++) {
    const p = i * tile;
    ctx.beginPath(); ctx.moveTo(p, 0); ctx.lineTo(p, size); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, p); ctx.lineTo(size, p); ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat, repeat);
  return tex;
}
