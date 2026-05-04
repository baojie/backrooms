// Floor 3 — 发电厂 (powerplant): dim machine rooms with crackling blue sparks.

import { buildIndustrial } from './_layouts.js';

export function spawnProps(ctx) {
  const { THREE, levelGroup, GRID, CELL, pick } = ctx;
  for (const [cx, cz] of pick(6)) {
    const wx = (cx-GRID/2)*CELL, wz = (cz-GRID/2)*CELL;
    const machine = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 1.6, 0.8),
      new THREE.MeshLambertMaterial({ color: 0x444444 })
    );
    machine.position.set(wx, 0.8, wz);
    levelGroup.add(machine);
    const spark = new THREE.PointLight(0xaaffff, 0.8, 3, 2);
    spark.position.set(wx, 1.6, wz);
    levelGroup.add(spark);
    lights.push({ light: spark, panel: null, base: 0.8, seed: Math.random()*100, broken: false });
  }
  return;}

export const FLOOR = {
  name: '发电厂',
  buildLayout: buildIndustrial,
  spawnProps,
  wallRGB:  [80, 80, 86],
  floorRGB: [60, 55, 50],
  ceilRGB:  [55, 55, 60],
  ambient:  0x303040,
  lightHex: 0xb0d8ff,
  fogHex:   0x10141c,
  fogNear:  2,
  fogFar:   22,
  hasCeiling: true,
  props: 'sparks',
};
