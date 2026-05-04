// Floor 5 — 农场 (farm): open sky, wheat fields, pastoral but uncanny.

import { buildOpen } from './_layouts.js';

export const FLOOR = {
  name: '农场',
  buildLayout: buildOpen,
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
