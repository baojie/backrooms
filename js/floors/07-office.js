// Floor 7 — 办公室 (office): beige cubicles + glowing CRT monitors.

import { buildCubicles } from './_layouts.js';

export const FLOOR = {
  name: '办公室',
  buildLayout: buildCubicles,
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
