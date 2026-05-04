// Floor 4 — 游泳池 (sunken pool): white-tile deck around a single big rectangular
// pool. Fluorescent ceiling grid, metal handrails, electric cables and toxic
// patches lurking in the water, with rowboats moored at the edges.

import { buildOpen } from './_layouts.js';

export const FLOOR = {
  name: '游泳池',
  buildLayout: buildOpen,
  wallRGB:  [238, 238, 238],
  floorRGB: [232, 232, 230],
  ceilRGB:  [240, 238, 232],
  ambient:  0xb8b8b8,
  lightHex: 0xfff8e8,
  fogHex:   0xd6d6d4,
  fogNear:  10,
  fogFar:   38,
  hasCeiling: true,
  props: 'water',
};
