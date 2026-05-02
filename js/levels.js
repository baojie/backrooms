// Floor / Level definitions and grid constants.
// Pure data — no side effects.

export const CELL = 4;
export const GRID = 27;
export const WALL_HEIGHT = 3.0;
export const TEAM_SIZE = 100;

export const LEVELS = [
  { name:'黄色房间',   wallRGB:[212,187,96],  floorRGB:[110,70,35],  ceilRGB:[180,170,140],
    ambient:0x665533, lightHex:0xfff0b8, fogHex:0x1a1505, fogNear:4,  fogFar:28, hasCeiling:true },
  { name:'车库',       wallRGB:[120,120,124], floorRGB:[70,70,72],   ceilRGB:[90,90,92],
    ambient:0x484850, lightHex:0xc4c8b0, fogHex:0x202024, fogNear:3,  fogFar:24, hasCeiling:true, props:'cars' },
  { name:'发电厂',     wallRGB:[80,80,86],    floorRGB:[60,55,50],   ceilRGB:[55,55,60],
    ambient:0x303040, lightHex:0xb0d8ff, fogHex:0x10141c, fogNear:2,  fogFar:22, hasCeiling:true, props:'sparks' },
  { name:'游泳池',     wallRGB:[200,220,235], floorRGB:[100,180,220], ceilRGB:[230,235,245],
    ambient:0x6088a0, lightHex:0xeaffff, fogHex:0xa6d8e8, fogNear:6,  fogFar:32, hasCeiling:true, props:'water' },
  { name:'农场',       wallRGB:[140,108,70],  floorRGB:[80,140,60],   ceilRGB:[120,170,220],
    ambient:0x88aacc, lightHex:0xffeec4, fogHex:0xb6cde0, fogNear:8,  fogFar:40, hasCeiling:false, props:'crops' },
  { name:'幼儿园',     wallRGB:[245,200,205], floorRGB:[200,160,180], ceilRGB:[255,240,220],
    ambient:0xa07880, lightHex:0xffd0d0, fogHex:0x402030, fogNear:3,  fogFar:20, hasCeiling:true, props:'toys' },
  { name:'办公室',     wallRGB:[210,200,180], floorRGB:[80,90,100],   ceilRGB:[230,230,225],
    ambient:0x707070, lightHex:0xffffff, fogHex:0x303030, fogNear:4,  fogFar:26, hasCeiling:true, props:'cubicles' },
  { name:'图书馆',     wallRGB:[120,80,40],   floorRGB:[60,40,25],    ceilRGB:[80,55,35],
    ambient:0x3a2a18, lightHex:0xffd080, fogHex:0x1c1208, fogNear:3,  fogFar:22, hasCeiling:true, props:'shelves' },
  { name:'地铁站',     wallRGB:[90,90,95],    floorRGB:[40,40,45],    ceilRGB:[60,60,65],
    ambient:0x303038, lightHex:0xffe080, fogHex:0x101014, fogNear:2,  fogFar:18, hasCeiling:true, props:'rails' },
  { name:'终焉',       wallRGB:[10,10,10],    floorRGB:[10,10,12],    ceilRGB:[10,10,10],
    ambient:0x000000, lightHex:0xffffff, fogHex:0x000000, fogNear:1,  fogFar:14, hasCeiling:false, props:'void' },
];

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
