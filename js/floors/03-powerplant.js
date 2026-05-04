// Floor 3 — 发电厂 (powerplant): dim machine rooms with crackling blue sparks.

import { buildIndustrial } from './_layouts.js';

export const FLOOR = {
  name: '发电厂',
  buildLayout: buildIndustrial,
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
