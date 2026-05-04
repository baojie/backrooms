// Procedural female-companion builders + dispatcher.
//
// Two flavours, both fully procedural so they stay synchronous and cheap:
//   - `buildFemaleCompanion(palette)`   — uses the shared `FG` geometry cache
//     so all 10 girls share buffer geometries.
//   - `buildProceduralCompanion(shirt, pants)` — older, slightly heftier
//     fallback (Soldier-style proportions, separate per-figure geometries).
//
// `buildCompanionMesh()` is the dispatcher used by the level builder: it
// always returns a cheap procedural figure synchronously so level transitions
// don't hitch on 10× SkeletonUtils.clone, then the upgrade scheduler swaps
// in the rich GLTF version once the FBX/GLB has loaded.

import * as THREE from 'three';
import { makeNameTag } from './nametag.js';

// ============================================================
// Shared geometry cache for buildFemaleCompanion — one allocation reused
// across all figures.
// ============================================================
const FG = (() => ({
  skull:    new THREE.SphereGeometry(0.16, 16, 14),
  hairCap:  new THREE.SphereGeometry(0.165, 16, 14, 0, Math.PI*2, 0, Math.PI*0.55),
  hairBack: new THREE.CylinderGeometry(0.16, 0.21, 0.95, 12, 1, true),
  hairFringe: new THREE.BoxGeometry(0.30, 0.06, 0.04),
  bow:      new THREE.TorusGeometry(0.07, 0.022, 6, 10),
  ear:      new THREE.SphereGeometry(0.035, 8, 8),
  neck:     new THREE.CylinderGeometry(0.065, 0.075, 0.10, 10),
  torsoUp:  new THREE.CapsuleGeometry(0.18, 0.32, 4, 10),
  bust:     new THREE.SphereGeometry(0.085, 10, 8),
  hipBlock: new THREE.CylinderGeometry(0.18, 0.16, 0.16, 12),
  skirt:    new THREE.ConeGeometry(0.36, 0.55, 16, 1, true),
  armUpper: new THREE.CapsuleGeometry(0.055, 0.28, 3, 8),
  armFore:  new THREE.CapsuleGeometry(0.05, 0.26, 3, 8),
  hand:     new THREE.SphereGeometry(0.062, 8, 8),
  legUpper: new THREE.CapsuleGeometry(0.075, 0.30, 3, 8),
  legLower: new THREE.CapsuleGeometry(0.062, 0.28, 3, 8),
  shoe:     new THREE.BoxGeometry(0.13, 0.05, 0.22),
  eyeWhite: new THREE.SphereGeometry(0.028, 10, 8),
  pupil:    new THREE.SphereGeometry(0.013, 8, 6),
  brow:     new THREE.BoxGeometry(0.05, 0.010, 0.010),
  nose:     new THREE.ConeGeometry(0.018, 0.05, 4),
  lips:     new THREE.BoxGeometry(0.055, 0.011, 0.010),
  cheek:    new THREE.SphereGeometry(0.024, 8, 6),
}))();

