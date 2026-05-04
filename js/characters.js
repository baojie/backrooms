// Character / NPC mesh construction.
//
// Two flavours:
//   - Procedural (cheap) — built synchronously from primitives. Used as a
//     placeholder when level transitions need 10+ figures up immediately.
//   - GLTF / FBX (rich)  — Soldier.glb (male NPC + male skeleton for the
//     feminine reskin) and the mudroljub/capoeira-girl FBX (female with the
//     Ginga sway clip). Loaded asynchronously via `loadCharacters()`; the
//     game upgrades procedural figures to these once the assets resolve.
//
// `loadCharacters({ onSoldierReady, onGirlReady })` kicks off the network
// fetches and notifies the caller when each model is ready, so the upgrade
// scheduler in index.html can run `buildSoldierEntity()` /
// `buildGLTFCompanion()` against the freshly available protos.

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

// ---- Loader state ----
let humanProto = null;
let humanAnims = null;
let humanLoaded = false;

let soldierProto = null, soldierAnims = null, soldierLoaded = false;
let girlProto    = null, girlAnims    = null, girlLoaded    = false;
let butterflyProto = null, butterflyLoaded = false;

export function loadCharacters({ onSoldierReady, onGirlReady } = {}) {
  const _gltfLoader = new GLTFLoader();
  // Butterfly mesh by Hugo Gibson, hosted on Poly Pizza (CC-BY 3.0).
  // Reused as the flying-insect ("moth") on the swimming-pool level.
  _gltfLoader.load(
    'https://static.poly.pizza/80046a70-4713-438e-8174-b0a4a0a22c7c.glb',
    (gltf) => {
      const root = gltf.scene;
      // Normalize to a wingspan of ~0.45m so the bug reads at face-height.
      const bbox = new THREE.Box3().setFromObject(root);
      const size = new THREE.Vector3(); bbox.getSize(size);
      const span = Math.max(size.x, size.z, 0.001);
      const s = 0.45 / span;
      root.scale.setScalar(s);
      butterflyProto = root;
      butterflyLoaded = true;
    },
    undefined,
    (err) => console.warn('[gltf] butterfly load failed; falling back to procedural moth', err)
  );

  _gltfLoader.load(
    'https://threejs.org/examples/models/gltf/Soldier.glb',
    (gltf) => {
      soldierProto = gltf.scene;
      soldierAnims = gltf.animations || [];
      soldierLoaded = true;
      humanProto = gltf.scene;
      humanAnims = gltf.animations || [];
      humanLoaded = true;
      console.log('[gltf] Soldier animations:', soldierAnims.map(a => a.name));
      if (onSoldierReady) onSoldierReady();
    },
    undefined,
    (err) => console.warn('[gltf] Soldier load failed', err)
  );

  // Capoeira girl FBX — model.fbx is the base mesh; Ginga.fbx is the sway clip.
  const _capoeiraBase = 'https://cdn.jsdelivr.net/gh/mudroljub/capoeira-girl@master/assets/fbx/';
  const _fbxLoader = new FBXLoader();
  _fbxLoader.load(
    _capoeiraBase + 'model.fbx',
    (model) => {
      girlProto = model;
      _fbxLoader.load(
        _capoeiraBase + 'Ginga.fbx',
        (anim) => {
          girlAnims = anim.animations || [];
          girlLoaded = true;
          console.log('[fbx] Capoeira girl + Ginga loaded; clips:', girlAnims.map(a => a.name));
          if (onGirlReady) onGirlReady();
        },
        undefined,
        (err) => {
          console.warn('[fbx] Ginga animation load failed; girls will be static', err);
          girlAnims = model.animations || [];
          girlLoaded = true;
          if (onGirlReady) onGirlReady();
        }
      );
    },
    undefined,
    (err) => console.warn('[fbx] Capoeira girl load failed; staying procedural', err)
  );
}

export const isSoldierLoaded = () => soldierLoaded;
export const isGirlLoaded = () => girlLoaded;
export const isButterflyLoaded = () => butterflyLoaded;
export const getButterflyProto = () => butterflyProto;

// ============================================================
// Name tag — floating sprite above each named figure.
// ============================================================
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

