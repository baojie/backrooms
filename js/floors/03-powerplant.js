// Floor 3 — 发电厂 (powerplant): industrial maintenance halls inspired by
// Backrooms canon Level 3 ("Electrical Station") and Level 2 ("Pipe Dreams"):
// chalky concrete, machinery covering walls floor-to-ceiling, hot pipes
// running along walls and ceiling, sodium-yellow + arc-blue lighting.

import { buildIndustrial } from './_layouts.js';

export function spawnProps(ctx) {
  const { THREE, levelGroup, GRID, CELL, WALL_HEIGHT, pick, wallBoxes } = ctx;
  // Shared materials (cached so each prop doesn't allocate fresh).
  const _metalDark   = new THREE.MeshLambertMaterial({ color: 0x3a3a40 });
  const _metalLight  = new THREE.MeshLambertMaterial({ color: 0x7a7a82 });
  const _rust        = new THREE.MeshLambertMaterial({ color: 0x6a3a1c });
  const _pipeMat     = new THREE.MeshLambertMaterial({ color: 0x806848 });
  const _hazardMat   = new THREE.MeshBasicMaterial({ color: 0xf2c020 });
  const _capMat      = new THREE.MeshLambertMaterial({ color: 0x2a2a30 });
  const _wireMat     = new THREE.MeshLambertMaterial({ color: 0x101010 });
  const _arcMat      = new THREE.MeshBasicMaterial({ color: 0xb0eaff });

  // ---- Transformer / generator units (taller, multi-part) ----
  function buildTransformer() {
    const g = new THREE.Group();
    // Concrete base
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.18, 1.2), _metalDark);
    base.position.y = 0.09; g.add(base);
    // Main cylindrical body
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 1.7, 18), _metalLight);
    body.position.y = 0.18 + 0.85; g.add(body);
    // Hazard stripe band
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.56, 0.18, 18), _hazardMat);
    band.position.y = 0.18 + 0.30; g.add(band);
    // Rusty cap on top
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.55, 0.18, 14), _rust);
    cap.position.y = 0.18 + 1.7 + 0.09; g.add(cap);
    // Two ceramic insulators on the cap
    const insG = new THREE.CylinderGeometry(0.06, 0.08, 0.34, 10);
    for (const dx of [-0.18, 0.18]) {
      const ins = new THREE.Mesh(insG, _metalLight);
      ins.position.set(dx, 0.18 + 1.7 + 0.18 + 0.17, 0); g.add(ins);
    }
    // Drooping wire to ceiling — two thin bars + a sag mid
    const wireG = new THREE.CylinderGeometry(0.025, 0.025, 1.2, 6);
    for (const dx of [-0.18, 0.18]) {
      const wire = new THREE.Mesh(wireG, _wireMat);
      wire.position.set(dx, 0.18 + 1.7 + 0.5 + 0.6, 0);
      g.add(wire);
    }
    return g;
  }

  // Place transformers along the open cells (wall-aligned where possible)
  for (const [cx, cz] of pick(10)) {
    const wx = (cx-GRID/2)*CELL, wz = (cz-GRID/2)*CELL;
    const t = buildTransformer();
    t.position.set(wx, 0, wz);
    t.rotation.y = Math.random() < 0.5 ? 0 : Math.PI / 2;
    levelGroup.add(t);
    wallBoxes.push({ x: wx, z: wz, halfX: 0.85, halfZ: 0.65 });
    // 60% chance of an animated arc light above the cap
    if (Math.random() < 0.6) {
      const arc = new THREE.PointLight(0xa0d8ff, 0.9, 4.5, 2);
      arc.position.set(wx, WALL_HEIGHT - 0.4, wz);
      levelGroup.add(arc);
      const arcDot = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), _arcMat);
      arcDot.position.copy(arc.position);
      levelGroup.add(arcDot);
    }
  }

  // ---- Wall-hugging horizontal pipe runs ----
  // Place a few long pipes along straight aisles. Use random open cells as
  // anchors; orient along whichever axis has more clear room.
  const pipeY = [0.9, 1.5, 2.1];
  for (const [cx, cz] of pick(14)) {
    const wx = (cx-GRID/2)*CELL, wz = (cz-GRID/2)*CELL;
    const along = Math.random() < 0.5 ? 'x' : 'z';
    const len = 6 + Math.random() * 6;          // 6–12m pipe section
    const y = pipeY[Math.floor(Math.random() * pipeY.length)];
    const r = 0.10 + Math.random() * 0.06;
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 10), _pipeMat);
    if (along === 'x') { pipe.rotation.z = Math.PI / 2; pipe.position.set(wx, y, wz - 1.6); }
    else               { pipe.rotation.x = Math.PI / 2; pipe.position.set(wx + 1.6, y, wz); }
    levelGroup.add(pipe);
    // Pipe support brackets every ~2.5m
    const brackets = Math.max(2, Math.floor(len / 2.5));
    for (let i = 0; i < brackets; i++) {
      const t = (i + 0.5) / brackets - 0.5;
      const bx = along === 'x' ? wx + t * len : wx + 1.6;
      const bz = along === 'x' ? wz - 1.6     : wz + t * len;
      const br = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.30, 0.06), _capMat);
      br.position.set(bx, y - 0.15, bz);
      levelGroup.add(br);
    }
  }

  // ---- Overhead conduit pipes (cross the ceiling) ----
  for (let i = 0; i < 6; i++) {
    const z = (Math.random() - 0.5) * (GRID - 4) * CELL * 0.7;
    const len = (GRID - 4) * CELL * 0.6;
    const r = 0.08;
    const conduit = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 8), _capMat);
    conduit.rotation.z = Math.PI / 2;
    conduit.position.set(0, WALL_HEIGHT - 0.20, z);
    levelGroup.add(conduit);
  }

  // ---- Yellow/black hazard floor stripes near a few transformers ----
  const hazardStripeMat = new THREE.MeshBasicMaterial({ color: 0xf2c020 });
  for (const [cx, cz] of pick(5)) {
    const wx = (cx-GRID/2)*CELL, wz = (cz-GRID/2)*CELL;
    for (let s = 0; s < 4; s++) {
      const stripe = new THREE.Mesh(new THREE.PlaneGeometry(0.30, 1.6), hazardStripeMat);
      stripe.rotation.x = -Math.PI / 2;
      stripe.position.set(wx - 1.0 + s * 0.42, 0.02, wz);
      levelGroup.add(stripe);
    }
  }
  return;}

export const FLOOR = {
  name: '发电厂',
  buildLayout: buildIndustrial,
  spawnProps,
  // Lift the wall/ceiling out of muddy near-black so the textures read.
  // Slight blue cast in the ambient + warmer sodium-yellow ceiling lights
  // contrast with the cold blue arc sparks on the machinery.
  wallRGB:  [102, 100, 100],
  floorRGB: [ 56,  54,  52],
  ceilRGB:  [ 78,  76,  78],
  ambient:  0x383844,
  lightHex: 0xfde0a8,        // warm sodium vapour
  fogHex:   0x14181c,
  fogNear:  3,
  fogFar:   24,
  hasCeiling: true,
  props: 'sparks',
};
