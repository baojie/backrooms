// Floor 5 — 农场 (farm): inspired by Backrooms canon Level 10 ("Field"):
// endless wheat under a wide overcast sky, broken up by scarecrows, rolled
// hay bales, a single sagging red barn on the horizon, and a wood fence
// running through the field. Pastoral but uncanny.

import { buildOpen } from './_layouts.js';

export function spawnProps(ctx) {
  const { THREE, levelGroup, GRID, CELL, pick, wallBoxes } = ctx;
  const stalkMat   = new THREE.MeshLambertMaterial({ color: 0xc8a440 });
  const stalkLight = new THREE.MeshLambertMaterial({ color: 0xe2c878 });
  const hayMat     = new THREE.MeshLambertMaterial({ color: 0xd9b56a });
  const woodMat    = new THREE.MeshLambertMaterial({ color: 0x6a4a2a });
  const barnRedMat = new THREE.MeshLambertMaterial({ color: 0x952218 });
  const barnRoof   = new THREE.MeshLambertMaterial({ color: 0x231a14 });
  const burlapMat  = new THREE.MeshLambertMaterial({ color: 0xb59060 });
  const strawMat   = new THREE.MeshLambertMaterial({ color: 0xeed68c });
  const scareDark  = new THREE.MeshLambertMaterial({ color: 0x3a2820 });

  // ---- Dense wheat: 3-stalk clumps scattered across the field ----
  const stalkG = new THREE.CylinderGeometry(0.012, 0.018, 1.0, 4);
  const headG  = new THREE.ConeGeometry(0.05, 0.18, 5);
  function addClump(wx, wz) {
    for (let i = 0; i < 3; i++) {
      const ox = (Math.random() - 0.5) * 0.18;
      const oz = (Math.random() - 0.5) * 0.18;
      const tilt = (Math.random() - 0.5) * 0.18;
      const yaw  = Math.random() * Math.PI * 2;
      const stalk = new THREE.Mesh(stalkG, Math.random() < 0.4 ? stalkLight : stalkMat);
      stalk.position.set(wx + ox, 0.5, wz + oz);
      stalk.rotation.set(tilt, yaw, tilt);
      levelGroup.add(stalk);
      const head = new THREE.Mesh(headG, stalkLight);
      head.position.set(wx + ox + Math.sin(yaw)*tilt*0.5, 1.05,
                        wz + oz + Math.cos(yaw)*tilt*0.5);
      head.rotation.set(tilt, yaw, tilt);
      levelGroup.add(head);
    }
  }
  // Spread clumps across the whole open field (not just `pick` cells).
  const half = (GRID/2) * CELL - 2;
  const clumpCount = 240;
  for (let i = 0; i < clumpCount; i++) {
    const wx = (Math.random() - 0.5) * 2 * half;
    const wz = (Math.random() - 0.5) * 2 * half;
    if (Math.abs(wx) < 4 && Math.abs(wz) < 4) continue;   // keep spawn clear
    addClump(wx, wz);
  }

  // ---- Rolled hay bales (cylindrical, lying on their side) ----
  function buildHayBale() {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.95, 14), hayMat);
    body.rotation.z = Math.PI / 2;
    body.position.y = 0.55;
    g.add(body);
    // End-cap straws — slight darker stripe
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.56, 0.03, 14),
      new THREE.MeshLambertMaterial({ color: 0xc0a058 }));
    cap.rotation.z = Math.PI / 2;
    cap.position.set(0.49, 0.55, 0); g.add(cap);
    const cap2 = cap.clone(); cap2.position.x = -0.49; g.add(cap2);
    return g;
  }
  for (let i = 0; i < 18; i++) {
    const wx = (Math.random() - 0.5) * 2 * half;
    const wz = (Math.random() - 0.5) * 2 * half;
    if (Math.abs(wx) < 6 && Math.abs(wz) < 6) continue;
    const bale = buildHayBale();
    bale.position.set(wx, 0, wz);
    bale.rotation.y = Math.random() * Math.PI;
    levelGroup.add(bale);
    wallBoxes.push({ x: wx, z: wz, halfX: 0.55, halfZ: 0.55 });
  }

  // ---- Scarecrows (cross + burlap head + straw hat) ----
  function buildScarecrow() {
    const g = new THREE.Group();
    // Vertical post
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.10, 1.8, 0.10), woodMat);
    post.position.y = 0.9; g.add(post);
    // Cross-arm
    const arm = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, 0.08), woodMat);
    arm.position.y = 1.30; g.add(arm);
    // Burlap shirt
    const shirt = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.55, 0.18), burlapMat);
    shirt.position.y = 1.10; g.add(shirt);
    // Sleeves (dangling)
    const slv = new THREE.BoxGeometry(0.12, 0.32, 0.12);
    const lSlv = new THREE.Mesh(slv, burlapMat); lSlv.position.set(-0.45, 1.05, 0); g.add(lSlv);
    const rSlv = new THREE.Mesh(slv, burlapMat); rSlv.position.set( 0.45, 1.05, 0); g.add(rSlv);
    // Head — burlap sphere with stitched-eye dots
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 10), burlapMat);
    head.position.y = 1.55; g.add(head);
    const eyeG = new THREE.SphereGeometry(0.025, 6, 6);
    const lEye = new THREE.Mesh(eyeG, scareDark); lEye.position.set(-0.06, 1.58, -0.16); g.add(lEye);
    const rEye = new THREE.Mesh(eyeG, scareDark); rEye.position.set( 0.06, 1.58, -0.16); g.add(rEye);
    // Straw hat — cone + brim
    const hat = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.20, 10), strawMat);
    hat.position.y = 1.78; g.add(hat);
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.30, 0.30, 0.03, 14), strawMat);
    brim.position.y = 1.68; g.add(brim);
    return g;
  }
  for (let i = 0; i < 4; i++) {
    const ang = (i / 4) * Math.PI * 2 + Math.random() * 0.6;
    const r = 18 + Math.random() * 16;
    const wx = Math.cos(ang) * r, wz = Math.sin(ang) * r;
    const sc = buildScarecrow();
    sc.position.set(wx, 0, wz);
    sc.rotation.y = Math.random() * Math.PI * 2;
    levelGroup.add(sc);
    wallBoxes.push({ x: wx, z: wz, halfX: 0.18, halfZ: 0.18 });
  }

  // ---- Wood post-and-rail fence — one long line through the field ----
  const fenceY = 0.6;
  const fzOffset = -16;   // offset south of the spawn so it doesn't block start
  for (let fx = -36; fx <= 36; fx += 2.4) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.10, 1.20, 0.10), woodMat);
    post.position.set(fx, fenceY, fzOffset);
    levelGroup.add(post);
  }
  // Two horizontal rails between posts
  for (const railY of [0.95, 0.45]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(72.0, 0.08, 0.05), woodMat);
    rail.position.set(0, railY, fzOffset);
    levelGroup.add(rail);
  }

  // ---- Distant red barn — one large structure on the horizon ----
  const barn = new THREE.Group();
  const bodyB = new THREE.Mesh(new THREE.BoxGeometry(8.0, 4.0, 5.0), barnRedMat);
  bodyB.position.y = 2.0; barn.add(bodyB);
  // Pitched roof (two sloped slabs)
  const roofL = new THREE.Mesh(new THREE.BoxGeometry(8.4, 0.20, 3.2), barnRoof);
  roofL.rotation.x = -Math.atan2(2.2, 2.5);
  roofL.position.set(0, 4.0 + 1.1, -1.25); barn.add(roofL);
  const roofR = new THREE.Mesh(new THREE.BoxGeometry(8.4, 0.20, 3.2), barnRoof);
  roofR.rotation.x = +Math.atan2(2.2, 2.5);
  roofR.position.set(0, 4.0 + 1.1, +1.25); barn.add(roofR);
  // Gable triangles (front + back) — quick prism via thin BoxGeometry
  const gable = new THREE.Mesh(new THREE.BoxGeometry(8.0, 2.2, 0.10), barnRedMat);
  gable.position.set(0, 4.0 + 1.1, -2.45); barn.add(gable);
  const gable2 = gable.clone(); gable2.position.z = +2.45; barn.add(gable2);
  // Wide barn door (dark)
  const door = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.8, 0.05), barnRoof);
  door.position.set(0, 1.4, -2.55); barn.add(door);
  // Cross-batten white X on the door
  const batten = new THREE.MeshLambertMaterial({ color: 0xddd5c0 });
  const bx1 = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.10, 0.06), batten);
  bx1.position.set(0, 1.4, -2.575); bx1.rotation.z =  Math.atan2(2.6, 2.6); barn.add(bx1);
  const bx2 = bx1.clone(); bx2.rotation.z = -Math.atan2(2.6, 2.6); barn.add(bx2);
  // Place on the horizon
  barn.position.set(-32, 0, 30);
  barn.rotation.y = -Math.PI / 6;
  levelGroup.add(barn);
  wallBoxes.push({ x: -32, z: 30, halfX: 4.5, halfZ: 3.0 });
}

export const FLOOR = {
  name: '农场',
  buildLayout: buildOpen,
  spawnProps,
  wallRGB:  [140, 108,  70],
  floorRGB: [ 80, 130,  58],     // slightly more saturated grass
  ceilRGB:  [120, 170, 220],
  ambient:  0x9cb6d0,            // brighter overcast bounce
  lightHex: 0xffeec4,
  fogHex:   0xc4d8e6,
  fogNear:  10,
  fogFar:   48,                   // wider draw distance for the open field
  hasCeiling: false,
  props: 'crops',
};
