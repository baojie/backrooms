// Floor 6 — 幼儿园 (kindergarten): abandoned-daycare aesthetic. Tiny pastel
// chairs, toy chests, broken teddy bears, scattered colored blocks and
// crayons, and a single rocking horse silhouette in the dim warm-pink light.

import { buildClassrooms } from './_layouts.js';

export function spawnProps(ctx) {
  const { THREE, levelGroup, GRID, CELL, pick, wallBoxes } = ctx;
  // Bright crayon-box palette for tiny props.
  const palette = [0xff6b8a, 0xffb84d, 0x7ddc7a, 0x6acfe6, 0xc78ce6, 0xfff066];
  function pickColor() { return palette[Math.floor(Math.random()*palette.length)]; }
  const chairWood   = new THREE.MeshLambertMaterial({ color: 0xe6c298 });
  const chestMat    = (c) => new THREE.MeshLambertMaterial({ color: c });
  const bearBody    = new THREE.MeshLambertMaterial({ color: 0xa67c52 });
  const bearMuzzle  = new THREE.MeshLambertMaterial({ color: 0xd9b890 });
  const bearEye     = new THREE.MeshBasicMaterial({ color: 0x080808 });
  const horseWhite  = new THREE.MeshLambertMaterial({ color: 0xeeeae0 });
  const horseRed    = new THREE.MeshLambertMaterial({ color: 0x8a2820 });

  // ---- Tiny chair: four short legs + flat seat + low backrest ----
  function buildChair(color) {
    const g = new THREE.Group();
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.40, 0.04, 0.40),
      new THREE.MeshLambertMaterial({ color }));
    seat.position.y = 0.32; g.add(seat);
    const legG = new THREE.BoxGeometry(0.04, 0.32, 0.04);
    for (const [dx, dz] of [[-0.16,-0.16],[0.16,-0.16],[-0.16,0.16],[0.16,0.16]]) {
      const l = new THREE.Mesh(legG, chairWood);
      l.position.set(dx, 0.16, dz); g.add(l);
    }
    const backG = new THREE.BoxGeometry(0.40, 0.32, 0.04);
    const back = new THREE.Mesh(backG, new THREE.MeshLambertMaterial({ color }));
    back.position.set(0, 0.50, -0.18); g.add(back);
    return g;
  }
  for (const [cx, cz] of pick(14)) {
    const wx = (cx-GRID/2)*CELL, wz = (cz-GRID/2)*CELL;
    const ch = buildChair(pickColor());
    ch.position.set(wx + (Math.random()-0.5)*1.2, 0, wz + (Math.random()-0.5)*1.2);
    ch.rotation.y = Math.random() * Math.PI * 2;
    levelGroup.add(ch);
  }

  // ---- Toy chest: box with a slightly raised lid ----
  function buildToyChest() {
    const g = new THREE.Group();
    const c = pickColor();
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.55, 0.6), chestMat(c));
    body.position.y = 0.275; g.add(body);
    const lid = new THREE.Mesh(new THREE.BoxGeometry(1.04, 0.08, 0.64), chestMat(0xc8a058));
    lid.position.y = 0.59; g.add(lid);
    // Brass clasp on the front
    const clasp = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.08, 0.02),
      new THREE.MeshLambertMaterial({ color: 0xc89030 }));
    clasp.position.set(0, 0.52, -0.32); g.add(clasp);
    return g;
  }
  for (const [cx, cz] of pick(5)) {
    const wx = (cx-GRID/2)*CELL, wz = (cz-GRID/2)*CELL;
    const tc = buildToyChest();
    tc.position.set(wx, 0, wz);
    tc.rotation.y = Math.random() * Math.PI * 2;
    levelGroup.add(tc);
    wallBoxes.push({ x: wx, z: wz, halfX: 0.55, halfZ: 0.35 });
  }

  // ---- Teddy bear: round body + head + ear stubs + black bead eyes ----
  function buildBear() {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), bearBody);
    body.position.y = 0.16; g.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 10), bearBody);
    head.position.y = 0.40; g.add(head);
    const earG = new THREE.SphereGeometry(0.04, 8, 6);
    for (const dx of [-0.10, 0.10]) {
      const ear = new THREE.Mesh(earG, bearBody);
      ear.position.set(dx, 0.50, 0); g.add(ear);
    }
    const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), bearMuzzle);
    muzzle.position.set(0, 0.38, -0.10); g.add(muzzle);
    const eyeG = new THREE.SphereGeometry(0.014, 6, 6);
    const lE = new THREE.Mesh(eyeG, bearEye); lE.position.set(-0.04, 0.43, -0.115); g.add(lE);
    const rE = new THREE.Mesh(eyeG, bearEye); rE.position.set( 0.04, 0.43, -0.115); g.add(rE);
    // Stubby limbs
    const armG = new THREE.SphereGeometry(0.05, 8, 6);
    const lA = new THREE.Mesh(armG, bearBody); lA.position.set(-0.16, 0.20,  0.05); g.add(lA);
    const rA = new THREE.Mesh(armG, bearBody); rA.position.set( 0.16, 0.20, -0.05); g.add(rA);
    return g;
  }
  for (const [cx, cz] of pick(8)) {
    const wx = (cx-GRID/2)*CELL, wz = (cz-GRID/2)*CELL;
    const bear = buildBear();
    bear.position.set(wx + (Math.random()-0.5)*1.5, 0, wz + (Math.random()-0.5)*1.5);
    bear.rotation.y = Math.random() * Math.PI * 2;
    // Half the bears have toppled — rotate around X
    if (Math.random() < 0.45) bear.rotation.x = Math.PI / 2 * (Math.random() < 0.5 ? 1 : -1);
    levelGroup.add(bear);
  }

  // ---- Scattered colored blocks ----
  const blockG = new THREE.BoxGeometry(0.16, 0.16, 0.16);
  for (const [cx, cz] of pick(12)) {
    const wx = (cx-GRID/2)*CELL, wz = (cz-GRID/2)*CELL;
    for (let i = 0; i < 3 + Math.floor(Math.random()*3); i++) {
      const b = new THREE.Mesh(blockG, new THREE.MeshLambertMaterial({ color: pickColor() }));
      b.position.set(wx + (Math.random()-0.5)*1.4, 0.08 + Math.random()*0.10,
                     wz + (Math.random()-0.5)*1.4);
      b.rotation.y = Math.random() * Math.PI;
      levelGroup.add(b);
    }
  }

  // ---- Crayons: small thin cylinders lying on their side ----
  const crayonG = new THREE.CylinderGeometry(0.013, 0.013, 0.12, 6);
  for (const [cx, cz] of pick(6)) {
    const wx = (cx-GRID/2)*CELL, wz = (cz-GRID/2)*CELL;
    for (let i = 0; i < 6; i++) {
      const c = new THREE.Mesh(crayonG, new THREE.MeshLambertMaterial({ color: pickColor() }));
      c.rotation.z = Math.PI / 2;
      c.rotation.y = Math.random() * Math.PI * 2;
      c.position.set(wx + (Math.random()-0.5)*0.9, 0.018,
                     wz + (Math.random()-0.5)*0.9);
      levelGroup.add(c);
    }
  }

  // ---- Single rocking horse — wood frame + striped white body ----
  {
    const horse = new THREE.Group();
    // Curved rocker base — two long arched bars (approximated with rotated boxes)
    for (const dz of [-0.32, 0.32]) {
      const rocker = new THREE.Mesh(new THREE.BoxGeometry(1.20, 0.06, 0.06), horseRed);
      rocker.position.set(0, 0.10, dz);
      horse.add(rocker);
    }
    // Body
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.36, 0.36), horseWhite);
    body.position.y = 0.55;
    horse.add(body);
    // Red saddle stripe
    const saddle = new THREE.Mesh(new THREE.BoxGeometry(0.50, 0.06, 0.40), horseRed);
    saddle.position.y = 0.74;
    horse.add(saddle);
    // Head
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.30, 0.20), horseWhite);
    head.position.set(0.55, 0.78, 0);
    horse.add(head);
    // Snout
    const snout = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.14, 0.16), horseWhite);
    snout.position.set(0.72, 0.72, 0); horse.add(snout);
    // Eye
    const eyeG = new THREE.SphereGeometry(0.024, 6, 6);
    const eye = new THREE.Mesh(eyeG, bearEye);
    eye.position.set(0.62, 0.85, 0.10); horse.add(eye);
    // Mane (red triangular fin behind the head)
    const mane = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.32, 0.32), horseRed);
    mane.position.set(0.42, 0.86, 0); horse.add(mane);
    // Pegs from rockers up to body
    const pegG = new THREE.BoxGeometry(0.06, 0.46, 0.06);
    for (const [dx, dz] of [[-0.40,-0.32],[0.40,-0.32],[-0.40,0.32],[0.40,0.32]]) {
      const peg = new THREE.Mesh(pegG, horseRed);
      peg.position.set(dx, 0.36, dz);
      horse.add(peg);
    }
    // Place near the centre, off the spawn cell
    horse.position.set(6, 0, -4);
    horse.rotation.y = -Math.PI / 5;
    levelGroup.add(horse);
    wallBoxes.push({ x: 6, z: -4, halfX: 0.7, halfZ: 0.5 });
  }
}

export const FLOOR = {
  name: '幼儿园',
  buildLayout: buildClassrooms,
  spawnProps,
  wallRGB:  [245, 200, 205],
  floorRGB: [200, 160, 180],
  ceilRGB:  [255, 240, 220],
  ambient:  0xa07880,
  lightHex: 0xffd0d0,
  fogHex:   0x402030,
  fogNear:  3,
  fogFar:   20,
  hasCeiling: true,
  props: 'toys',
};
