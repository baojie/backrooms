// Floor 1 — 黄色房间 (yellow rooms): the canonical Backrooms first level.
// Mouldy yellow wallpaper, damp carpet, buzzing fluorescents, classic maze.

import { buildMaze } from './_layouts.js';

export const FLOOR = {
  name: '黄色房间',
  buildLayout: buildMaze,
  wallRGB:  [212, 187, 96],
  floorRGB: [110,  70, 35],
  ceilRGB:  [180, 170, 140],
  ambient:  0x665533,
  lightHex: 0xfff0b8,
  fogHex:   0x1a1505,
  fogNear:  4,
  fogFar:   28,
  hasCeiling: true,
};