// ============================================================
// Companion knife — chunky blade visible from far away so the team's
// "armed" status is obvious.
// ============================================================
export function buildCompanionKnife() {
  const g = new THREE.Group();
  const blade = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.55, 0.02),
    new THREE.MeshLambertMaterial({ color: 0xeef2ff, emissive: 0x445566, emissiveIntensity: 0.6 })
  );
  blade.position.y = -0.27;
  g.add(blade);
  const tip = new THREE.Mesh(
    new THREE.ConeGeometry(0.04, 0.10, 4),
    blade.material
  );
  tip.position.y = -0.60;
  tip.rotation.z = Math.PI;
  g.add(tip);
  const guard = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, 0.04, 0.04),
    new THREE.MeshLambertMaterial({ color: 0x222222 })
  );
  guard.position.y = 0.02;
  g.add(guard);
  const grip = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.025, 0.16, 8),
    new THREE.MeshLambertMaterial({ color: 0x4a2a14 })
  );
  grip.position.y = 0.10;
  g.add(grip);
  return g;
}

export function attachCompanionKnife(mesh) {
  // GLTF girl: attach to the right-hand bone if exposed
  const gltf = mesh.userData.gltf;
  if (gltf && gltf.righthandBone) {
    const knife = buildCompanionKnife();
    knife.position.set(0, 0.06, 0.0);
    knife.rotation.set(Math.PI / 2, 0, 0);
    gltf.righthandBone.add(knife);
    return knife;
  }
  // Procedural rig: attach to the right elbow group
  const rig = mesh.userData.rig;
  if (!rig || !rig.rightArm) return null;
  const elbow = rig.rightArm.children.find(o => o.isGroup);
  if (!elbow) return null;
  const knife = buildCompanionKnife();
  knife.position.set(0.0, -0.40, 0.05);
  knife.rotation.set(Math.PI / 2, 0, 0);
  elbow.add(knife);
  return knife;
}

