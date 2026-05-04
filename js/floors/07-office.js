// Floor 7 — 办公室 (office): beige cubicles + glowing CRT monitors.

import { buildCubicles } from './_layouts.js';

export function spawnProps(ctx) {
  const { THREE, levelGroup, GRID, CELL, pick } = ctx;
  for (const [cx, cz] of pick(14)) {
    const wx = (cx-GRID/2)*CELL, wz = (cz-GRID/2)*CELL;
    const desk = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 0.7, 0.7),
      new THREE.MeshLambertMaterial({ color: 0x886655 })
    );
    desk.position.set(wx, 0.35, wz);
    levelGroup.add(desk);
    const monitor = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.4, 0.05),
      new THREE.MeshBasicMaterial({ color: 0x223355 })
    );
    monitor.position.set(wx, 0.95, wz);
    levelGroup.add(monitor);
  }
  return;}

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
