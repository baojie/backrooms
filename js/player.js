// Per-frame player state update: wake-up animation, WASD movement,
// flashlight battery, death camera collapse + corpse drop.
//
// `createPlayer(ctx)` returns three updaters called from tick():
//   updatePlayerWakeup(dt)    — handles the "lying down" intro: any
//                               WASD/Space transitions to standing up;
//                               then animate camera back to upright.
//   updatePlayerMovement(dt, t) — WASD + sprint + sanity speed boost;
//                               boat steering when boarded; pool wading
//                               (slower + camera dip); stamina drain;
//                               flashlight battery decay; collision via
//                               injected collide().
//   updatePlayerDeath(dt)     — when hp ≤ 0, run the camera-collapse
//                               animation, drop a procedural corpse via
//                               leaveCorpse, then show the death screen.
//
// ctx shape:
//   THREE
//   controls, camera, flashlight, flashEl, deathScreen
//   player, keys
//   S.pool                — pool footprint (rebuilt per level)
//   S.levelGroup          — for corpse placement
//   collide                  — wall collision (from js/collision.js)
//   playStatic               — death-trigger sting
//   buildProceduralCompanion — to construct the corpse mesh
//   leaveCorpse              — flatten the corpse mesh in place

import * as THREE from 'three';

export function createPlayer(ctx) {
  const {
    S,
    controls, camera, flashlight, flashEl, deathScreen,
    player, keys,
    collide,
    playStatic,
    buildProceduralCompanion, leaveCorpse,
  } = ctx;

  function updatePlayerWakeup(dt) {
    if (player.lyingDown) {
      const obj = controls.getObject();
      obj.position.y = 0.30;
      if (keys['KeyW'] || keys['KeyA'] || keys['KeyS'] || keys['KeyD'] || keys['Space']) {
        player.lyingDown = false;
        player.standingUp = 0;
      }
    }
    if (player.standingUp !== undefined && player.standingUp !== null) {
      player.standingUp = Math.min(1, player.standingUp + dt * 1.2);
      const obj = controls.getObject();
      obj.position.y = 0.30 + (1.7 - 0.30) * player.standingUp;
      camera.rotation.x = -Math.PI * 0.4 * (1 - player.standingUp);
      if (player.standingUp >= 1) {
        player.standingUp = null;
        player.hasWokenUp = true;
        camera.rotation.x = 0;
      }
    }
  }

  function updatePlayerMovement(dt, t) {
    if (!(controls.isLocked && !player.dying && !player.lyingDown && player.standingUp == null)) {
      // Still apply flashlight decay even when input is locked out.
      flashlight.intensity = (player.flashlightOn && player.flashlightBattery > 0) ? 22 : 0;
      if (player.flashlightOn) {
        player.flashlightBattery = Math.max(0, player.flashlightBattery - dt*0.02);
        if (player.flashlightBattery === 0) player.flashlightOn = false;
      }
      return;
    }

    // "In water" now means "inside the sunken pool footprint" (the
    // redesigned pool level no longer floods the whole hall).
    const _pp = controls.getObject().position;
    const pool = S.pool;
    const inWater = !!(pool
      && Math.abs(_pp.x - pool.x) < pool.halfX
      && Math.abs(_pp.z - pool.z) < pool.halfZ);
    const onBoat = !!player.boat;
    const boostMul = player.speedBoost > 0 ? 1.45 : 1.0;
    // Boats glide near full speed; wading without one is slow.
    const waterMul = onBoat ? 0.9 : (inWater ? 0.55 : 1.0);
    const sprint = keys['ShiftLeft'] && player.stamina > 0.05;
    const speed = (sprint ? 6 : 3.2) * boostMul * waterMul;
    const fwd = (keys['KeyW']?1:0) + (keys['KeyS']?-1:0);
    const str = (keys['KeyD']?1:0) + (keys['KeyA']?-1:0);

    const dir = new THREE.Vector3();
    if (fwd || str) {
      const f = new THREE.Vector3();
      camera.getWorldDirection(f); f.y = 0; f.normalize();
      const r = new THREE.Vector3().crossVectors(f, camera.up).normalize();
      dir.addScaledVector(f, fwd).addScaledVector(r, str).normalize();
    }
    const obj = controls.getObject();
    obj.position.addScaledVector(dir, speed * dt);
    collide(obj.position);

    if (onBoat) {
      const b = player.boat;
      b.x = obj.position.x;
      b.z = obj.position.z;
      if (dir.lengthSq() > 0) b.yaw = Math.atan2(dir.x, dir.z);
      b.mesh.position.set(b.x, 0, b.z);
      b.mesh.rotation.y = b.yaw;
      // Stand on the deck — gentle bobbing.
      obj.position.y = 1.85 + Math.sin(t * 1.4) * 0.04;
    } else {
      // Pool is sunken ~1.6m: only drop slightly when stepping in, so
      // the player still sees the deck + companions above the water plane.
      const baseY = inWater ? 1.45 : 1.7;
      if (dir.lengthSq() > 0) obj.position.y = baseY + Math.sin(t * (sprint?12: inWater?5:8)) * (inWater?0.07:0.04);
      else                    obj.position.y = baseY + (inWater ? Math.sin(t*1.6)*0.02 : 0);
    }

    const moved = obj.position.distanceTo(player.lastPos);
    player.totalDist += moved;
    player.lastPos.copy(obj.position);

    if (sprint && dir.lengthSq() > 0) player.stamina = Math.max(0, player.stamina - dt*0.18);
    else                              player.stamina = Math.min(1, player.stamina + dt*0.10);

    flashlight.intensity = (player.flashlightOn && player.flashlightBattery > 0) ? 22 : 0;
    if (player.flashlightOn) {
      player.flashlightBattery = Math.max(0, player.flashlightBattery - dt*0.02);
      if (player.flashlightBattery === 0) player.flashlightOn = false;
    }
  }

  function updatePlayerDeath(dt) {
    if (player.hp <= 0 && deathScreen.style.display !== 'flex' && !player.dying) {
      player.dying = 0.001;
      player.deathPos = controls.getObject().position.clone();
      playStatic();
    }
    if (player.dying > 0) {
      player.dying = Math.min(1, player.dying + dt / 1.4);
      const obj = controls.getObject();
      obj.position.y = 1.7 - 1.45 * player.dying;
      camera.rotation.x = -Math.PI * 0.5 * player.dying;
      flashEl.style.background = '#600000';
      flashEl.style.opacity = String(0.55 * player.dying);
      if (player.dying >= 1 && deathScreen.style.display !== 'flex') {
        const levelGroup = S.levelGroup;
        if (player.deathPos && levelGroup) {
          const corpse = buildProceduralCompanion(0x9a3a3a, 0x2a2a3a);
          corpse.position.copy(player.deathPos);
          corpse.position.y = 0;
          leaveCorpse(corpse);
          levelGroup.add(corpse);
        }
        setTimeout(() => {
          deathScreen.style.display = 'flex';
          flashEl.style.background = '#000';
          flashEl.style.opacity = '0';
          controls.unlock();
          camera.rotation.x = 0;
          player.dying = 0;
        }, 450);
      }
    }
  }

  return { updatePlayerWakeup, updatePlayerMovement, updatePlayerDeath };
}