// ============================================================
// Shared geometries for buildFemaleCompanion — one allocation reused
// across all 100 figures.
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
// Hostile humanoid entity — gaunt, robed, glowing-eyed figure.
// Same rig keys as companions so the walk loop can drive it.
// ============================================================
export function buildHumanoidEntity() {
  const g = new THREE.Group();
  const flesh    = new THREE.MeshLambertMaterial({ color: 0x9aa39c });
  const fleshDk  = new THREE.MeshLambertMaterial({ color: 0x6c7370 });
  const robe     = new THREE.MeshLambertMaterial({ color: 0x111014, side: THREE.DoubleSide });
  const robeTrim = new THREE.MeshLambertMaterial({ color: 0x2a1a22 });
  const hair     = new THREE.MeshLambertMaterial({ color: 0x080608 });
  const claw     = new THREE.MeshLambertMaterial({ color: 0x1a1410 });
  const sclera   = new THREE.MeshBasicMaterial({ color: 0xfff4d0 });
  const iris     = new THREE.MeshBasicMaterial({ color: 0xff2a2a });
  const teethM   = new THREE.MeshBasicMaterial({ color: 0xddd0b8 });
  const mouthM   = new THREE.MeshBasicMaterial({ color: 0x180608 });

  const torso = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.22, 0.50, 6, 12), robe
  );
  torso.position.y = 1.28;
  torso.scale.set(1.0, 1.0, 0.85);
  g.add(torso);
  const chest = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 12, 10), fleshDk
  );
  chest.position.set(0, 1.55, -0.04);
  chest.scale.set(1.4, 0.4, 0.6);
  g.add(chest);
  const hips = new THREE.Mesh(
    new THREE.CylinderGeometry(0.21, 0.18, 0.18, 14), robeTrim
  );
  hips.position.y = 0.86;
  g.add(hips);
  const skirt = new THREE.Mesh(
    new THREE.ConeGeometry(0.42, 0.85, 14, 1, true), robe
  );
  skirt.position.y = 0.50;
  g.add(skirt);
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 + Math.random() * 0.3;
    const r = 0.34 + Math.random() * 0.06;
    const strip = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.18 + Math.random() * 0.20, 0.02), robe
    );
    strip.position.set(Math.cos(a) * r, 0.16, Math.sin(a) * r);
    strip.rotation.y = a;
    g.add(strip);
  }

  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.060, 0.072, 0.14, 10), fleshDk
  );
  neck.position.y = 1.66;
  g.add(neck);

  const head = new THREE.Group();
  head.position.y = 1.80;
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.17, 18, 16), flesh);
  skull.scale.set(0.88, 1.15, 0.92);
  head.add(skull);
  const lHollow = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), fleshDk);
  const rHollow = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), fleshDk);
  lHollow.position.set(-0.10, -0.02, -0.13); lHollow.scale.set(1.0, 1.4, 0.5);
  rHollow.position.set( 0.10, -0.02, -0.13); rHollow.scale.set(1.0, 1.4, 0.5);
  head.add(lHollow); head.add(rHollow);
  const hood = new THREE.Mesh(
    new THREE.ConeGeometry(0.27, 0.42, 14, 1, true), robe
  );
  hood.position.set(0, 0.05, 0.02);
  hood.rotation.x = -0.20;
  head.add(hood);
  for (let i = 0; i < 6; i++) {
    const strand = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.28 + Math.random() * 0.10, 0.015), hair
    );
    const ang = -0.6 + (i / 5) * 1.2;
    strand.position.set(Math.sin(ang) * 0.16, -0.06, -0.165 + Math.cos(ang) * 0.02);
    strand.rotation.z = ang * 0.25;
    head.add(strand);
  }
  const socketG = new THREE.SphereGeometry(0.052, 10, 8);
  const lSocket = new THREE.Mesh(socketG, fleshDk);
  const rSocket = new THREE.Mesh(socketG, fleshDk);
  lSocket.position.set(-0.060, 0.02, -0.140); lSocket.scale.set(1.0, 0.8, 0.6);
  rSocket.position.set( 0.060, 0.02, -0.140); rSocket.scale.set(1.0, 0.8, 0.6);
  head.add(lSocket); head.add(rSocket);
  const lEyeball = new THREE.Group(); lEyeball.position.copy(lSocket.position);
  const rEyeball = new THREE.Group(); rEyeball.position.copy(rSocket.position);
  lEyeball.position.z -= 0.012; rEyeball.position.z -= 0.012;
  const eyeBallG = new THREE.SphereGeometry(0.030, 12, 10);
  const irisG    = new THREE.SphereGeometry(0.016, 10, 8);
  lEyeball.add(new THREE.Mesh(eyeBallG, sclera));
  rEyeball.add(new THREE.Mesh(eyeBallG, sclera));
  const lI = new THREE.Mesh(irisG, iris); lI.position.z = -0.022; lEyeball.add(lI);
  const rI = new THREE.Mesh(irisG, iris); rI.position.z = -0.022; rEyeball.add(rI);
  head.add(lEyeball); head.add(rEyeball);
  const browG = new THREE.BoxGeometry(0.08, 0.018, 0.02);
  const lBrow = new THREE.Mesh(browG, fleshDk); lBrow.position.set(-0.060, 0.075, -0.150); lBrow.rotation.z =  0.15;
  const rBrow = new THREE.Mesh(browG, fleshDk); rBrow.position.set( 0.060, 0.075, -0.150); rBrow.rotation.z = -0.15;
  head.add(lBrow); head.add(rBrow);
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.020, 0.09, 4), flesh);
  nose.rotation.x = Math.PI / 2;
  nose.position.set(0, -0.005, -0.180);
  head.add(nose);
  const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.05, 0.02), mouthM);
  mouth.position.set(0, -0.085, -0.165);
  head.add(mouth);
  for (let i = 0; i < 5; i++) {
    const tooth = new THREE.Mesh(new THREE.ConeGeometry(0.010, 0.030, 4), teethM);
    tooth.rotation.x = Math.PI;
    tooth.position.set(-0.045 + i * 0.022, -0.072, -0.158);
    head.add(tooth);
  }
  for (let i = 0; i < 5; i++) {
    const tooth = new THREE.Mesh(new THREE.ConeGeometry(0.010, 0.030, 4), teethM);
    tooth.position.set(-0.045 + i * 0.022, -0.098, -0.158);
    head.add(tooth);
  }
  g.add(head);

  function makeArm(side) {
    const arm = new THREE.Group();
    arm.position.set(side * 0.27, 1.55, 0);
    const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.080, 0.36, 4, 10), robe);
    upper.position.y = -0.22;
    arm.add(upper);
    const elbow = new THREE.Group();
    elbow.position.y = -0.46;
    const fore = new THREE.Mesh(new THREE.CapsuleGeometry(0.045, 0.36, 4, 10), fleshDk);
    fore.position.y = -0.22;
    elbow.add(fore);
    const palm = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), fleshDk);
    palm.position.y = -0.46;
    palm.scale.set(0.8, 0.6, 1.2);
    elbow.add(palm);
    for (let i = -1; i <= 1; i++) {
      const cl = new THREE.Mesh(new THREE.ConeGeometry(0.013, 0.10, 5), claw);
      cl.position.set(i * 0.025, -0.54, -0.04);
      cl.rotation.x = Math.PI;
      cl.rotation.z = i * 0.12;
      elbow.add(cl);
    }
    arm.add(elbow);
    g.add(arm);
    return arm;
  }
  const leftArm  = makeArm(-1);
  const rightArm = makeArm( 1);
  leftArm.rotation.x  = -0.35;
  rightArm.rotation.x = -0.35;

  function makeLeg(side) {
    const leg = new THREE.Group();
    leg.position.set(side * 0.10, 0.78, 0);
    const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.085, 0.32, 4, 10), robeTrim);
    upper.position.y = -0.22;
    leg.add(upper);
    const knee = new THREE.Group();
    knee.position.y = -0.44;
    const lower = new THREE.Mesh(new THREE.CapsuleGeometry(0.065, 0.30, 4, 10), fleshDk);
    lower.position.y = -0.20;
    knee.add(lower);
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.05, 0.26), claw);
    foot.position.set(0, -0.40, 0.04);
    knee.add(foot);
    leg.add(knee);
    g.add(leg);
    return leg;
  }
  const leftLeg  = makeLeg(-1);
  const rightLeg = makeLeg( 1);

  g.userData.rig = {
    leftArm, rightArm, leftLeg, rightLeg, head,
    lEyeball, rEyeball, torso, skirt, mouth,
  };
  return g;
}

