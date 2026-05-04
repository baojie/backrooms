// Floor 1 — 黄色房间 (yellow rooms): the canonical Backrooms first level.
// Mouldy yellow wallpaper, damp carpet, buzzing fluorescents, classic maze.

import { buildMaze } from './_layouts.js';

export const FLOOR = {
  name: '黄色房间',
  buildLayout: buildMaze,
  // `style: 'lobby'` opts buildLevel into the Backrooms-canonical texture
  // pack: vertical-seam wallpaper + drop-ceiling tiles + mottled carpet,
  // and the wider 1.2×0.6m fluorescent panel.
  style:    'lobby',
  wallRGB:  [206, 178,  92],     // mustard yellow, slightly desaturated
  floorRGB: [148, 110,  56],     // damp khaki carpet (lighter than before)
  ceilRGB:  [222, 212, 188],     // off-cream tiles
  ambient:  0x6a5a2e,            // warm yellow ambient lift
  lightHex: 0xfff4c8,            // creamy fluorescent
  fogHex:   0x2c2410,             // warm yellow haze (was near-black)
  fogNear:  3,
  fogFar:   24,
  hasCeiling: true,
};
