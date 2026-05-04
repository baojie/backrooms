// Floor 5 — 农场 (farm): open sky, wheat fields, pastoral but uncanny.

import { buildOpen } from './_layouts.js';

export function spawnProps(ctx) {
  const { THREE, levelGroup, GRID, CELL, pick } = ctx;
  const cropMat = new THREE.MeshLambertMaterial({ color: 0xc8a440 });
  for (const [cx, cz] of pick(40)) {
    const wx = (cx-GRID/2)*CELL + (Math.random()-0.5)*2;
    const wz = (cz-GRID/2)*CELL + (Math.random()-0.5)*2;
    const stalk = new THREE.Mesh(new THREE.ConeGeometry(0.15, 1.2, 5), cropMat);
    stalk.position.set(wx, 0.6, wz);
    levelGroup.add(stalk);
  }}

export const FLOOR = {
  name: '农场',
  buildLayout: buildOpen,
  spawnProps,
  wallRGB:  [140, 108,  70],
  floorRGB: [ 80, 140,  60],
  ceilRGB:  [120, 170, 220],
  ambient:  0x88aacc,
  lightHex: 0xffeec4,
  fogHex:   0xb6cde0,
  fogNear:  8,
  fogFar:   40,
  hasCeiling: false,
  props: 'crops',
};
