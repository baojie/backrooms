// Floor 6 — 幼儿园 (kindergarten): pink rooms with scattered toys.

import { buildClassrooms } from './_layouts.js';

export function spawnProps(ctx) {
  const { THREE, levelGroup, GRID, CELL, pick } = ctx;
  for (const [cx, cz] of pick(10)) {
    const wx = (cx-GRID/2)*CELL, wz = (cz-GRID/2)*CELL;
    const toy = new THREE.Mesh(
      new THREE.BoxGeometry(0.4,0.4,0.4),
      new THREE.MeshLambertMaterial({ color: 0xff80a0 })
    );
    toy.position.set(wx + (Math.random()-0.5), 0.2, wz + (Math.random()-0.5));
    levelGroup.add(toy);
  }
  return;}

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
