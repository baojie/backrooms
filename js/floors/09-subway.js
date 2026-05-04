// Floor 9 — 地铁站 (subway): two long platform walls flanking a real track
// — two parallel steel rails laid on wood sleepers in a gravel ballast,
// yellow safety stripes along the platform edges, hanging EXIT signs,
// and platform benches + trash bins.

import { buildPlatforms } from './_layouts.js';

export function spawnProps(ctx) {
  const { THREE, levelGroup, GRID, CELL, WALL_HEIGHT, wallBoxes } = ctx;
  const railMat   = new THREE.MeshLambertMaterial({ color: 0x9a9aa0 });   // shiny steel
  const sleeperMat = new THREE.MeshLambertMaterial({ color: 0x3a2818 });   // creosote-stained wood
  const ballastMat = new THREE.MeshLambertMaterial({ color: 0x484848 });   // dark gravel
  const yellowMat = new THREE.MeshBasicMaterial({ color: 0xfac820 });
  const benchMat  = new THREE.MeshLambertMaterial({ color: 0x2a3848 });
  const benchSlat = new THREE.MeshLambertMaterial({ color: 0x6a4a2a });
  const binMat    = new THREE.MeshLambertMaterial({ color: 0x303a44 });
  const signGreen = new THREE.MeshBasicMaterial({ color: 0x2a7038 });
  const signWhite = new THREE.MeshBasicMaterial({ color: 0xeae5d2 });

  // Track geometry — between the two platform walls placed by buildPlatforms.
  // Layout: lane1 = floor(GRID/3), lane2 = floor(2*GRID/3), so track centre
  // sits at the average of (lane1 + lane2)/2 → middle of GRID, x = 0 in
  // world space. Track stretches the full Z length minus the borders.
  const trackHalfX = (GRID/2 - GRID/3) * CELL * 0.5;     // half-width (~6m)
  const trackZSpan = (GRID - 2) * CELL;                   // ~100m

  // Ballast slab (slightly recessed look — sits at floor level)
  const ballast = new THREE.Mesh(new THREE.PlaneGeometry(trackHalfX * 2, trackZSpan), ballastMat);
  ballast.rotation.x = -Math.PI / 2;
  ballast.position.set(0, 0.005, 0);
  levelGroup.add(ballast);

  // Sleepers (every ~0.6m along the track)
  const sleeperG = new THREE.BoxGeometry(trackHalfX * 1.6, 0.06, 0.18);
  for (let z = -trackZSpan/2 + 0.4; z < trackZSpan/2; z += 0.65) {
    const sl = new THREE.Mesh(sleeperG, sleeperMat);
    sl.position.set(0, 0.04, z);
    levelGroup.add(sl);
  }

  // Two parallel steel rails on top of the sleepers
  const railGap = trackHalfX * 0.55;            // standard-gauge feel
  const railG = new THREE.BoxGeometry(0.10, 0.10, trackZSpan);
  for (const dx of [-railGap, +railGap]) {
    const r = new THREE.Mesh(railG, railMat);
    r.position.set(dx, 0.10, 0);
    levelGroup.add(r);
  }

  // Yellow platform-edge safety stripe — both platforms get one along their
  // inner edge (facing the track).
  const platformEdgeX = trackHalfX + 0.08;
  for (const dx of [-platformEdgeX, +platformEdgeX]) {
    const stripe = new THREE.Mesh(new THREE.PlaneGeometry(0.40, trackZSpan), yellowMat);
    stripe.rotation.x = -Math.PI / 2;
    stripe.position.set(dx, 0.012, 0);
    levelGroup.add(stripe);
  }

  // Benches placed against the OUTER edge of each platform (away from track)
  function buildBench() {
    const g = new THREE.Group();
    // Frame (two side legs)
    const sideG = new THREE.BoxGeometry(0.10, 0.50, 0.45);
    for (const dx of [-0.55, 0.55]) {
      const s = new THREE.Mesh(sideG, benchMat);
      s.position.set(dx, 0.25, 0); g.add(s);
    }
    // Three wood slats for the seat
    for (let i = 0; i < 3; i++) {
      const slat = new THREE.Mesh(new THREE.BoxGeometry(1.30, 0.04, 0.12), benchSlat);
      slat.position.set(0, 0.46, -0.13 + i * 0.13);
      g.add(slat);
    }
    return g;
  }
  const benchOuterX = trackHalfX + 2.8;
  for (let z = -trackZSpan/2 + 4; z < trackZSpan/2; z += 14) {
    for (const dx of [-benchOuterX, +benchOuterX]) {
      const b = buildBench();
      b.position.set(dx, 0, z);
      // Face the track (rotation.y = 0 → seat faces +Z which we want toward track)
      b.rotation.y = dx > 0 ? -Math.PI / 2 : Math.PI / 2;
      levelGroup.add(b);
      wallBoxes.push({ x: dx, z, halfX: 0.65, halfZ: 0.30 });
    }
  }

  // Trash bins along the platforms
  function buildBin() {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.20, 0.85, 14), binMat);
    body.position.y = 0.42; g.add(body);
    const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.04, 14), benchMat);
    lid.position.y = 0.86; g.add(lid);
    return g;
  }
  for (let z = -trackZSpan/2 + 12; z < trackZSpan/2; z += 18) {
    for (const dx of [-(benchOuterX + 1.2), +(benchOuterX + 1.2)]) {
      const bin = buildBin();
      bin.position.set(dx, 0, z);
      levelGroup.add(bin);
    }
  }

  // Hanging EXIT signs over each platform — a few suspended at intervals
  function buildExitSign() {
    const g = new THREE.Group();
    const board = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.45, 0.06), signGreen);
    g.add(board);
    // White EXIT bar (just a plain coloured strip — text would need a canvas
    // texture and isn't worth the complexity at this scale)
    const txt = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.18, 0.07), signWhite);
    g.add(txt);
    // Hanging stems
    const stemG = new THREE.BoxGeometry(0.04, 0.40, 0.04);
    for (const dx of [-0.55, 0.55]) {
      const stem = new THREE.Mesh(stemG, benchMat);
      stem.position.set(dx, 0.42, 0); g.add(stem);
    }
    return g;
  }
  for (let z = -trackZSpan/2 + 16; z < trackZSpan/2; z += 22) {
    for (const dx of [-benchOuterX, +benchOuterX]) {
      const sign = buildExitSign();
      sign.position.set(dx, WALL_HEIGHT - 0.85, z);
      levelGroup.add(sign);
    }
  }

  // A few rail-tie blocks lying near the track (debris)
  for (let i = 0; i < 4; i++) {
    const z = (Math.random() - 0.5) * trackZSpan * 0.8;
    const dx = (Math.random() - 0.5) * trackHalfX * 0.4;
    const block = new THREE.Mesh(new THREE.BoxGeometry(0.50, 0.18, 0.30), sleeperMat);
    block.position.set(dx, 0.09, z);
    block.rotation.y = Math.random() * Math.PI;
    levelGroup.add(block);
  }
}

export const FLOOR = {
  name: '地铁站',
  buildLayout: buildPlatforms,
  spawnProps,
  wallRGB:  [90, 90, 95],
  floorRGB: [40, 40, 45],
  ceilRGB:  [60, 60, 65],
  ambient:  0x303038,
  lightHex: 0xffe080,
  fogHex:   0x101014,
  fogNear:  2,
  fogFar:   18,
  hasCeiling: true,
  props: 'rails',
};
