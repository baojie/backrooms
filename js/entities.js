// Hostile entity AI tick (per-frame).
//
// `createEntities(ctx)` returns `tickEntities(dt, t)` bound to the live
// game state. Each entity:
//   - Advances toward the player at `e.speed`, sliding around walls if
//     blocked (try perpendicular + reverse before giving up)
//   - Looks at the player horizontally
//   - GLTF (Soldier.glb-rigged) figures: just tick the AnimationMixer
//   - Procedural-rig figures: skip animation past 32m for cost; otherwise
//     drive a shambling walk + arm reach + head sway + eye-track + jaw
//   - Damage the player at 1000 HP/s when within 1m
//   - Damage companions at 0.8/s when within 1m, with leaveCorpse +
//     playDeathCry on kill
//
// ctx shape:
//   THREE
//   controls, player, deathScreen, flashEl
//   S.entities, companions, S.wallBoxes
//                — current-level arrays (re-derived each call so
//                  disposeLevel's reassignment stays invisible)
//   leaveCorpse, playDeathCry, playStatic
//   say, speak

import * as THREE from 'three';

export function createEntities(ctx) {
  const {
    S,
    controls, player, deathScreen, flashEl, companions,
    leaveCorpse, playDeathCry, playStatic,
    say, speak,
  } = ctx;

  return function tickEntities(dt, t) {
    const entities = S.entities;
    if (!entities.length) return;
    const pp = controls.getObject().position;
    const wallBoxes = S.wallBoxes;

    for (const e of entities) {
      const v = new THREE.Vector3().subVectors(pp, e.mesh.position);
      const dist = v.length();
      v.y = 0; v.normalize();
      const next = e.mesh.position.clone().addScaledVector(v, e.speed * dt);
      let blocked = false;
      for (const w of wallBoxes) {
        const hx = w.halfX ?? w.half, hz = w.halfZ ?? w.half;
        const dx = next.x - w.x, dz = next.z - w.z;
        if (Math.abs(dx) < hx + 0.4 && Math.abs(dz) < hz + 0.4) { blocked = true; break; }
      }
      let moved = false;
      if (!blocked) { e.mesh.position.copy(next); moved = true; }
      else {
        for (const a of [Math.PI/2, -Math.PI/2, Math.PI]) {
          const dd = v.clone().applyAxisAngle(new THREE.Vector3(0,1,0), a);
          const n2 = e.mesh.position.clone().addScaledVector(dd, e.speed * dt);
          let b2 = false;
          for (const w of wallBoxes) {
            const hx2 = w.halfX ?? w.half, hz2 = w.halfZ ?? w.half;
            const dx = n2.x - w.x, dz = n2.z - w.z;
            if (Math.abs(dx) < hx2 + 0.4 && Math.abs(dz) < hz2 + 0.4) { b2 = true; break; }
          }
          if (!b2) { e.mesh.position.copy(n2); moved = true; break; }
        }
      }
      e.mesh.lookAt(pp.x, e.mesh.position.y, pp.z);

      // Soldier GLTF: just tick the animation mixer
      const eg = e.mesh.userData.gltf;
      if (eg) {
        eg.mixer.update(dt);
        continue;
      }

      // Shambling rig animation — skip for far figures to save cost
      const rig = e.mesh.userData.rig;
      if (rig) {
        const camDx = e.mesh.position.x - pp.x;
        const camDz = e.mesh.position.z - pp.z;
        if (camDx*camDx + camDz*camDz < 32 * 32) {
          e.walkPhase = (e.walkPhase || 0) + dt * (moved ? 5.5 : 1.2);
          const sw = moved ? Math.sin(e.walkPhase) * 0.45 : Math.sin(e.walkPhase) * 0.06;
          rig.leftLeg.rotation.x  =  sw;
          rig.rightLeg.rotation.x = -sw;
          // Arms hover forward in a predatory reach, with a slight sway
          rig.leftArm.rotation.x  = -0.55 + sw * 0.35;
          rig.rightArm.rotation.x = -0.55 - sw * 0.35;
          if (rig.skirt) rig.skirt.rotation.z = Math.sin(e.walkPhase * 0.6) * 0.06;
          // Slow head tilt + breathing
          rig.head.rotation.z = Math.sin(t * 1.1 + e.walkPhase) * 0.07;
          if (rig.torso) {
            const br = 1 + Math.sin(t * 1.6 + e.walkPhase) * 0.04;
            rig.torso.scale.set(br, 1, br * 0.85);
          }
          // Eyes track the player
          if (rig.lEyeball && rig.rEyeball) {
            const local = e.mesh.worldToLocal(pp.clone());
            const yaw = THREE.MathUtils.clamp(Math.atan2(local.x, -local.z) * 0.5, -0.4, 0.4);
            rig.lEyeball.rotation.y = yaw;
            rig.rEyeball.rotation.y = yaw;
          }
          // Jaw gnashing when close
          if (rig.mouth) {
            const open = dist < 6 ? 1 + Math.abs(Math.sin(t * 9)) * 1.6 : 1;
            rig.mouth.scale.y = open;
          }
        }
      }

      if (dist < 1.0 && deathScreen.style.display !== 'flex') {
        player.hp -= dt * 1000;     // contact damage: 1000 HP/s (~10s death)
        flashEl.style.opacity = '0.4';
        setTimeout(() => flashEl.style.opacity = '0', 120);
      }
      for (const c of companions) {
        if (!c.alive || !c.mesh) continue;
        const cd = c.mesh.position.distanceTo(e.mesh.position);
        if (cd < 1.0) {
          c.hp -= dt * 0.8;
          if (c.hp <= 0) {
            c.alive = false;
            leaveCorpse(c.mesh);
            c.mesh = null;
            // Death cry — vocal "啊!" via TTS, plus a synthesized scream tone
            playDeathCry(c);
            const line = `${c.name} 被吞没了……`;
            say(line, 4);
            speak('旁白', line, { rate: 0.8, pitch: 0.55 });
            playStatic();
          }
        }
      }
    }
  };
}