// ============================================================
// Feminine reskin attached to a Soldier-rig clone.
// `bones` is the bone-name lookup (`hips`, `spine2`, `head`, etc.).
// ============================================================
export function attachFeminineReskin(bones, palette) {
  const skin   = new THREE.MeshLambertMaterial({ color: palette.skinColor });
  const dress  = new THREE.MeshLambertMaterial({ color: palette.dressColor });
  const hair   = new THREE.MeshLambertMaterial({ color: palette.hairColor });
  const shoe   = new THREE.MeshLambertMaterial({ color: 0x202024 });
  const eyeWh  = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const pupil  = new THREE.MeshBasicMaterial({ color: 0x2a1f1a });
  const lipMat = new THREE.MeshBasicMaterial({ color: 0xc44a5a });
  const blush  = new THREE.MeshBasicMaterial({ color: 0xf2a8b0, transparent: true, opacity: 0.55 });

  if (bones.hips) {
    const pelvis = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.15, 0.18, 14), dress);
    pelvis.position.y = -0.04;
    bones.hips.add(pelvis);
    const skirt = new THREE.Mesh(
      new THREE.ConeGeometry(0.30, 0.45, 18, 1, true),
      new THREE.MeshLambertMaterial({ color: palette.dressColor, side: THREE.DoubleSide })
    );
    skirt.rotation.x = Math.PI;
    skirt.position.y = -0.22;
    bones.hips.add(skirt);
  }
  const spineBone = bones.spine2 || bones.spine1 || bones.spine;
  if (spineBone) {
    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.18, 6, 12), dress);
    torso.position.y = 0.08;
    torso.scale.set(1.0, 1.0, 0.78);
    spineBone.add(torso);
    const bustG = new THREE.SphereGeometry(0.06, 12, 10);
    const lBust = new THREE.Mesh(bustG, dress); lBust.position.set(-0.06, 0.10, -0.10);
    const rBust = new THREE.Mesh(bustG, dress); rBust.position.set( 0.06, 0.10, -0.10);
    lBust.scale.set(1, 0.7, 0.85); rBust.scale.set(1, 0.7, 0.85);
    spineBone.add(lBust); spineBone.add(rBust);
  }
  if (bones.neck) {
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.10, 10), skin);
    neck.position.y = 0.05;
    bones.neck.add(neck);
  }
  if (bones.head) {
    const head = new THREE.Group();
    head.position.y = 0.09;
    bones.head.add(head);
    const skull = new THREE.Mesh(new THREE.SphereGeometry(0.12, 20, 16), skin);
    skull.scale.set(1.0, 1.05, 0.95);
    head.add(skull);
    const jaw = new THREE.Mesh(new THREE.SphereGeometry(0.10, 14, 12), skin);
    jaw.position.y = -0.05;
    jaw.scale.set(0.85, 0.65, 0.85);
    head.add(jaw);
    const hairCap = new THREE.Mesh(
      new THREE.SphereGeometry(0.125, 20, 16, 0, Math.PI*2, 0, Math.PI*0.6), hair
    );
    head.add(hairCap);
    const longHair = new THREE.Mesh(
      new THREE.CylinderGeometry(0.13, 0.18, 0.55, 14, 1, true),
      new THREE.MeshLambertMaterial({ color: palette.hairColor, side: THREE.DoubleSide })
    );
    longHair.position.set(0, -0.27, 0.04);
    head.add(longHair);
    const fringe = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.05, 0.04), hair);
    fringe.position.set(0, 0.07, -0.10);
    head.add(fringe);
    const bow = new THREE.Mesh(
      new THREE.TorusGeometry(0.05, 0.018, 6, 10),
      new THREE.MeshLambertMaterial({ color: palette.accentColor })
    );
    bow.position.set(0, 0.15, 0);
    bow.rotation.set(Math.PI/2, 0, 0);
    head.add(bow);
    const eyeG = new THREE.SphereGeometry(0.024, 10, 8);
    const pupG = new THREE.SphereGeometry(0.013, 8, 6);
    const lEy = new THREE.Mesh(eyeG, eyeWh); lEy.position.set(-0.04, 0.01, -0.108);
    const rEy = new THREE.Mesh(eyeG, eyeWh); rEy.position.set( 0.04, 0.01, -0.108);
    head.add(lEy); head.add(rEy);
    const lEyeball = new THREE.Group(); lEyeball.position.copy(lEy.position);
    const rEyeball = new THREE.Group(); rEyeball.position.copy(rEy.position);
    const lP = new THREE.Mesh(pupG, pupil); lP.position.z = -0.018; lEyeball.add(lP);
    const rP = new THREE.Mesh(pupG, pupil); rP.position.z = -0.018; rEyeball.add(rP);
    head.add(lEyeball); head.add(rEyeball);
    const browG = new THREE.BoxGeometry(0.05, 0.010, 0.012);
    const lBrow = new THREE.Mesh(browG, hair); lBrow.position.set(-0.04, 0.05, -0.115);
    const rBrow = new THREE.Mesh(browG, hair); rBrow.position.set( 0.04, 0.05, -0.115);
    head.add(lBrow); head.add(rBrow);
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.05, 6), skin);
    nose.rotation.x = -Math.PI/2;
    nose.position.set(0, -0.005, -0.118);
    head.add(nose);
    const lip = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.008, 0.012), lipMat);
    lip.position.set(0, -0.04, -0.118);
    head.add(lip);
    const mouth = new THREE.Mesh(
      new THREE.BoxGeometry(0.038, 0.001, 0.008),
      new THREE.MeshBasicMaterial({ color: 0x111111 })
    );
    mouth.position.set(0, -0.045, -0.115);
    head.add(mouth);
    const blG = new THREE.SphereGeometry(0.024, 8, 6);
    const lBl = new THREE.Mesh(blG, blush); lBl.position.set(-0.06, -0.02, -0.10); lBl.scale.set(1, 0.5, 0.4); head.add(lBl);
    const rBl = new THREE.Mesh(blG, blush); rBl.position.set( 0.06, -0.02, -0.10); rBl.scale.set(1, 0.5, 0.4); head.add(rBl);
    bones.head.userData.face = { mouth, lEyeball, rEyeball };
  }
  function attachArm(upperKey, foreKey, handKey) {
    if (bones[upperKey]) {
      const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.046, 0.20, 4, 8), dress);
      upper.position.y = 0.13;
      bones[upperKey].add(upper);
    }
    if (bones[foreKey]) {
      const fore = new THREE.Mesh(new THREE.CapsuleGeometry(0.040, 0.18, 4, 8), skin);
      fore.position.y = 0.11;
      bones[foreKey].add(fore);
    }
    if (bones[handKey]) {
      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), skin);
      hand.scale.set(0.85, 1.4, 0.5);
      hand.position.y = 0.06;
      bones[handKey].add(hand);
    }
  }
  attachArm('leftarm',  'leftforearm',  'lefthand');
  attachArm('rightarm', 'rightforearm', 'righthand');
  function attachLeg(upperKey, lowerKey, footKey) {
    if (bones[upperKey]) {
      const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.068, 0.28, 4, 10), skin);
      upper.position.y = 0.20;
      bones[upperKey].add(upper);
    }
    if (bones[lowerKey]) {
      const lower = new THREE.Mesh(new THREE.CapsuleGeometry(0.058, 0.26, 4, 10), skin);
      lower.position.y = 0.18;
      bones[lowerKey].add(lower);
    }
    if (bones[footKey]) {
      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.04, 0.20), shoe);
      foot.position.set(0, 0.02, 0.06);
      bones[footKey].add(foot);
    }
  }
  attachLeg('leftupleg',  'leftleg',  'leftfoot');
  attachLeg('rightupleg', 'rightleg', 'rightfoot');
}

