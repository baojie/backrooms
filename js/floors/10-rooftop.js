// Floor 10 — 顶楼 (rooftop): pure black void with white pillars; the goal.

import { buildOpen } from './_layouts.js';

export const FLOOR = {
  name: '顶楼',
  buildLayout: buildOpen,
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