export function buildFemaleCompanion(palette) {
  const g = new THREE.Group();
  const skin    = new THREE.MeshLambertMaterial({ color: palette.skinColor });
  const dressM  = new THREE.MeshLambertMaterial({ color: palette.dressColor });
  const skirtM  = new THREE.MeshLambertMaterial({ color: palette.dressColor, side: THREE.DoubleSide });
  const hairM   = new THREE.MeshLambertMaterial({ color: palette.hairColor });
  const accentM = new THREE.MeshLambertMaterial({ color: palette.accentColor });
  const shoeM   = new THREE.MeshLambertMaterial({ color: 0x202024 });
  const eyeWhiteM = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const pupilM    = new THREE.MeshBasicMaterial({ color: 0x2a1f1a });
  const lipM      = new THREE.MeshBasicMaterial({ color: 0xc44a5a });
  const blushM    = new THREE.MeshBasicMaterial({ color: 0xf2a8b0, transparent: true, opacity: 0.55 });

  const torso = new THREE.Mesh(FG.torsoUp, dressM);
  torso.position.y = 1.30;
  torso.scale.set(1.0, 1.0, 0.85);
  g.add(torso);
  const lBust = new THREE.Mesh(FG.bust, dressM); lBust.position.set(-0.08, 1.34, -0.10);
  const rBust = new THREE.Mesh(FG.bust, dressM); rBust.position.set( 0.08, 1.34, -0.10);
  lBust.scale.set(0.9, 0.7, 0.9); rBust.scale.set(0.9, 0.7, 0.9);
  g.add(lBust); g.add(rBust);
  const hips = new THREE.Mesh(FG.hipBlock, dressM);
  hips.position.y = 0.92;
  g.add(hips);
  const skirt = new THREE.Mesh(FG.skirt, skirtM);
  skirt.position.y = 0.62;
  g.add(skirt);
  const neck = new THREE.Mesh(FG.neck, skin);
  neck.position.y = 1.62;
  g.add(neck);

  const head = new THREE.Group();
  head.position.y = 1.78;
  const skull = new THREE.Mesh(FG.skull, skin);
  skull.scale.set(0.95, 1.05, 0.92);
  head.add(skull);
  const lEar = new THREE.Mesh(FG.ear, skin); lEar.scale.set(0.55, 1.0, 1.0); lEar.position.set(-0.16, 0, 0);
  const rEar = new THREE.Mesh(FG.ear, skin); rEar.scale.set(0.55, 1.0, 1.0); rEar.position.set( 0.16, 0, 0);
  head.add(lEar); head.add(rEar);
  const hairCap = new THREE.Mesh(FG.hairCap, hairM);
  hairCap.position.y = 0.005;
  head.add(hairCap);
  const fringe = new THREE.Mesh(FG.hairFringe, hairM);
  fringe.position.set(0, 0.10, -0.155);
  fringe.rotation.x = -0.15;
  head.add(fringe);
  const hairBack = new THREE.Mesh(FG.hairBack, hairM);
  hairBack.position.set(0, -0.50, 0.04);
  hairBack.scale.set(1.0, 1.0, 0.55);
  head.add(hairBack);
  const bow = new THREE.Mesh(FG.bow, accentM);
  bow.position.set(0.09, 0.15, -0.04);
  bow.rotation.x = Math.PI / 2;
  bow.scale.set(0.9, 0.9, 0.5);
  head.add(bow);
  const lEyeball = new THREE.Group(); lEyeball.position.set(-0.055, 0.015, -0.140);
  const rEyeball = new THREE.Group(); rEyeball.position.set( 0.055, 0.015, -0.140);
  lEyeball.add(new THREE.Mesh(FG.eyeWhite, eyeWhiteM));
  rEyeball.add(new THREE.Mesh(FG.eyeWhite, eyeWhiteM));
  const lP = new THREE.Mesh(FG.pupil, pupilM); lP.position.z = -0.020; lEyeball.add(lP);
  const rP = new THREE.Mesh(FG.pupil, pupilM); rP.position.z = -0.020; rEyeball.add(rP);
  head.add(lEyeball); head.add(rEyeball);
  const lBrow = new THREE.Mesh(FG.brow, hairM); lBrow.position.set(-0.055, 0.062, -0.150);
  const rBrow = new THREE.Mesh(FG.brow, hairM); rBrow.position.set( 0.055, 0.062, -0.150);
  head.add(lBrow); head.add(rBrow);
  const nose = new THREE.Mesh(FG.nose, skin);
  nose.rotation.x = Math.PI / 2;
  nose.position.set(0, -0.005, -0.165);
  head.add(nose);
  const lips = new THREE.Mesh(FG.lips, lipM);
  lips.position.set(0, -0.060, -0.158);
  head.add(lips);
  const lCheek = new THREE.Mesh(FG.cheek, blushM); lCheek.scale.set(1, 0.5, 0.4);
  const rCheek = new THREE.Mesh(FG.cheek, blushM); rCheek.scale.set(1, 0.5, 0.4);
  lCheek.position.set(-0.085, -0.025, -0.140);
  rCheek.position.set( 0.085, -0.025, -0.140);
  head.add(lCheek); head.add(rCheek);
  g.add(head);

  function makeArm(side) {
    const arm = new THREE.Group();
    arm.position.set(side * 0.22, 1.50, 0);
    const upper = new THREE.Mesh(FG.armUpper, dressM);
    upper.position.y = -0.18;
    arm.add(upper);
    const elbow = new THREE.Group(); elbow.position.y = -0.36;
    const fore = new THREE.Mesh(FG.armFore, skin);
    fore.position.y = -0.18;
    elbow.add(fore);
    const hand = new THREE.Mesh(FG.hand, skin);
    hand.position.y = -0.36;
    hand.scale.set(0.85, 0.7, 1.0);
    elbow.add(hand);
    arm.add(elbow);
    g.add(arm);
    return arm;
  }
  const leftArm  = makeArm(-1);
  const rightArm = makeArm(1);

  function makeLeg(side) {
    const leg = new THREE.Group();
    leg.position.set(side * 0.10, 0.82, 0);
    const upper = new THREE.Mesh(FG.legUpper, skin);
    upper.position.y = -0.20;
    leg.add(upper);
    const knee = new THREE.Group(); knee.position.y = -0.40;
    const lower = new THREE.Mesh(FG.legLower, skin);
    lower.position.y = -0.18;
    knee.add(lower);
    const foot = new THREE.Mesh(FG.shoe, shoeM);
    foot.position.set(0, -0.36, 0.05);
    knee.add(foot);
    leg.add(knee);
    g.add(leg);
    return leg;
  }
  const leftLeg  = makeLeg(-1);
  const rightLeg = makeLeg(1);

  g.userData.rig = {
    head, leftArm, rightArm, leftLeg, rightLeg,
    torso, skirt, hairBack, lEyeball, rEyeball, lips,
  };
  return g;
}

