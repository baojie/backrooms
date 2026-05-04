// Held-weapon pivot setup + WEAPONS dispatch table.
//
// `setupWeapons(camera)` builds five `THREE.Group` pivots (one per
// weapon), parents them to the camera, and returns the WEAPONS table
// keyed on `player.weapon`. Each entry holds:
//   - name      — Chinese + English label for the HUD
//   - kind      — 'gun' / 'melee' / 'rocket' / 'spray' (dispatch tag)
//   - pivot     — the Group attached to the camera
//   - held      — the actual weapon mesh inside the pivot
//   - cooldown  — re-fire delay in seconds
//   - auto      — full-auto when LMB held?
//   - per-weapon tuning (recoilKick / soundHi / soundLo / flashScreen /
//     sanityHitCompanion / blastRadius / blastDamage / range / coneCos)
//
// Pistol stays visible at start; the others hide until the player
// switches to them.

import {
  buildKnifeMesh, buildPistolMesh, buildAKMesh,
  buildRocketLauncherMesh, buildSprayCanMesh,
} from './weapons.js';
import * as THREE from 'three';

export function setupWeapons(camera) {
  // Held knife (attached to camera; hidden until picked up)
  const heldKnifePivot = new THREE.Group();
  const heldKnife = buildKnifeMesh();
  heldKnifePivot.add(heldKnife);
  heldKnifePivot.position.set(0.35, -0.30, -0.55);
  heldKnifePivot.rotation.set(-0.2, -0.4, 0.3);
  heldKnifePivot.visible = false;
  camera.add(heldKnifePivot);

  // Held pistol (always visible; unlimited bullets)
  const heldPistolPivot = new THREE.Group();
  const heldPistol = buildPistolMesh();
  heldPistolPivot.add(heldPistol);
  heldPistolPivot.position.set(0.30, -0.28, -0.50);
  heldPistolPivot.rotation.set(0, -0.05, 0);
  camera.add(heldPistolPivot);

  const heldAKPivot = new THREE.Group();
  const heldAK = buildAKMesh();
  heldAKPivot.add(heldAK);
  heldAKPivot.position.set(0.32, -0.32, -0.55);
  heldAKPivot.rotation.set(0, -0.04, 0);
  heldAKPivot.visible = false;
  camera.add(heldAKPivot);

  // Rocket launcher (火箭炮) — fires explosive rockets that destroy walls.
  const heldRocketPivot = new THREE.Group();
  const heldRocket = buildRocketLauncherMesh();
  heldRocketPivot.add(heldRocket);
  heldRocketPivot.position.set(0.30, -0.30, -0.55);
  heldRocketPivot.rotation.set(0, -0.04, 0);
  heldRocketPivot.visible = false;
  camera.add(heldRocketPivot);

  const heldSprayPivot = new THREE.Group();
  const heldSpray = buildSprayCanMesh();
  heldSprayPivot.add(heldSpray);
  heldSprayPivot.position.set(0.28, -0.28, -0.40);
  heldSprayPivot.rotation.set(0, -0.05, 0);
  heldSprayPivot.visible = false;
  camera.add(heldSprayPivot);

  const WEAPONS = {
    pistol: {
      name: '手枪 Pistol',  kind: 'gun',
      pivot: heldPistolPivot, held: heldPistol,
      cooldown: 0.18, auto: false,
      recoilKick: 0.45, soundHi: 900, soundLo: 220,
      flashScreen: 0.12, sanityHitCompanion: 0.10,
    },
    ak47: {
      name: 'AK-47',  kind: 'gun',
      pivot: heldAKPivot, held: heldAK,
      cooldown: 0.085, auto: true,
      recoilKick: 0.30, soundHi: 620, soundLo: 160,
      flashScreen: 0.18, sanityHitCompanion: 0.05,
    },
    knife: {
      name: '匕首 Knife',  kind: 'melee',
      pivot: heldKnifePivot, held: heldKnife,
      cooldown: 0.35, auto: false,
    },
    rocket: {
      name: '火箭炮 Rocket', kind: 'rocket',
      pivot: heldRocketPivot, held: heldRocket,
      cooldown: 1.4, auto: false,
      recoilKick: 1.6, flashScreen: 0.45,
      blastRadius: 5.0, blastDamage: 5.0,
    },
    spray: {
      name: '杀虫剂 Insecticide', kind: 'spray',
      pivot: heldSprayPivot, held: heldSpray,
      cooldown: 0, auto: true,
      range: 4.5, coneCos: 0.78,   // ~38° half-angle cone
    },
  };
  const WEAPON_ORDER = ['pistol', 'ak47', 'knife', 'rocket', 'spray'];

  return { WEAPONS, WEAPON_ORDER, heldKnifePivot };
}
