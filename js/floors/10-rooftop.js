// Floor 10 — 顶楼 (rooftop): pure black void with white pillars; the goal.

import { buildOpen } from './_layouts.js';

export function spawnProps(ctx) {
  const { THREE, levelGroup, GRID, CELL, WALL_HEIGHT, pick } = ctx;
  for (const [cx, cz] of pick(6)) {
    const wx = (cx-GRID/2)*CELL, wz = (cz-GRID/2)*CELL;
    const pillar = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, WALL_HEIGHT*1.5, 0.4),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    pillar.position.set(wx, WALL_HEIGHT*0.75, wz);
    levelGroup.add(pillar);
    const pl = new THREE.PointLight(0xffffff, 0.6, 6, 2);
    pl.position.set(wx, WALL_HEIGHT, wz);
    levelGroup.add(pl);
  }}

export const FLOOR = {
  name: '顶楼',
  buildLayout: buildOpen,
  spawnProps,
  wallRGB:  [10, 10, 10],
  floorRGB: [10, 10, 12],
  ceilRGB:  [10, 10, 10],
  ambient:  0x000000,
  lightHex: 0xffffff,
  fogHex:   0x000000,
  fogNear:  1,
  fogFar:   14,
  hasCeiling: false,
  props: 'void',
};
