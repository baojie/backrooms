// Generate the companion roster: 10 girls with golden-angle palette
// distribution so every dress / hair / skin combo is visually distinct.
//
// `buildCompanionRoster(TEAM_SIZE, GIRL_NAMES)` returns an array of
// stateful companion objects. Each entry holds:
//   - name:       drawn from GIRL_NAMES (cycles + appends suffix once
//                 we exhaust the pool)
//   - dressColor / hairColor / skinColor / accentColor:
//                 golden-angle hue rotation (i * 0.137) so adjacent
//                 indices sit ~50° apart in hue space; hair stays in a
//                 narrow brown band; skin in a narrow warm band; accent
//                 (bow / pony tie) sits opposite the dress on the wheel.
//   - mesh:       null until level builder calls buildCompanionMesh()
//   - hp:         1.0 (relative scale; companion damage is dt * 0.x)
//   - alive:      true
//   - talking:    set by tts.js when this companion is currently speaking
//   - walkPhase / angle / radius / bobSeed:
//                 formation parameters; angle/radius give concentric
//                 rings around the player so a 10-girl crowd doesn't
//                 stack up
//   - hasKnife:   ~40% probability (random per session)
//   - attackCooldown / swingPhase:
//                 knife AI bookkeeping (see js/companion_ai.js)

import * as THREE from 'three';

function hsl(h, s, l) { return new THREE.Color().setHSL(h, s, l).getHex(); }

export function pickCompanionName(i, GIRL_NAMES) {
  return GIRL_NAMES[i % GIRL_NAMES.length] +
         (i >= GIRL_NAMES.length ? String(Math.floor(i / GIRL_NAMES.length) + 1) : '');
}

export function buildCompanionRoster(TEAM_SIZE, GIRL_NAMES) {
  return Array.from({ length: TEAM_SIZE }, (_, i) => {
    const hueDress = (i * 0.137) % 1;            // golden-angle hue spread
    const hueHair  = 0.06 + (i * 0.073) % 0.05;  // mostly black/brown
    const hueSkin  = 0.07 + (i * 0.011) % 0.03;
    return {
      name: pickCompanionName(i, GIRL_NAMES),
      dressColor: hsl(hueDress, 0.55, 0.55),
      hairColor:  hsl(hueHair, 0.4, 0.10 + ((i*7)%10)*0.015),
      skinColor:  hsl(hueSkin, 0.45, 0.78 + ((i*3)%5)*0.01),
      accentColor: hsl((hueDress + 0.5) % 1, 0.7, 0.62),
      mesh: null,
      hp: 1.0,
      alive: true,
      talking: false,
      walkPhase: Math.random() * Math.PI * 2,
      angle: (i / TEAM_SIZE) * Math.PI * 2 + Math.random()*0.2,
      radius: 1.6 + (i % 8) * 0.55,    // concentric rings
      bobSeed: Math.random() * Math.PI * 2,
      // ~40% of companions carry a knife — they kill monsters but never the player.
      hasKnife: Math.random() < 0.40,
      attackCooldown: 0,
      swingPhase: 0,
    };
  });
}
