// Floating name-tag sprite that hovers above a character's head.

import * as THREE from 'three';

export function makeNameTag(name, color = 0xffffff) {
  const cv = document.createElement('canvas');
  cv.width = 256; cv.height = 80;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(0, 0, 256, 80);
  ctx.strokeStyle = '#' + ((color & 0xffffff) | 0).toString(16).padStart(6, '0');
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, 252, 76);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 44px "Microsoft YaHei", "PingFang SC", sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(name, 128, 42);
  const tex = new THREE.CanvasTexture(cv);
  tex.minFilter = THREE.LinearFilter;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false }));
  sprite.scale.set(0.7, 0.22, 1);
  sprite.position.y = 2.05;
  sprite.renderOrder = 999;
  return sprite;
}
