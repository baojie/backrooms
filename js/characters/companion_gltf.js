// GLTF/FBX-based female-companion builders + the feminine-reskin helper.
//
// Pieces:
//   - `attachFeminineReskin(bones, palette)` — attaches feminine body parts
//     (skirt, bust, ponytail, bow, face) onto a Soldier-rig clone's bone
//     hierarchy. Used by `buildGLTFCompanion`.
//   - `buildGLTFCompanion(shirtColor, name)` — clones Soldier.glb, tints it
//     toward `shirtColor`, hooks up Idle/Walk/Run mixer.
//   - `buildQuaterniusGirl(palette, name, idx)` — clones the indexed
//     Quaternius modular-women GLB so each team girl gets her own look.
//   - `buildGLTFGirl(palette, name, idx)` — entry point used by the upgrade
//     scheduler. Tries Quaternius first, falls back to the Capoeira FBX,
//     then returns null if neither has loaded yet.
//
// All depend on the loader state in `./loaders.js`.

import * as THREE from 'three';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { makeNameTag } from './nametag.js';
import {
  isGirlLoaded, getGirlProto, getGirlAnims,
  getSoldierProto, getSoldierAnims,
  getQuaterniusGirl,
} from './loaders.js';

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

// Quaternius modular-women builder. Each call clones the proto at slot
// `idx % count`, lightly tints meshes toward `palette.dressColor` (so each
// girl still reads as "her" colour), and wires whatever Idle/Walk/Run
// clips ship in the GLB.
export function buildQuaterniusGirl(palette, name, idx) {
  const entry = getQuaterniusGirl(idx);
  if (!entry) return null;
  const root = SkeletonUtils.clone(entry.proto);
  // Quaternius models export in metres but the bind size varies — rescale
  // to ~1.7m and rest the feet on y=0, same as the Capoeira path.
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
        // Quaternius uses flat vertex colours; nudge toward dressColor only
        // a little so each character keeps her distinct palette.
        if (cm.color) cm.color.lerp(tint, 0.12);
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
  const mixer = new THREE.AnimationMixer(root);
  let idleAct = null, walkAct = null, runAct = null;
  for (const clip of entry.anims) {
    if (/idle/i.test(clip.name))      idleAct = mixer.clipAction(clip);
    else if (/^run$/i.test(clip.name)) runAct  = mixer.clipAction(clip);
    else if (/walk/i.test(clip.name)) walkAct = mixer.clipAction(clip);
  }
  if (!idleAct && entry.anims.length) idleAct = mixer.clipAction(entry.anims[0]);
  if (!walkAct) walkAct = idleAct;
  if (idleAct) { idleAct.play(); idleAct.setEffectiveWeight(1); }
  if (walkAct && walkAct !== idleAct) { walkAct.play(); walkAct.setEffectiveWeight(0); }
  if (runAct && runAct !== walkAct && runAct !== idleAct) { runAct.play(); runAct.setEffectiveWeight(0); }
  root.userData.gltf = {
    mixer, idleAct, walkAct, runAct, headBone,
    isGLTF: true, source: 'quaternius', variant: entry.name,
  };
  if (name) root.add(makeNameTag(name, palette.dressColor));
  return root;
}

export function buildGLTFGirl(palette, name, idx) {
  // Prefer a Quaternius-pack rig so each girl looks distinct. Falls back
  // to the Capoeira FBX (one-rig-fits-all) if the indexed Quaternius
  // proto hasn't loaded yet — re-runs of the upgrade scheduler will
  // upgrade these girls again once the new proto arrives.
  if (typeof idx === 'number') {
    const q = buildQuaterniusGirl(palette, name, idx);
    if (q) return q;
  }
  // Capoeira fallback. Both proto AND anims need to be loaded — they
  // arrive in two separate FBX requests and the proto lands first.
  if (!getGirlProto() || !getGirlAnims()) return null;
  const root = SkeletonUtils.clone(getGirlProto());
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
  // Each frame we override the upper-arm + forearm bone rotations so the
  // Ginga clip can't raise the hands above the head. We start from the
  // bind quaternion (typically T-pose with arms out to the sides) and fold
  // the upper arm down ~90° around the local Z axis (mirrored per side).
  // Hips & legs keep swaying with the original clip.
  const armBones = [];
  const _Z = new THREE.Vector3(0, 0, 1);
  root.traverse(o => {
    if (!o.isBone) return;
    const n = o.name;
    if (/head/i.test(n) && !headBone) headBone = o;
    const isUpper = /(LeftArm|RightArm)$/i.test(n);
    const isFore  = /(LeftForeArm|RightForeArm)$/i.test(n);
    if (!isUpper && !isFore) return;
    const isLeft = /Left/i.test(n);
    const target = o.quaternion.clone();
    if (isUpper) {
      // Rotate the bind T-pose down: left arm folds clockwise (-π/2 around
      // local Z), right arm counter-clockwise. Forearm stays straight.
      const fold = new THREE.Quaternion().setFromAxisAngle(_Z, (isLeft ? -1 : 1) * Math.PI / 2);
      target.multiply(fold);
    }
    armBones.push({ bone: o, targetQuat: target });
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
  const _girlAnims = getGirlAnims();
  for (const clip of _girlAnims) {
    if (/idle|ginga/i.test(clip.name))   idleAct = mixer.clipAction(clip);
    else if (/walk/i.test(clip.name))     walkAct = mixer.clipAction(clip);
    else if (/run/i.test(clip.name))      runAct  = mixer.clipAction(clip);
  }
  if (!idleAct && _girlAnims.length) idleAct = mixer.clipAction(_girlAnims[0]);
  if (!walkAct) walkAct = idleAct;
  if (idleAct) { idleAct.play(); idleAct.setEffectiveWeight(1); }
  if (walkAct && walkAct !== idleAct) { walkAct.play(); walkAct.setEffectiveWeight(0); }
  if (runAct && runAct !== walkAct && runAct !== idleAct) { runAct.play(); runAct.setEffectiveWeight(0); }
  const postPose = armBones.length
    ? () => { for (const ab of armBones) ab.bone.quaternion.copy(ab.targetQuat); }
    : null;
  root.userData.gltf = { mixer, idleAct, walkAct, runAct, headBone, postPose, isGLTF: true };
  if (name) root.add(makeNameTag(name, palette.dressColor));
  return root;
}

export function buildGLTFCompanion(shirtColor, name) {
  const m = SkeletonUtils.clone(getSoldierProto());
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
  for (const clip of getSoldierAnims()) {
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
