// Floor 6 — 幼儿园 (kindergarten): pink rooms with scattered toys.

import { buildClassrooms } from './_layouts.js';

export const FLOOR = {
  name: '幼儿园',
  buildLayout: buildClassrooms,
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
