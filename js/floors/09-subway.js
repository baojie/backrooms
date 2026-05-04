// Floor 9 — 地铁站 (subway): two long platform walls flanking the track.

import { buildPlatforms } from './_layouts.js';

export function spawnProps(ctx) {
  const { THREE, levelGroup, GRID, CELL } = ctx;
  const railMat = new THREE.MeshBasicMaterial({ color: 0x666666 });
  for (let i = -Math.floor(GRID/2); i < Math.floor(GRID/2); i++) {
    const rail = new THREE.Mesh(
      new THREE.BoxGeometry(GRID*CELL, 0.05, 0.1), railMat
    );
    rail.position.set(0, 0.025, i*CELL*1.5);
    levelGroup.add(rail);
  }
  return;}

export const FLOOR = {
  name: '地铁站',
  buildLayout: buildPlatforms,
  spawnProps,
  wallRGB:  [90, 90, 95],
  floorRGB: [40, 40, 45],
  ceilRGB:  [60, 60, 65],
  ambient:  0x303038,
  lightHex: 0xffe080,
  fogHex:   0x101014,
  fogNear:  2,
  fogFar:   18,
  hasCeiling: true,
  props: 'rails',
};
