// Floor 7 — 办公室 (office): inspired by Backrooms canon Level 4
// ("Abandoned Office") — desks with chunky beige CRT monitors, swivel
// chairs, filing cabinets, dead potted plants, stacked papers. Soft
// fluorescent hum, beige walls, tan carpet.

import { buildCubicles } from './_layouts.js';

export function spawnProps(ctx) {
  const { THREE, levelGroup, GRID, CELL, pick, wallBoxes } = ctx;
  const woodMat   = new THREE.MeshLambertMaterial({ color: 0x886655 });
  const wood2Mat  = new THREE.MeshLambertMaterial({ color: 0x6a4a36 });
  const beigeMat  = new THREE.MeshLambertMaterial({ color: 0xd9cdb0 });
  const beigeDk   = new THREE.MeshLambertMaterial({ color: 0xb09c78 });
  const screenOff = new THREE.MeshBasicMaterial({ color: 0x101418 });
  const screenOn  = new THREE.MeshBasicMaterial({ color: 0x0a4a3a });    // dim phosphor
  const cabinetMat = new THREE.MeshLambertMaterial({ color: 0x8a8478 });
  const drawerMat  = new THREE.MeshLambertMaterial({ color: 0x6e6a60 });
  const chairBase = new THREE.MeshLambertMaterial({ color: 0x222226 });
  const chairFab  = new THREE.MeshLambertMaterial({ color: 0x303040 });
  const paperMat  = new THREE.MeshBasicMaterial({ color: 0xeae5d2 });
  const potMat    = new THREE.MeshLambertMaterial({ color: 0x7a4a2a });
  const leafMat   = new THREE.MeshLambertMaterial({ color: 0x4a5a32 });

  // ---- Desk + chunky CRT + keyboard + paper stack ----
  function buildDesk() {
    const g = new THREE.Group();
    // Desktop
    const top = new THREE.Mesh(new THREE.BoxGeometry(1.50, 0.04, 0.70), woodMat);
    top.position.y = 0.72; g.add(top);
    // Side panels (instead of legs — gives that real cubicle desk look)
    const sideG = new THREE.BoxGeometry(0.04, 0.72, 0.66);
    for (const dx of [-0.73, 0.73]) {
      const s = new THREE.Mesh(sideG, wood2Mat);
      s.position.set(dx, 0.36, 0); g.add(s);
    }
    // Rear modesty panel
    const back = new THREE.Mesh(new THREE.BoxGeometry(1.46, 0.40, 0.04), wood2Mat);
    back.position.set(0, 0.50, -0.33); g.add(back);
    // CRT monitor (chunky body + flat front face)
    const crtBody = new THREE.Mesh(new THREE.BoxGeometry(0.50, 0.40, 0.45), beigeMat);
    crtBody.position.set(-0.20, 0.95, -0.10); g.add(crtBody);
    // Slightly tapered back hump
    const crtBack = new THREE.Mesh(new THREE.BoxGeometry(0.40, 0.32, 0.10), beigeMat);
    crtBack.position.set(-0.20, 0.95, -0.37); g.add(crtBack);
    // Screen (slightly inset)
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.28),
      Math.random() < 0.4 ? screenOn : screenOff);
    screen.position.set(-0.20, 0.97, 0.131); g.add(screen);
    // Keyboard
    const kb = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.025, 0.16), beigeDk);
    kb.position.set(0.18, 0.74, 0.10); g.add(kb);
    // Paper stack (sometimes)
    if (Math.random() < 0.6) {
      const ps = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.04, 0.26), paperMat);
      ps.position.set(0.45, 0.74, -0.10); g.add(ps);
    }
    return g;
  }

  // ---- Office swivel chair: caster base + seat + backrest ----
  function buildChair() {
    const g = new THREE.Group();
    // Star caster base
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.30, 0.36, 0.04, 12), chairBase);
    base.position.y = 0.04; g.add(base);
    // Single column
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.40, 8), chairBase);
    col.position.y = 0.26; g.add(col);
    // Seat
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.10, 0.46), chairFab);
    seat.position.y = 0.52; g.add(seat);
    // Backrest
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.50, 0.08), chairFab);
    back.position.set(0, 0.78, -0.20); g.add(back);
    return g;
  }

  // ---- Filing cabinet: tall metal box with 3 drawer faces ----
  function buildFilingCabinet() {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.50, 1.30, 0.55), cabinetMat);
    body.position.y = 0.65; g.add(body);
    // Drawer faces
    for (let i = 0; i < 3; i++) {
      const yC = 0.30 + i * 0.40;
      const dr = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.36, 0.02), drawerMat);
      dr.position.set(0, yC, 0.27); g.add(dr);
      // Pull handle
      const handle = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.025, 0.03),
        new THREE.MeshLambertMaterial({ color: 0xcfcdc0 }));
      handle.position.set(0, yC, 0.29); g.add(handle);
    }
    return g;
  }

  // ---- Dead potted plant: pot + drooping conical bush ----
  function buildDeadPlant() {
    const g = new THREE.Group();
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.14, 0.22, 12), potMat);
    pot.position.y = 0.11; g.add(pot);
    // 4 droopy leaf cones
    const leafG = new THREE.ConeGeometry(0.05, 0.40, 5);
    for (let i = 0; i < 5; i++) {
      const ang = (i / 5) * Math.PI * 2 + Math.random() * 0.4;
      const tilt = 0.3 + Math.random() * 0.4;
      const l = new THREE.Mesh(leafG, leafMat);
      l.position.set(Math.cos(ang) * 0.05, 0.30, Math.sin(ang) * 0.05);
      l.rotation.set(Math.cos(ang) * tilt, ang, Math.sin(ang) * tilt);
      g.add(l);
    }
    return g;
  }

  // Place desk/chair pairs
  for (const [cx, cz] of pick(16)) {
    const wx = (cx-GRID/2)*CELL, wz = (cz-GRID/2)*CELL;
    const yaw = Math.random() < 0.5 ? 0 : Math.PI / 2;
    const desk = buildDesk();
    desk.position.set(wx, 0, wz);
    desk.rotation.y = yaw;
    levelGroup.add(desk);
    wallBoxes.push({ x: wx, z: wz, halfX: 0.78, halfZ: 0.40 });
    const chair = buildChair();
    // Place chair in front of desk (along its +Z when yaw=0)
    const ox = Math.sin(yaw) * 0.85, oz = Math.cos(yaw) * 0.85;
    chair.position.set(wx + ox, 0, wz + oz);
    chair.rotation.y = yaw + Math.PI + (Math.random()-0.5) * 1.0;
    levelGroup.add(chair);
  }

  // Filing cabinets along available cells
  for (const [cx, cz] of pick(8)) {
    const wx = (cx-GRID/2)*CELL, wz = (cz-GRID/2)*CELL;
    const fc = buildFilingCabinet();
    fc.position.set(wx, 0, wz);
    fc.rotation.y = Math.random() * Math.PI * 2;
    levelGroup.add(fc);
    wallBoxes.push({ x: wx, z: wz, halfX: 0.30, halfZ: 0.30 });
  }

  // Dead plants (low count, signature touch)
  for (const [cx, cz] of pick(5)) {
    const wx = (cx-GRID/2)*CELL, wz = (cz-GRID/2)*CELL;
    const pl = buildDeadPlant();
    pl.position.set(wx + (Math.random()-0.5)*1.2, 0, wz + (Math.random()-0.5)*1.2);
    levelGroup.add(pl);
  }

  // Stray paper sheets on the floor (small white squares)
  for (let i = 0; i < 30; i++) {
    const half = (GRID/2) * CELL - 2;
    const wx = (Math.random() - 0.5) * 2 * half;
    const wz = (Math.random() - 0.5) * 2 * half;
    const sheet = new THREE.Mesh(new THREE.PlaneGeometry(0.21, 0.30), paperMat);
    sheet.rotation.x = -Math.PI / 2;
    sheet.rotation.z = Math.random() * Math.PI;
    sheet.position.set(wx, 0.012, wz);
    levelGroup.add(sheet);
  }
}


export const FLOOR = {
  name: '办公室',
  buildLayout: buildCubicles,
  spawnProps,
  wallRGB:  [210, 200, 180],
  floorRGB: [ 80,  90, 100],
  ceilRGB:  [230, 230, 225],
  ambient:  0x707070,
  lightHex: 0xffffff,
  fogHex:   0x303030,
  fogNear:  4,
  fogFar:   26,
  hasCeiling: true,
  props: 'cubicles',
};
