// Floor 8 — 图书馆 (library): brown bookshelf rows on warm wood.

import { buildShelves } from './_layouts.js';

export const FLOOR = {
  name: '图书馆',
  buildLayout: buildShelves,
  wallRGB:  [120,  80,  40],
  floorRGB: [ 60,  40,  25],
  ceilRGB:  [ 80,  55,  35],
  ambient:  0x3a2a18,
  lightHex: 0xffd080,
  fogHex:   0x1c1208,
  fogNear:  3,
  fogFar:   22,
  hasCeiling: true,
  props: 'shelves',
};
