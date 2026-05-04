// Floor 10 — 顶楼 (rooftop): the goal. After nine floors of horror the
// player breaks out under an open dawn sky on the roof of a tall building.
// Helipad H-mark in the centre, scattered HVAC units / satellite dishes /
// water tower / antennas, distant city skyline silhouette ringing the
// horizon, white safety rail along the edges.

import { buildOpen } from './_layouts.js';

export function spawnProps(ctx) {
  const { THREE, levelGroup, GRID, CELL, WALL_HEIGHT, pick, wallBoxes } = ctx;
  const asphaltMat = new THREE.MeshLambertMaterial({ color: 0x383840 });
  const helipadYel = new THREE.MeshBasicMaterial({ color: 0xfde04a });
  const hvacMat    = new THREE.MeshLambertMaterial({ color: 0x6a6e74 });
  const ventMat    = new THREE.MeshLambertMaterial({ color: 0x303034 });
  const dishMat    = new THREE.MeshLambertMaterial({ color: 0xd6d2c4 });
  const towerMat   = new THREE.MeshLambertMaterial({ color: 0x686050, side: THREE.DoubleSide });
  const railMat    = new THREE.MeshLambertMaterial({ color: 0xeae5d2 });
  const skylineMat = new THREE.MeshBasicMaterial({ color: 0x18101a });
  const starMat    = new THREE.MeshBasicMaterial({ color: 0xfff0c8 });

  const half = (GRID/2) * CELL;

  // ---- Helipad: dark asphalt circle + yellow ring + big H ----
  {
    // Helipad disc (slightly raised so it reads on the dark floor)
    const disc = new THREE.Mesh(new THREE.CircleGeometry(7.0, 32), asphaltMat);
    disc.rotation.x = -Math.PI / 2;
    disc.position.set(0, 0.015, 0);
    levelGroup.add(disc);
    // Yellow outer ring (thin annulus via two circles painted on top)
    const ringG = new THREE.RingGeometry(6.55, 7.0, 32);
    const ring = new THREE.Mesh(ringG, helipadYel);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.020;
    levelGroup.add(ring);
    // Big H — three rectangles
    const barG = new THREE.PlaneGeometry(0.55, 4.0);
    const lBar = new THREE.Mesh(barG, helipadYel);
    lBar.rotation.x = -Math.PI / 2; lBar.position.set(-1.4, 0.025, 0); levelGroup.add(lBar);
    const rBar = new THREE.Mesh(barG, helipadYel);
    rBar.rotation.x = -Math.PI / 2; rBar.position.set( 1.4, 0.025, 0); levelGroup.add(rBar);
    const cBar = new THREE.Mesh(new THREE.PlaneGeometry(2.85, 0.55), helipadYel);
    cBar.rotation.x = -Math.PI / 2; cBar.position.set(0, 0.025, 0); levelGroup.add(cBar);
  }

  // ---- HVAC units: chunky gray box + 2 vent caps ----
  function buildHVAC() {
    const g = new THREE.Group();
    const w = 1.6 + Math.random() * 0.8;
    const h = 0.9 + Math.random() * 0.5;
    const d = 1.0 + Math.random() * 0.4;
    const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), hvacMat);
    body.position.y = h / 2; g.add(body);
    // Vent grilles on top
    for (const dx of [-w*0.25, w*0.25]) {
      const v = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.22, 12), ventMat);
      v.position.set(dx, h + 0.11, 0); g.add(v);
    }
    // Side intake louvers (just a darker plate)
    const louv = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.6, h * 0.6), ventMat);
    louv.position.set(0, h * 0.5, d/2 + 0.001); g.add(louv);
    return { g, w, d };
  }
  for (const [cx, cz] of pick(6)) {
    const wx = (cx-GRID/2)*CELL, wz = (cz-GRID/2)*CELL;
    if (wx*wx + wz*wz < 90) continue;     // keep helipad clear
    const { g, w, d } = buildHVAC();
    g.position.set(wx, 0, wz);
    g.rotation.y = Math.random() * Math.PI * 2;
    levelGroup.add(g);
    wallBoxes.push({ x: wx, z: wz, halfX: w/2, halfZ: d/2 });
  }

  // ---- Satellite dishes ----
  function buildDish() {
    const g = new THREE.Group();
    // Pole
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.1, 8), ventMat);
    pole.position.y = 0.55; g.add(pole);
    // Base plate
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.22, 0.04, 12), ventMat);
    plate.position.y = 0.02; g.add(plate);
    // Dish (a flattened sphere segment — use a sphere with thetaLength ~0.7 to
    // get a bowl-ish shape, opened toward +Z)
    const dishGeom = new THREE.SphereGeometry(0.55, 16, 10, 0, Math.PI * 2, 0, Math.PI / 3);
    const dish = new THREE.Mesh(dishGeom, dishMat);
    dish.rotation.x = Math.PI / 2;
    dish.position.set(0, 1.05, 0); g.add(dish);
    // Receiver arm + bulb
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.55), ventMat);
    arm.position.set(0, 1.05, 0.30); g.add(arm);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), ventMat);
    bulb.position.set(0, 1.05, 0.55); g.add(bulb);
    return g;
  }
  for (let i = 0; i < 3; i++) {
    const ang = Math.random() * Math.PI * 2;
    const r = 16 + Math.random() * 14;
    const wx = Math.cos(ang) * r, wz = Math.sin(ang) * r;
    const d = buildDish();
    d.position.set(wx, 0, wz);
    d.rotation.y = Math.atan2(-wx, -wz);    // point toward centre for variety
    levelGroup.add(d);
  }

  // ---- Water tower: cylindrical tank on splay legs ----
  {
    const wt = new THREE.Group();
    // Four legs spread out
    for (const [dx, dz] of [[-1.2,-1.2],[1.2,-1.2],[-1.2,1.2],[1.2,1.2]]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 4.4, 8), towerMat);
      // Tilt outward slightly (legs splay)
      leg.position.set(dx * 0.5, 2.2, dz * 0.5);
      // Aim each leg from base outward
      const len = Math.hypot(dx, dz);
      const tiltAxis = new THREE.Vector3(-dz/len, 0, dx/len);
      leg.quaternion.setFromAxisAngle(tiltAxis, 0.18);
      wt.add(leg);
    }
    // Tank body
    const tank = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 2.4, 16), towerMat);
    tank.position.y = 5.6; wt.add(tank);
    // Conical roof
    const roof = new THREE.Mesh(new THREE.ConeGeometry(1.6, 0.9, 16), towerMat);
    roof.position.y = 7.25; wt.add(roof);
    // Position somewhere off the helipad
    wt.position.set(-22, 0, -18);
    levelGroup.add(wt);
    wallBoxes.push({ x: -22, z: -18, halfX: 1.8, halfZ: 1.8 });
  }

  // ---- Antenna mast — thin cylinder + horizontal cross-arms + red light ----
  {
    const ant = new THREE.Group();
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.10, 8.0, 8), towerMat);
    mast.position.y = 4.0; ant.add(mast);
    for (const y of [3.0, 5.0, 7.0]) {
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.50, 0.04, 0.04), towerMat);
      arm.position.y = y; ant.add(arm);
    }
    // Red blinking aircraft warning light at top
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.10, 8, 6),
      new THREE.MeshBasicMaterial({ color: 0xff2030 }));
    tip.position.y = 8.0; ant.add(tip);
    ant.position.set(20, 0, 16);
    levelGroup.add(ant);
  }

  // ---- White safety rail around the perimeter ----
  const railH = 1.1;
  const railG = new THREE.BoxGeometry(half * 2, 0.05, 0.05);
  for (const z of [-half + 0.5, half - 0.5]) {
    for (const y of [0.4, railH]) {
      const r = new THREE.Mesh(railG, railMat);
      r.position.set(0, y, z); levelGroup.add(r);
    }
  }
  const railG2 = new THREE.BoxGeometry(0.05, 0.05, half * 2);
  for (const x of [-half + 0.5, half - 0.5]) {
    for (const y of [0.4, railH]) {
      const r = new THREE.Mesh(railG2, railMat);
      r.position.set(x, y, 0); levelGroup.add(r);
    }
  }
  // Posts every 2.5m
  const postG = new THREE.BoxGeometry(0.06, railH, 0.06);
  for (let i = -half + 0.5; i <= half - 0.5; i += 2.5) {
    for (const z of [-half + 0.5, half - 0.5]) {
      const p = new THREE.Mesh(postG, railMat);
      p.position.set(i, railH/2, z); levelGroup.add(p);
    }
    for (const x of [-half + 0.5, half - 0.5]) {
      const p = new THREE.Mesh(postG, railMat);
      p.position.set(x, railH/2, i); levelGroup.add(p);
    }
  }

  // ---- Distant city skyline — silhouette boxes ringing the rooftop ----
  // These sit OUTSIDE the playable area, drawn against the sky dome so they
  // read as far-away buildings rather than something to interact with.
  const skylineDist = 60;     // beyond fogFar so they fade in/out gradually
  for (let i = 0; i < 36; i++) {
    const ang = (i / 36) * Math.PI * 2 + Math.random() * 0.05;
    const w = 4 + Math.random() * 8;
    const h = 8 + Math.random() * 14;
    const d = 4 + Math.random() * 6;
    const r = skylineDist + (Math.random() - 0.5) * 6;
    const wx = Math.cos(ang) * r, wz = Math.sin(ang) * r;
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), skylineMat);
    b.position.set(wx, h/2 - 4, wz);          // sink slightly so they read as below the rooftop
    b.rotation.y = ang;
    levelGroup.add(b);
  }

  // ---- Realistic moon — Wikimedia Commons full-moon photo (Gregory H.
  // Revera, CC BY-SA 3.0), pre-cropped to a circular alpha mask. Rendered
  // as a Sprite so it always faces the camera — stays perfectly round no
  // matter where the player stands or which direction they look.
  // Hung near the zenith so the player has to tip their head up.
  {
    const tex = new THREE.TextureLoader().load('assets/textures/moon.png');
    tex.colorSpace = THREE.SRGBColorSpace;
    const moonMat = new THREE.SpriteMaterial({
      map: tex, transparent: true, depthWrite: false, fog: false,
    });
    const moon = new THREE.Sprite(moonMat);
    moon.scale.set(18, 18, 1);
    moon.position.set(6, 50, 6);    // near zenith, slight offset off the antenna axis
    levelGroup.add(moon);
  }

  // ---- A scattering of stars / specks above (sphere of small dots) ----
  for (let i = 0; i < 80; i++) {
    const ang = Math.random() * Math.PI * 2;
    const elev = Math.random() * Math.PI * 0.4;     // upper hemisphere only
    const r = 55;
    const wx = Math.cos(ang) * Math.cos(elev) * r;
    const wy = Math.sin(elev) * r + 6;
    const wz = Math.sin(ang) * Math.cos(elev) * r;
    const star = new THREE.Mesh(new THREE.SphereGeometry(0.10 + Math.random() * 0.10, 4, 4), starMat);
    star.position.set(wx, wy, wz);
    levelGroup.add(star);
  }
}

export const FLOOR = {
  name: '顶楼',
  buildLayout: buildOpen,
  spawnProps,
  // Asphalt rooftop floor; walls are short outer parapet (handled by rail);
  // sky reads through `hasCeiling: false` so the dome shows.
  wallRGB:  [60, 56, 56],
  floorRGB: [42, 42, 46],
  ceilRGB:  [60, 56, 56],
  // Lift the ambient so the rooftop reads as 'pre-dawn' rather than abyss.
  ambient:  0x4a4868,
  lightHex: 0xffe0a8,
  // Sky / fog: deep indigo that reads as twilight, not pitch-black void.
  fogHex:   0x1a1a2c,
  fogNear:  20,
  fogFar:   80,
  hasCeiling: false,
  props: 'void',
};
