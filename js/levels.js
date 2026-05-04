// Floor / Level definitions and grid constants.
// Per-floor data lives under `js/floors/` (one file per floor); each exports
// a `FLOOR` object. This module assembles them into the in-game `LEVELS`
// array and exposes the shared grid constants and companion-name pool.

import { FLOOR as floor01 } from './floors/01-yellow.js';
import { FLOOR as floor02 } from './floors/02-garage.js';
import { FLOOR as floor03 } from './floors/03-powerplant.js';
import { FLOOR as floor04 } from './floors/04-pool.js';
import { FLOOR as floor05 } from './floors/05-farm.js';
import { FLOOR as floor06 } from './floors/06-kindergarten.js';
import { FLOOR as floor07 } from './floors/07-office.js';
import { FLOOR as floor08 } from './floors/08-library.js';
import { FLOOR as floor09 } from './floors/09-subway.js';
import { FLOOR as floor10 } from './floors/10-rooftop.js';

export const LEVELS = [
  floor01, floor02, floor03, floor04, floor05,
  floor06, floor07, floor08, floor09, floor10,
];

export const CELL = 4;
export const GRID = 27;
export const WALL_HEIGHT = 3.0;
export const TEAM_SIZE = 10;

export const GIRL_NAMES = [
  '小美','小雅','小静','小婷','小敏','小芳','小蕾','小晴','小琳','小洁',
  '小妍','小薇','小欣','小怡','小娜','小柔','小慧','小颖','小燕','小媛',
  '小雪','小月','小星','小霞','小云','小梦','小蓝','小紫','小红','小绿',
  '小桃','小樱','小莉','小荷','小兰','小菊','小梅','小竹','小桐','小棠',
  '小诗','小雨','小风','小语','小笑','小歌','小舞','小琴','小棋','小书',
  '小茜','小璐','小瑶','小婕','小彤','小宁','小璇','小娴','小蓓','小娇',
  '小盈','小妮','小娟','小淑','小馨','小琪','小芸','小柳','小杏','小桦',
  '小素','小净','小恬','小怜','小翠','小玲','小依','小可','小宛','小冉',
  '小灵','小忆','小蔓','小淼','小漫','小漪','小波','小晗','小晨','小昕',
  '小烁','小妙','小巧','小若','小忻','小绮','小悦','小翘','小麦','小糖',
];
