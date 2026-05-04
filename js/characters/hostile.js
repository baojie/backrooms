// Hostile NPC builders — the gaunt, glowing-eyed figures that hunt the player.
//
// Two flavours:
//   - `buildHumanoidEntity()` — fully procedural, used as the immediate
//     placeholder while Soldier.glb is still loading.
//   - `buildSoldierEntity()`  — Soldier.glb clone tinted dim-red, ramped to
//     the Run animation. Returns null until the GLTF asset resolves.
//
// Both expose the same `userData.rig` keys (head / leftArm / rightArm /
// leftLeg / rightLeg / lEyeball / rEyeball / torso / mouth) so the AI tick
// loop can drive either rig identically.

import * as THREE from 'three';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { isSoldierLoaded, getSoldierProto, getSoldierAnims } from './loaders.js';

// ============================================================
// Procedural fallback — gaunt, robed, glowing-eyed figure built from
// primitives. Same rig keys as companions so the walk loop can drive it.
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
// Soldier.glb-based hostile entity. Tinted dim-red and ramped to the Run
// animation so the figure reads as a malevolent male NPC rushing the player.
// Returns null until the GLTF asset has resolved.
// ============================================================
export function buildSoldierEntity() {
  if (!isSoldierLoaded()) return null;
  const root = SkeletonUtils.clone(getSoldierProto());
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
  for (const clip of getSoldierAnims()) {
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