// ============================================================
// Capoeira-girl FBX clone with idle/walk/run mixer + dress tint + head bow.
// Returns null if the FBX hasn't loaded yet.
// ============================================================
export function buildGLTFGirl(palette, name) {
  if (!girlLoaded) return null;
  const root = SkeletonUtils.clone(girlProto);
  // FBX is exported in centimetres — auto-rescale to ~1.7m, feet at y=0.
  const bbox = new THREE.Box3().setFromObject(root);
  const h = bbox.max.y - bbox.min.y;
  if (h > 0.001) {
    root.scale.setScalar(1.7 / h);
    const bbox2 = new THREE.Box3().setFromObject(root);
    root.position.y -= bbox2.min.y;
  }
  const tint = new THREE.Color(palette.dressColor);
  root.traverse(o => {
    if (o.isMesh && o.material) {
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      o.material = mats.map(m => {
        const cm = m.clone();
        if (cm.color) cm.color.lerp(tint, 0.25);
        return cm;
      });
      if (o.material.length === 1) o.material = o.material[0];
      o.castShadow = false;
      o.frustumCulled = false;
    }
  });
  let headBone = null;
  root.traverse(o => {
    if (o.isBone && /head/i.test(o.name) && !headBone) headBone = o;
  });
  if (headBone) {
    const bow = new THREE.Mesh(
      new THREE.TorusGeometry(0.10, 0.030, 8, 14),
      new THREE.MeshLambertMaterial({ color: palette.accentColor })
    );
    bow.position.set(0.10, 0.20, -0.04);
    bow.rotation.x = Math.PI / 2;
    bow.scale.set(0.9, 0.9, 0.55);
    headBone.add(bow);
  }
  const mixer = new THREE.AnimationMixer(root);
  let idleAct = null, walkAct = null, runAct = null;
  for (const clip of girlAnims) {
    if (/idle|ginga/i.test(clip.name))   idleAct = mixer.clipAction(clip);
    else if (/walk/i.test(clip.name))     walkAct = mixer.clipAction(clip);
    else if (/run/i.test(clip.name))      runAct  = mixer.clipAction(clip);
  }
  if (!idleAct && girlAnims.length) idleAct = mixer.clipAction(girlAnims[0]);
  if (!walkAct) walkAct = idleAct;
  if (idleAct) { idleAct.play(); idleAct.setEffectiveWeight(1); }
  if (walkAct && walkAct !== idleAct) { walkAct.play(); walkAct.setEffectiveWeight(0); }
  if (runAct && runAct !== walkAct && runAct !== idleAct) { runAct.play(); runAct.setEffectiveWeight(0); }
  root.userData.gltf = { mixer, idleAct, walkAct, runAct, headBone, isGLTF: true };
  if (name) root.add(makeNameTag(name, palette.dressColor));
  return root;
}

