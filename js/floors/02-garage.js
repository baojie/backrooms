// Floor 2 — 车库 (garage): one open hall with parked cars and concrete pillars.

import { buildParking } from './_layouts.js';

export function spawnProps(ctx) {
  const { THREE, levelGroup, GRID, CELL, WALL_HEIGHT, wallBoxes } = ctx;
  // Open garage: rows of parked cars, support pillars, painted bay-line markers.
  const limit = (GRID/2) * CELL - 4;        // stay clear of outer walls
  const rowZs = [-14, -6, 6, 14];           // four parking rows
  // Lean toward neutral car colours (silvers/grays/black/white) with a few
  // saturated outliers, so the parking lot reads as realistic instead of
  // candy-coloured.
  const carBodyPalette = [
    0xc4c4c8, 0xe2e2dd, 0xa6a6aa, 0x808086,    // silvers / white / gray
    0x202028, 0x36383c, 0x4a4a52,                // blacks / charcoal
    0x1f2c44, 0x5a1f1f, 0x4a5a45, 0x6a4828,      // dark blue / maroon / olive / brown
  ];

  // Shared geometry/material caches — reused across cars so we don't pay
  // ~14 fresh allocations per car.
  const _glassMat   = new THREE.MeshBasicMaterial({ color: 0x182838, transparent: true, opacity: 0.62 });
  const _trimMat    = new THREE.MeshLambertMaterial({ color: 0x202024 });
  const _bumperMat  = new THREE.MeshLambertMaterial({ color: 0x222226 });
  const _grilleMat  = new THREE.MeshLambertMaterial({ color: 0x070707 });
  const _hlMat      = new THREE.MeshBasicMaterial({ color: 0xfff2cc });
  const _tlMat      = new THREE.MeshBasicMaterial({ color: 0x951010 });
  const _plateMat   = new THREE.MeshBasicMaterial({ color: 0xeeddaa });
  const _tireMat    = new THREE.MeshLambertMaterial({ color: 0x101010 });
  const _rimMat     = new THREE.MeshLambertMaterial({ color: 0x9a9a9a });
  const _shadowMat  = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.42 });
  const _tireG      = new THREE.CylinderGeometry(0.34, 0.34, 0.20, 14);
  const _rimG       = new THREE.CylinderGeometry(0.18, 0.18, 0.21, 10);
  const _bumperG    = new THREE.BoxGeometry(1.82, 0.18, 0.12);
  const _grilleG    = new THREE.BoxGeometry(0.78, 0.16, 0.05);
  const _hlG        = new THREE.BoxGeometry(0.42, 0.10, 0.05);
  const _tlG        = new THREE.BoxGeometry(0.50, 0.13, 0.05);
  const _plateG     = new THREE.BoxGeometry(0.45, 0.10, 0.02);
  const _mirrorG    = new THREE.BoxGeometry(0.10, 0.07, 0.18);
  const _sideWindowG = new THREE.BoxGeometry(0.04, 0.40, 1.20);
  const _shadowG    = new THREE.PlaneGeometry(2.10, 4.30);
  const _roofTrimG  = new THREE.BoxGeometry(1.55, 0.04, 0.85);

  // Cached body silhouettes per type. Front of car = -Z (so headlights
  // sit at z < 0); the shape is built in (X-shape, Y-shape) where +X-shape
  // = front, then extruded along width and rotated so X-shape → -Z-world.
  const HALF_L = 2.0;     // half length → 4m car
  const WIDTH  = 1.78;    // width across (wheels at ±0.85 stick out ~0.04)
  function makeBodyGeom(type) {
    const p = new THREE.Shape();
    p.moveTo(-HALF_L,        0);                // rear bumper bottom
    p.lineTo(-HALF_L,        0.55);             // rear bumper top
    if (type === 'sedan') {
      p.lineTo(-HALF_L + 0.40, 0.65);           // trunk shelf
      p.lineTo(-HALF_L + 1.00, 1.32);           // C-pillar (rear roof corner)
    } else {
      // hatchback: steeper rear, no trunk shelf
      p.lineTo(-HALF_L + 0.55, 1.32);
    }
    p.lineTo( HALF_L - 1.80,  1.32);            // front roof corner (A-pillar)
    p.lineTo( HALF_L - 1.40,  0.65);            // hood / windshield base
    p.lineTo( HALF_L - 0.15,  0.62);            // hood top
    p.lineTo( HALF_L,         0.55);            // front bumper top
    p.lineTo( HALF_L,         0);                // front bumper bottom
    const g = new THREE.ExtrudeGeometry(p, { depth: WIDTH, bevelEnabled: false, steps: 1 });
    g.translate(0, 0, -WIDTH / 2);
    g.rotateY(Math.PI / 2);
    return g;
  }
  let _bodyGeoms;
  try {
    _bodyGeoms = { sedan: makeBodyGeom('sedan'), hatch: makeBodyGeom('hatch') };
  } catch (e) { console.error('[garage] makeBodyGeom failed:', e); throw e; }

  function buildCarMesh(bodyColor, type) {
    const g = new THREE.Group();
    const bodyMat = new THREE.MeshLambertMaterial({ color: bodyColor });
    g.add(new THREE.Mesh(_bodyGeoms[type], bodyMat));

    // Sloped windshield: from hood top (z=-0.6, y=0.65) to roof front
    // (z=-0.2, y=1.32). Lift slightly along the slope normal to avoid
    // z-fighting with the body.
    {
      const dz = -0.2 - (-0.6), dy = 1.32 - 0.65;
      const len = Math.hypot(dy, dz), ang = Math.atan2(dy, dz);
      const wsh = new THREE.Mesh(new THREE.BoxGeometry(WIDTH - 0.18, 0.04, len), _glassMat);
      wsh.rotation.x = -ang;
      wsh.position.set(0, (1.32 + 0.65)/2 + Math.cos(ang)*0.012,
                          (-0.2 + (-0.6))/2 + Math.sin(ang)*0.012);
      g.add(wsh);
    }
    // Sloped rear window (sedan only — hatchback's body covers it)
    if (type === 'sedan') {
      const dz = 1.65 - 1.0, dy = 1.32 - 0.65;
      const len = Math.hypot(dy, dz), ang = Math.atan2(dy, dz);
      const rwh = new THREE.Mesh(new THREE.BoxGeometry(WIDTH - 0.18, 0.04, len), _glassMat);
      rwh.rotation.x = +ang;
      rwh.position.set(0, (1.32 + 0.65)/2 + Math.cos(ang)*0.012,
                          (1.0 + 1.65)/2 - Math.sin(ang)*0.012);
      g.add(rwh);
    }
    // Side windows along the cabin
    const lWin = new THREE.Mesh(_sideWindowG, _glassMat);
    lWin.position.set(-(WIDTH/2 + 0.005), 1.05, +0.40); g.add(lWin);
    const rWin = new THREE.Mesh(_sideWindowG, _glassMat);
    rWin.position.set( +(WIDTH/2 + 0.005), 1.05, +0.40); g.add(rWin);

    // Subtle dark roof patch — most cars look better with a slight
    // contrast band on top.
    const roofTrim = new THREE.Mesh(_roofTrimG, _trimMat);
    roofTrim.position.set(0, 1.34, +0.40);
    g.add(roofTrim);

    // Wheels + rims
    for (const [dx, dz] of [[-0.85,-1.40],[0.85,-1.40],[-0.85,+1.40],[0.85,+1.40]]) {
      const tire = new THREE.Mesh(_tireG, _tireMat);
      tire.rotation.z = Math.PI / 2;
      tire.position.set(dx, 0.34, dz);
      g.add(tire);
      const rim = new THREE.Mesh(_rimG, _rimMat);
      rim.rotation.z = Math.PI / 2;
      rim.position.set(dx, 0.34, dz);
      g.add(rim);
    }

    // Front: bumper + grille + horizontal headlight bars
    const fBump = new THREE.Mesh(_bumperG, _bumperMat);
    fBump.position.set(0, 0.30, -HALF_L - 0.04); g.add(fBump);
    const grille = new THREE.Mesh(_grilleG, _grilleMat);
    grille.position.set(0, 0.50, -HALF_L - 0.025); g.add(grille);
    const lhl = new THREE.Mesh(_hlG, _hlMat); lhl.position.set(-0.55, 0.52, -HALF_L - 0.02); g.add(lhl);
    const rhl = new THREE.Mesh(_hlG, _hlMat); rhl.position.set( 0.55, 0.52, -HALF_L - 0.02); g.add(rhl);

    // Rear: bumper + tail-light strip + plate
    const rBump = new THREE.Mesh(_bumperG, _bumperMat);
    rBump.position.set(0, 0.30, +HALF_L + 0.04); g.add(rBump);
    const ltl = new THREE.Mesh(_tlG, _tlMat); ltl.position.set(-0.55, 0.50, +HALF_L + 0.025); g.add(ltl);
    const rtl = new THREE.Mesh(_tlG, _tlMat); rtl.position.set( 0.55, 0.50, +HALF_L + 0.025); g.add(rtl);
    const plate = new THREE.Mesh(_plateG, _plateMat);
    plate.position.set(0, 0.30, +HALF_L + 0.06); g.add(plate);

    // Side mirrors (small enough to skip if perf becomes an issue)
    const lMir = new THREE.Mesh(_mirrorG, _bumperMat);
    lMir.position.set(-(WIDTH/2 + 0.06), 1.00, -0.55); g.add(lMir);
    const rMir = new THREE.Mesh(_mirrorG, _bumperMat);
    rMir.position.set( +(WIDTH/2 + 0.06), 1.00, -0.55); g.add(rMir);

    // Ground shadow under the car
    const shadow = new THREE.Mesh(_shadowG, _shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.012;
    g.add(shadow);

    return g;
  }

  // Painted bay-line strips (under the cars, between rows)
  const lineMat = new THREE.MeshBasicMaterial({ color: 0xfff2a0 });
  const bayLineGeom = new THREE.PlaneGeometry(0.10, 4.2);
  for (const z of rowZs) {
    for (let bx = -limit + 1.25; bx <= limit + 0.5; bx += 2.5) {
      const line = new THREE.Mesh(bayLineGeom, lineMat);
      line.rotation.x = -Math.PI / 2;
      line.position.set(bx, 0.02, z);
      levelGroup.add(line);
    }
  }
  // Aisle direction arrows (subtle)
  const arrowGeom = new THREE.PlaneGeometry(1.4, 0.4);
  for (let z = -10; z <= 10; z += 4) {
    const a = new THREE.Mesh(arrowGeom, lineMat);
    a.rotation.x = -Math.PI / 2;
    a.position.set(0, 0.025, z);
    a.material = lineMat;
    levelGroup.add(a);
  }

  // Cars in each row
  for (let ri = 0; ri < rowZs.length; ri++) {
    const z = rowZs[ri];
    const facing = (ri % 2 === 0) ? 0 : Math.PI;  // alternate rows face opposite
    // Player spawn is roughly at (0, 0). Don't park on top of them.
    for (let bx = -limit + 1.25; bx <= limit - 1.25; bx += 2.5) {
      if (Math.abs(bx) < 4 && Math.abs(z) < 8) continue;  // keep aisle near spawn clear
      if (Math.random() < 0.32) continue;                // empty bays — keeps perf + realism
      const color = carBodyPalette[Math.floor(Math.random()*carBodyPalette.length)];
      const type  = Math.random() < 0.30 ? 'hatch' : 'sedan';
      const car = buildCarMesh(color, type);
      car.position.set(bx, 0, z);
      car.rotation.y = facing + (Math.random() - 0.5) * 0.04; // slight misalignment
      levelGroup.add(car);
      // Axis-aligned collision box (cars are ~1.85 × 4.0; rotated 0 or π → same axes)
      wallBoxes.push({ x: bx, z, halfX: 0.95, halfZ: 2.05 });
    }
  }

  // Concrete support pillars on a sparse grid for that parking-garage feel
  const pillarMat = new THREE.MeshLambertMaterial({ color: 0x9a8e7a });
  const pillarGeom = new THREE.BoxGeometry(0.8, WALL_HEIGHT, 0.8);
  for (let px = -16; px <= 16; px += 8) {
    for (let pz = -18; pz <= 18; pz += 10) {
      // Don't drop pillars right where cars are parked
      if (rowZs.some(rz => Math.abs(pz - rz) < 1.5)) continue;
      const p = new THREE.Mesh(pillarGeom, pillarMat);
      p.position.set(px, WALL_HEIGHT/2, pz);
      levelGroup.add(p);
      // Painted yellow base around pillar
      const base = new THREE.Mesh(
        new THREE.BoxGeometry(1.0, 0.05, 1.0),
        new THREE.MeshBasicMaterial({ color: 0xc9a020 })
      );
      base.position.set(px, 0.025, pz);
      levelGroup.add(base);
      wallBoxes.push({ x: px, z: pz, half: 0.45 });
    }
  }

  // Oil stains scattered on the floor
  const oilMat = new THREE.MeshBasicMaterial({ color: 0x101012 });
  for (let i = 0; i < 18; i++) {
    const oil = new THREE.Mesh(new THREE.CircleGeometry(0.4 + Math.random()*0.6, 8), oilMat);
    oil.rotation.x = -Math.PI / 2;
    oil.position.set((Math.random()-0.5) * (limit*1.6), 0.015, (Math.random()-0.5) * (limit*1.6));
    levelGroup.add(oil);
  }
  return;}

export const FLOOR = {
  name: '车库',
  buildLayout: buildParking,
  spawnProps,
  wallRGB:  [120, 120, 124],
  floorRGB: [ 70,  70,  72],
  ceilRGB:  [ 90,  90,  92],
  ambient:  0x484850,
  lightHex: 0xc4c8b0,
  fogHex:   0x202024,
  fogNear:  3,
  fogFar:   24,
  hasCeiling: true,
  props: 'cars',
};
