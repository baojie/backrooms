// Floor 8 — 图书馆 (library): brown bookshelf rows on warm wood.

import { buildShelves } from './_layouts.js';

export function spawnProps(ctx) {
  const { THREE, levelGroup, GRID, CELL, pick } = ctx;
  for (const [cx, cz] of pick(12)) {
    const wx = (cx-GRID/2)*CELL, wz = (cz-GRID/2)*CELL;
    const shelf = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 2.4, 1.6),
      new THREE.MeshLambertMaterial({ color: 0x552d10 })
    );
    shelf.position.set(wx, 1.2, wz);
    shelf.rotation.y = Math.random() < 0.5 ? 0 : Math.PI/2;
    levelGroup.add(shelf);
  }
  return;}

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
