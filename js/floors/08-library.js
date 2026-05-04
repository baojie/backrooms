// Floor 8 — 图书馆 (library): towering oak bookshelves with multicoloured
// book spines, reading desks topped with green banker's lamps, a card-
// catalog cabinet, and stacks of fallen books — warm yellow lighting on
// dark wood floors.

import { buildShelves } from './_layouts.js';

export function spawnProps(ctx) {
  const { THREE, levelGroup, GRID, CELL, pick, wallBoxes } = ctx;
  const woodDk    = new THREE.MeshLambertMaterial({ color: 0x4a2810 });
  const woodMd    = new THREE.MeshLambertMaterial({ color: 0x6a3a18 });
  const brassMat  = new THREE.MeshLambertMaterial({ color: 0xc8a050 });
  const greenLamp = new THREE.MeshBasicMaterial({ color: 0x2a5a2a });
  const lampGlow  = new THREE.MeshBasicMaterial({ color: 0xfff0a0 });
  const bookPalette = [
    0x6a1818, 0x804018, 0x305030, 0x183860, 0x5a2868, 0x803830,
    0x988044, 0x2a4858, 0x603040, 0x4a4030,
  ];

  // ---- Shelf with visible book spines ----
  function buildBookshelf() {
    const g = new THREE.Group();
    // Frame
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.50, 2.40, 1.60), woodDk);
    frame.position.y = 1.20; g.add(frame);
    // Top + bottom + side panels (slightly lighter to show edges)
    const sideG = new THREE.BoxGeometry(0.04, 2.40, 1.62);
    for (const dx of [-0.255, 0.255]) {
      const s = new THREE.Mesh(sideG, woodMd);
      s.position.set(dx, 1.20, 0); g.add(s);
    }
    // Inner shelf planks (4 levels)
    for (let i = 0; i < 4; i++) {
      const y = 0.30 + i * 0.55;
      const plank = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.04, 1.55), woodMd);
      plank.position.set(0, y, 0);
      g.add(plank);
    }
    // Books: rows of small colored slabs on each shelf, two faces (front+back)
    for (let i = 0; i < 4; i++) {
      const yMid = 0.30 + i * 0.55 + 0.21;
      for (const faceX of [-0.205, 0.205]) {
        // Pack books along the long Z axis
        let z = -0.74;
        while (z < 0.74) {
          const w = 0.045 + Math.random() * 0.055;     // book thickness (along Z)
          if (z + w > 0.78) break;
          // Random book height
          const h = 0.30 + Math.random() * 0.10;
          const col = bookPalette[Math.floor(Math.random()*bookPalette.length)];
          const book = new THREE.Mesh(new THREE.BoxGeometry(0.06, h, w),
            new THREE.MeshLambertMaterial({ color: col }));
          book.position.set(faceX, 0.30 + i * 0.55 + h/2, z + w/2);
          g.add(book);
          z += w + 0.005;
          // Random gap
          if (Math.random() < 0.10) z += 0.04 + Math.random() * 0.06;
        }
      }
    }
    return g;
  }
  for (const [cx, cz] of pick(14)) {
    const wx = (cx-GRID/2)*CELL, wz = (cz-GRID/2)*CELL;
    const sh = buildBookshelf();
    sh.position.set(wx, 0, wz);
    sh.rotation.y = Math.random() < 0.5 ? 0 : Math.PI / 2;
    levelGroup.add(sh);
    wallBoxes.push({ x: wx, z: wz, halfX: 0.30, halfZ: 0.85 });
  }

  // ---- Reading desk with green banker's lamp ----
  function buildReadingDesk() {
    const g = new THREE.Group();
    // Top
    const top = new THREE.Mesh(new THREE.BoxGeometry(1.40, 0.05, 0.70), woodDk);
    top.position.y = 0.78; g.add(top);
    // Legs
    const legG = new THREE.BoxGeometry(0.06, 0.78, 0.06);
    for (const [dx, dz] of [[-0.66,-0.32],[0.66,-0.32],[-0.66,0.32],[0.66,0.32]]) {
      const l = new THREE.Mesh(legG, woodDk);
      l.position.set(dx, 0.39, dz); g.add(l);
    }
    // Banker's lamp: brass column + green dome shade
    const lampStem = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.30, 8), brassMat);
    lampStem.position.set(-0.45, 0.95, 0); g.add(lampStem);
    const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.03, 12), brassMat);
    lampBase.position.set(-0.45, 0.81, 0); g.add(lampBase);
    const shade = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.10, 0.16), greenLamp);
    shade.position.set(-0.45, 1.10, 0); g.add(shade);
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.14), lampGlow);
    glow.rotation.x = Math.PI / 2;
    glow.position.set(-0.45, 1.045, 0); g.add(glow);
    // Open book on the desk
    const bookCover = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.02, 0.22),
      new THREE.MeshLambertMaterial({ color: 0x6a1818 }));
    bookCover.position.set(0.20, 0.81, 0); g.add(bookCover);
    const pages = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.018, 0.20),
      new THREE.MeshBasicMaterial({ color: 0xeae5d2 }));
    pages.position.set(0.20, 0.825, 0); g.add(pages);
    // Centre crease line
    const crease = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.020, 0.20),
      new THREE.MeshBasicMaterial({ color: 0xa49885 }));
    crease.position.set(0.20, 0.834, 0); g.add(crease);
    return g;
  }
  for (const [cx, cz] of pick(5)) {
    const wx = (cx-GRID/2)*CELL, wz = (cz-GRID/2)*CELL;
    const desk = buildReadingDesk();
    desk.position.set(wx, 0, wz);
    desk.rotation.y = Math.random() * Math.PI * 2;
    levelGroup.add(desk);
    wallBoxes.push({ x: wx, z: wz, halfX: 0.72, halfZ: 0.40 });
    // A small point light from the lamp
    const light = new THREE.PointLight(0xffe480, 0.6, 5, 1.6);
    light.position.set(wx, 1.10, wz);
    levelGroup.add(light);
  }

  // ---- Card-catalog cabinet: small drawer grid (one per level) ----
  function buildCardCatalog() {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.00, 1.30, 0.50), woodDk);
    body.position.y = 0.65; g.add(body);
    // 4×6 grid of tiny drawer faces with brass pulls
    const drGeom = new THREE.BoxGeometry(0.20, 0.18, 0.02);
    const pullGeom = new THREE.BoxGeometry(0.04, 0.012, 0.02);
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 4; col++) {
        const x = -0.36 + col * 0.24;
        const y = 0.16 + row * 0.20;
        const dr = new THREE.Mesh(drGeom, woodMd);
        dr.position.set(x, y, 0.255); g.add(dr);
        const pull = new THREE.Mesh(pullGeom, brassMat);
        pull.position.set(x, y, 0.275); g.add(pull);
      }
    }
    return g;
  }
  for (const [cx, cz] of pick(2)) {
    const wx = (cx-GRID/2)*CELL, wz = (cz-GRID/2)*CELL;
    const cc = buildCardCatalog();
    cc.position.set(wx, 0, wz);
    cc.rotation.y = Math.random() * Math.PI * 2;
    levelGroup.add(cc);
    wallBoxes.push({ x: wx, z: wz, halfX: 0.55, halfZ: 0.30 });
  }

  // ---- Fallen book stacks scattered on the floor ----
  for (const [cx, cz] of pick(8)) {
    const wx = (cx-GRID/2)*CELL, wz = (cz-GRID/2)*CELL;
    const stackH = 1 + Math.floor(Math.random() * 4);
    for (let i = 0; i < stackH; i++) {
      const col = bookPalette[Math.floor(Math.random()*bookPalette.length)];
      const book = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.04, 0.24),
        new THREE.MeshLambertMaterial({ color: col }));
      book.position.set(wx + (Math.random()-0.5)*0.10, 0.02 + i * 0.045,
                        wz + (Math.random()-0.5)*0.10);
      book.rotation.y = Math.random() * Math.PI;
      levelGroup.add(book);
    }
  }
}

export const FLOOR = {
  name: '图书馆',
  buildLayout: buildShelves,
  spawnProps,
  wallRGB:  [120,  80,  40],
  floorRGB: [ 60,  40,  25],
  ceilRGB:  [ 80,  55,  35],
  ambient:  0x3a2a18,
  lightHex: 0xffd080,
  fogHex:   0x1c1208,
  fogNear:  3,
  fogFar:   22,
  hasCeiling: true,
  props: 'shelves',
};