export function buildProceduralCompanion(shirtColor, pantsColor) {
  const g = new THREE.Group();
  const skin  = new THREE.MeshLambertMaterial({ color: 0xf2d2a8 });
  const skin2 = new THREE.MeshLambertMaterial({ color: 0xe8c39a });
  const shirt = new THREE.MeshLambertMaterial({ color: shirtColor });
  const pants = new THREE.MeshLambertMaterial({ color: pantsColor });
  const hair  = new THREE.MeshLambertMaterial({ color: 0x1a1208 });
  const shoe  = new THREE.MeshLambertMaterial({ color: 0x111111 });
  const eyeWhite = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const pupil    = new THREE.MeshBasicMaterial({ color: 0x222220 });
  const lipMat   = new THREE.MeshBasicMaterial({ color: 0x9a3a2a });

  const torso = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.24, 0.48, 6, 12), shirt
  );
  torso.position.y = 1.30;
  g.add(torso);
  const hips = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.20, 0.20, 14), pants
  );
  hips.position.y = 0.86;
  g.add(hips);
  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.075, 0.085, 0.12, 12), skin
  );
  neck.position.y = 1.66;
  g.add(neck);

  const head = new THREE.Group();
  head.position.y = 1.78;
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.18, 18, 16), skin);
  skull.scale.set(0.95, 1.05, 0.92);
  head.add(skull);
  const hairCap = new THREE.Mesh(new THREE.SphereGeometry(0.185, 18, 16, 0, Math.PI*2, 0, Math.PI*0.55), hair);
  hairCap.position.y = -0.005;
  hairCap.scale.set(1.0, 1.05, 1.0);
  head.add(hairCap);
  const earG = new THREE.SphereGeometry(0.04, 8, 8);
  const lEar = new THREE.Mesh(earG, skin); lEar.scale.set(0.6, 1.0, 1.0);
  const rEar = new THREE.Mesh(earG, skin); rEar.scale.set(0.6, 1.0, 1.0);
  lEar.position.set(-0.18, 0, 0); rEar.position.set(0.18, 0, 0);
  head.add(lEar); head.add(rEar);
  const eyeWhiteG = new THREE.SphereGeometry(0.035, 12, 10);
  const pupilG    = new THREE.SphereGeometry(0.018, 10, 8);
  const lEyeball = new THREE.Group(); lEyeball.position.set(-0.062, 0.02, -0.155);
  const rEyeball = new THREE.Group(); rEyeball.position.set( 0.062, 0.02, -0.155);
  const lW = new THREE.Mesh(eyeWhiteG, eyeWhite); lEyeball.add(lW);
  const rW = new THREE.Mesh(eyeWhiteG, eyeWhite); rEyeball.add(rW);
  const lP = new THREE.Mesh(pupilG, pupil); lP.position.z = -0.025; lEyeball.add(lP);
  const rP = new THREE.Mesh(pupilG, pupil); rP.position.z = -0.025; rEyeball.add(rP);
  head.add(lEyeball); head.add(rEyeball);
  const browG = new THREE.BoxGeometry(0.06, 0.012, 0.012);
  const lBrow = new THREE.Mesh(browG, hair); lBrow.position.set(-0.062, 0.07, -0.165);
  const rBrow = new THREE.Mesh(browG, hair); rBrow.position.set( 0.062, 0.07, -0.165);
  head.add(lBrow); head.add(rBrow);
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.07, 4), skin);
  nose.rotation.x = Math.PI/2;
  nose.position.set(0, -0.005, -0.18);
  head.add(nose);
  const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.012, 0.01), lipMat);
  mouth.position.set(0, -0.07, -0.175);
  head.add(mouth);
  g.add(head);

  function makeArm(side) {
    const arm = new THREE.Group();
    arm.position.set(side * 0.30, 1.54, 0);
    const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.30, 4, 10), shirt);
    upper.position.y = -0.20;
    arm.add(upper);
    const elbow = new THREE.Group();
    elbow.position.y = -0.40;
    const fore = new THREE.Mesh(new THREE.CapsuleGeometry(0.065, 0.28, 4, 10), skin2);
    fore.position.y = -0.19;
    elbow.add(fore);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), skin2);
    hand.position.y = -0.40;
    hand.scale.set(0.9, 0.7, 1.0);
    elbow.add(hand);
    arm.add(elbow);
    g.add(arm);
    return arm;
  }
  const leftArm  = makeArm(-1);
  const rightArm = makeArm( 1);

  function makeLeg(side) {
    const leg = new THREE.Group();
    leg.position.set(side * 0.13, 0.78, 0);
    const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.10, 0.34, 4, 10), pants);
    upper.position.y = -0.22;
    leg.add(upper);
    const knee = new THREE.Group();
    knee.position.y = -0.44;
    const lower = new THREE.Mesh(new THREE.CapsuleGeometry(0.085, 0.32, 4, 10), pants);
    lower.position.y = -0.20;
    knee.add(lower);
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.07, 0.30), shoe);
    foot.position.set(0, -0.42, 0.05);
    knee.add(foot);
    leg.add(knee);
    g.add(leg);
    return leg;
  }
  const leftLeg  = makeLeg(-1);
  const rightLeg = makeLeg( 1);

  g.userData.rig = {
    leftArm, rightArm, leftLeg, rightLeg, head,
    mouth, lEyeball, rEyeball, torso,
  };
  return g;
}

// ============================================================
// Dispatcher: returns a cheap procedural figure synchronously.
// The GLTF reskin is applied lazily by `scheduleGLTFUpgrade()` in the
// game loop, so level transitions don't pay the SkeletonUtils.clone cost
// for 10+ figures at once.
// ============================================================
export function buildCompanionMesh(palette, _ignored = undefined, name = null) {
  const shirtColor = (palette && palette.dressColor) ?? palette ?? 0x6bb0ff;
  const pantsColor = (palette && palette.accentColor) ?? 0x2a2a3a;
  const g = buildProceduralCompanion(shirtColor, pantsColor);
  if (name) g.add(makeNameTag(name, shirtColor));
  return g;
}
