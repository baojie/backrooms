// Floor 9 — 地铁站 (subway): two long platform walls flanking the track.

import { buildPlatforms } from './_layouts.js';

export const FLOOR = {
  name: '地铁站',
  buildLayout: buildPlatforms,
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