// ============================================================
// Soldier.glb-based hostile entity. Tinted dim-red and ramped to the Run
// animation so the figure reads as a malevolent male NPC rushing the player.
// ============================================================
export function buildSoldierEntity() {
  if (!soldierLoaded) return null;
  const root = SkeletonUtils.clone(soldierProto);
  const tint = new THREE.Color(0x8a1414);
  root.traverse(o => {
    if (o.isMesh && o.material) {
      o.material = o.material.clone();
      if (o.material.color) o.material.color.lerp(tint, 0.45);
      if (o.material.emissive) o.material.emissive.set(0x200000);
      o.castShadow = false;
      o.frustumCulled = false;
    }
  });
  let headBone = null;
  root.traverse(o => {
    if (o.isBone && /head/i.test(o.name) && !headBone) headBone = o;
  });
  if (headBone) {
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff2a2a });
    const eyeG = new THREE.SphereGeometry(0.025, 8, 6);
    const lE = new THREE.Mesh(eyeG, eyeMat); lE.position.set(-0.05, 0.05, -0.10);
    const rE = new THREE.Mesh(eyeG, eyeMat); rE.position.set( 0.05, 0.05, -0.10);
    headBone.add(lE); headBone.add(rE);
  }
  const mixer = new THREE.AnimationMixer(root);
  let idleAct = null, walkAct = null, runAct = null;
  for (const clip of soldierAnims) {
    if (/idle/i.test(clip.name))       idleAct = mixer.clipAction(clip);
    else if (/^run$/i.test(clip.name))  runAct  = mixer.clipAction(clip);
    else if (/walk/i.test(clip.name))   walkAct = mixer.clipAction(clip);
  }
  if (idleAct) { idleAct.play(); idleAct.setEffectiveWeight(0.0); }
  if (walkAct) { walkAct.play(); walkAct.setEffectiveWeight(0.0); }
  if (runAct)  { runAct.play();  runAct.setEffectiveWeight(1.0); }
  root.userData.gltf = { mixer, idleAct, walkAct, runAct, headBone, isGLTF: true };
  return root;
}

