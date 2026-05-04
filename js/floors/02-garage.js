// Floor 2 — 车库 (garage): one open hall with parked cars and concrete pillars.

import { buildParking } from './_layouts.js';

export const FLOOR = {
  name: '车库',
  buildLayout: buildParking,
  wallRGB:  [120, 120, 124],
  floorRGB: [ 70,  70,  72],
  ceilRGB:  [ 90,  90,  92],
  ambient:  0x484850,
  lightHex: 0xc4c8b0,
  fogHex:   0x202024,
  fogNear:  3,
  fogFar:   24,
  hasCeiling: true,
  props: 'cars',
};