// ============================================================
// Soldier-rig clone tinted to a shirt color, with idle/walk/run mixer.
// Used for the GLTF-upgraded companion girls.
// ============================================================
export function buildGLTFCompanion(shirtColor, name) {
  const m = SkeletonUtils.clone(humanProto);
  m.scale.set(1.0, 1.0, 1.0);
  m.traverse(o => {
    if (o.isMesh && o.material) {
      o.material = o.material.clone();
      if (o.material.color) {
        const c = new THREE.Color(shirtColor);
        o.material.color.lerp(c, 0.25);
      }
      o.castShadow = false;
      o.frustumCulled = false;
    }
  });
  let headBone = null;
  m.traverse(o => {
    if (o.isBone && /head/i.test(o.name) && !headBone) headBone = o;
  });
  const mixer = new THREE.AnimationMixer(m);
  let idleAct = null, walkAct = null, runAct = null;
  for (const clip of humanAnims) {
    if (/idle/i.test(clip.name))  idleAct = mixer.clipAction(clip);
    else if (/^run$/i.test(clip.name)) runAct = mixer.clipAction(clip);
    else if (/walk/i.test(clip.name)) walkAct = mixer.clipAction(clip);
  }
  if (idleAct) { idleAct.play(); idleAct.setEffectiveWeight(1); }
  if (walkAct) { walkAct.play(); walkAct.setEffectiveWeight(0); }
  if (runAct)  { runAct.play();  runAct.setEffectiveWeight(0); }
  m.userData.gltf = { mixer, idleAct, walkAct, runAct, headBone, isGLTF: true };
  if (name) m.add(makeNameTag(name, shirtColor));
  return m;
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
