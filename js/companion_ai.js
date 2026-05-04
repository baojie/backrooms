// Companion AI + per-frame companion update + lazy GLTF upgrade scheduler.
//
// `createCompanionAI(ctx)` factory binds the helpers to the live game
// state and returns:
//   runCompanionKnifeCombat(c, dt, t, rig)
//     — per-companion knife AI: hunt nearest entity, lunge, swing, kill.
//   upgradeEntitiesToGLTF()
//     — swap procedural hostile placeholders → Soldier.glb clones once
//       the GLTF asset has resolved.
//   scheduleGLTFUpgrade()
//     — kick off a per-frame, 3-at-a-time upgrade of every companion
//       from the cheap procedural mesh to the rich Quaternius/Capoeira
//       rig. Spreads the SkeletonUtils.clone cost across many frames so
//       level transitions never freeze.
//   isGLTFUpgradeComplete()
//     — true once every alive companion has been swapped over (used by
//       the headless screenshot mode to know when to snap a frame).
//
// ctx shape:
//   entities, companions       — mutable arrays (mutated in place)
//   getLevelGroup()            — current level group ref (re-derived each
//                                call because levelGroup is rebuilt on
//                                every level transition)
//   isSoldierLoaded()          — Soldier.glb proto availability
//   isGirlLoaded()             — Capoeira-girl FBX availability
//   buildSoldierEntity()       — clones the loaded soldier prototype
//   buildGLTFGirl(c, name, idx)— clones one of the per-girl prototypes
//   attachCompanionKnife(mesh) — re-arms upgraded companions
//   collide(pos, radius)       — wall collision for the lunge step
//   blip, say, speak           — audio + subtitles

export function createCompanionAI(ctx) {
  const {
    THREE,
    entities, companions,
    getLevelGroup, getPool,
    controls,
    isSoldierLoaded, isGirlLoaded,
    buildSoldierEntity, buildGLTFGirl, attachCompanionKnife,
    collide, blip, say, speak,
    pickCompanionLine, getCurrentLevel, MAX_HP, player,
  } = ctx;

  // Companion knife AI — runs for both GLTF girls (rig=null) and
  // procedural companions. Procedural figures get an explicit elbow
  // swing; GLTF arms are already mixer-driven so we only fade the
  // swing-phase timer.
  function runCompanionKnifeCombat(c, dt, _t, rig) {
    if (!c.hasKnife) return;
    let nearest = null, nd = Infinity;
    for (const e of entities) {
      const ddx = e.mesh.position.x - c.mesh.position.x;
      const ddz = e.mesh.position.z - c.mesh.position.z;
      const d2 = ddx*ddx + ddz*ddz;
      if (d2 < nd) { nd = d2; nearest = e; }
    }
    nd = Math.sqrt(nd);
    if (nearest && nd < 3.0) {
      const ax = nearest.mesh.position.x - c.mesh.position.x;
      const az = nearest.mesh.position.z - c.mesh.position.z;
      if (nd > 1.0) {
        c.mesh.position.x += (ax/nd) * 4.5 * dt;
        c.mesh.position.z += (az/nd) * 4.5 * dt;
        collide(c.mesh.position, 0.25);
      }
      c.mesh.rotation.y = Math.atan2(ax, az);
      c.attackCooldown = (c.attackCooldown || 0) - dt;
      if (nd < 1.5 && c.attackCooldown <= 0) {
        c.swingPhase = 1.0;
        c.attackCooldown = 0.55 + Math.random() * 0.25;
        nearest.hp = (nearest.hp ?? 1) - 0.35;
        blip(220, 0.08, 0.10);
        if (nearest.hp <= 0) {
          const idx = entities.indexOf(nearest);
          if (idx >= 0) entities.splice(idx, 1);
          const lg = getLevelGroup();
          if (lg) lg.remove(nearest.mesh);
          const line = `${c.name} 解决了一个！`;
          say(line, 3);
          speak('旁白', line);
          blip(660, 0.2, 0.15); setTimeout(() => blip(990, 0.25, 0.12), 80);
        }
      }
    }
    if (rig && c.swingPhase > 0) {
      const elbowGroup = rig.rightArm.children.find(o => o.isGroup);
      if (elbowGroup) elbowGroup.rotation.x = -1.2 * Math.sin(c.swingPhase * Math.PI);
      c.swingPhase = Math.max(0, c.swingPhase - dt * 4);
      if (c.swingPhase === 0 && elbowGroup) elbowGroup.rotation.x = 0;
    } else if (c.swingPhase > 0) {
      c.swingPhase = Math.max(0, c.swingPhase - dt * 4);
    }
  }

  // Eager swap (called once when Soldier.glb finishes loading).
  function upgradeEntitiesToGLTF() {
    const levelGroup = getLevelGroup();
    if (!isSoldierLoaded() || !levelGroup) return;
    for (const e of entities) {
      if (!e.mesh || e.mesh.userData.gltf) continue;
      const newMesh = buildSoldierEntity();
      if (!newMesh) return;
      const oldPos = e.mesh.position.clone();
      const oldRot = e.mesh.rotation.y;
      levelGroup.remove(e.mesh);
      newMesh.position.copy(oldPos);
      newMesh.rotation.y = oldRot;
      levelGroup.add(newMesh);
      e.mesh = newMesh;
    }
  }

  // Lazy per-frame swap of companions; spreads SkeletonUtils.clone cost.
  let _gltfUpgradeIdx = 0;
  function scheduleGLTFUpgrade() {
    _gltfUpgradeIdx = 0;
    if (!isGirlLoaded()) return;
    function step() {
      const lg = getLevelGroup();
      if (!isGirlLoaded() || !lg) return;
      const budget = 3;   // upgrade up to 3 figures per frame
      let done = 0;
      while (_gltfUpgradeIdx < companions.length && done < budget) {
        const idx = _gltfUpgradeIdx++;
        const c = companions[idx];
        if (c && c.alive && c.mesh && !c.mesh.userData.gltf) {
          const oldPos = c.mesh.position.clone();
          const oldRot = c.mesh.rotation.y;
          // `idx` selects which Quaternius proto to clone so each girl is
          // visually distinct. If that proto isn't ready, buildGLTFGirl
          // falls back to the Capoeira rig.
          const newMesh = buildGLTFGirl(c, c.name, idx);
          if (!newMesh) continue;
          lg.remove(c.mesh);
          c.mesh = newMesh;
          c.mesh.position.copy(oldPos);
          c.mesh.rotation.y = oldRot;
          lg.add(c.mesh);
          if (c.hasKnife) attachCompanionKnife(c.mesh);
          done++;
        }
      }
      if (_gltfUpgradeIdx < companions.length) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  // Used by the headless screenshot mode to wait for the rich rigs to
  // finish swapping in before snapping a frame.
  function isGLTFUpgradeComplete() {
    return _gltfUpgradeIdx >= companions.length;
  }

  // Per-frame companion update — runs once for every alive companion in
  // the formation. Animates the rig (procedural or GLTF), keeps figures
  // out of the sunken pool, drives knife combat, and tracks the
  // player's eyes / mouth for "talking" animation.
  function updateCompanions(dt, t) {
    const pp = controls.getObject().position;
    const pool = getPool ? getPool() : null;
    for (const c of companions) {
      if (!c.alive || !c.mesh) continue;
      // Slow rotation of formation so it feels alive
      c.angle += dt * 0.05;
      let tx = pp.x + Math.cos(c.angle) * c.radius;
      let tz = pp.z + Math.sin(c.angle) * c.radius;
      // Keep companions out of the sunken pool (no swim animation).
      if (pool) {
        const px = tx - pool.x, pz = tz - pool.z;
        if (Math.abs(px) < pool.halfX + 0.5 && Math.abs(pz) < pool.halfZ + 0.5) {
          if (Math.abs(px) / pool.halfX > Math.abs(pz) / pool.halfZ) {
            tx = pool.x + Math.sign(px || 1) * (pool.halfX + 1.2);
          } else {
            tz = pool.z + Math.sign(pz || 1) * (pool.halfZ + 1.2);
          }
        }
      }
      const dx = tx - c.mesh.position.x;
      const dz = tz - c.mesh.position.z;
      const d = Math.hypot(dx, dz);
      let walking = false;
      if (d > 0.4) {
        const sp = Math.min(d * 2.2, 5.0);
        c.mesh.position.x += (dx/d) * sp * dt;
        c.mesh.position.z += (dz/d) * sp * dt;
        collide(c.mesh.position, 0.25);
        c.mesh.rotation.y = Math.atan2(dx, dz);
        walking = d > 0.5;
      }
      // Distance to camera — skip rig animation for far figures.
      const camDx = c.mesh.position.x - pp.x;
      const camDz = c.mesh.position.z - pp.z;
      const camD2 = camDx*camDx + camDz*camDz;
      if (camD2 > 30 * 30) continue;
      // ---- GLTF-rigged feminine girl: drive mixer + walk/idle blend ----
      const gltf = c.mesh.userData.gltf;
      if (gltf) {
        gltf.mixer.update(dt);
        if (gltf.postPose) gltf.postPose();
        const targetWalk = walking ? 1 : 0;
        c._walkBlend = THREE.MathUtils.lerp(c._walkBlend ?? 0, targetWalk, 0.18);
        if (gltf.idleAct) gltf.idleAct.setEffectiveWeight(1 - c._walkBlend);
        if (gltf.walkAct) gltf.walkAct.setEffectiveWeight(c._walkBlend);
        if (gltf.runAct)  gltf.runAct.setEffectiveWeight(0);
        // Talking: head bob + mouth open via the bone-attached face hooks
        if (gltf.headBone) {
          gltf.headBone.rotation.x = c.talking ? Math.sin(t * 14) * 0.10 : gltf.headBone.rotation.x * 0.9;
          const face = gltf.headBone.userData.face;
          if (face) {
            const local = c.mesh.worldToLocal(pp.clone());
            const yaw = THREE.MathUtils.clamp(Math.atan2(local.x, -local.z) * 0.4, -0.35, 0.35);
            if (face.lEyeball) face.lEyeball.rotation.y = yaw;
            if (face.rEyeball) face.rEyeball.rotation.y = yaw;
            if (face.mouth) {
              if (c.talking) {
                const open = 0.5 + Math.abs(Math.sin(t * 18)) * 0.5;
                face.mouth.scale.y = 1 + open * 6;
              } else {
                face.mouth.scale.y += (1 - face.mouth.scale.y) * 0.3;
              }
            }
          }
        }
        runCompanionKnifeCombat(c, dt, t, null);
        continue;
      }
      // ---- Feminine procedural rig animation ----
      const rig = c.mesh.userData.rig;
      if (rig) {
        c.walkPhase += dt * (walking ? 8 : 1.5);
        const sw = walking ? Math.sin(c.walkPhase) * 0.55 : Math.sin(c.walkPhase) * 0.04;
        rig.leftLeg.rotation.x  =  sw;
        rig.rightLeg.rotation.x = -sw;
        rig.leftArm.rotation.x  = -sw * 0.7;
        rig.rightArm.rotation.x =  sw * 0.7;
        if (rig.skirt) rig.skirt.rotation.z = Math.sin(c.walkPhase * 0.6) * 0.05;
        if (rig.hairBack) rig.hairBack.rotation.x = Math.sin(c.walkPhase * 0.7) * 0.08;
        if (rig.torso) {
          const br = 1 + Math.sin(t * 1.4 + c.bobSeed) * 0.03;
          rig.torso.scale.set(br, 1, br * 0.85);
        }
        if (rig.lEyeball && rig.rEyeball) {
          const local = c.mesh.worldToLocal(pp.clone());
          const yaw = THREE.MathUtils.clamp(Math.atan2(local.x, -local.z) * 0.4, -0.35, 0.35);
          rig.lEyeball.rotation.y = yaw;
          rig.rEyeball.rotation.y = yaw;
        }
        if (c.talking) {
          rig.head.rotation.x = Math.sin(t * 12) * 0.08;
          if (rig.lips) rig.lips.scale.y = 1 + Math.abs(Math.sin(t * 16)) * 4;
        } else {
          rig.head.rotation.x *= 0.9;
          if (rig.lips) rig.lips.scale.y += (1 - rig.lips.scale.y) * 0.3;
        }
        runCompanionKnifeCombat(c, dt, t, rig);
      }
    }
  }

  // Periodic companion chatter — every 8–16s pick a living companion
  // and have it say a context-aware line based on nearby entity
  // distance, sanity, hp%, and current floor.
  let companionLineCooldown = 5;
  function tickCompanionChatter(dt) {
    companionLineCooldown -= dt;
    if (companionLineCooldown > 0) return;
    const alive = companions.filter(c => c.alive);
    if (alive.length) {
      const c = alive[Math.floor(Math.random()*alive.length)];
      let nearestEntityDist = Infinity;
      const pp = controls.getObject().position;
      for (const ee of entities) {
        const d = ee.mesh.position.distanceTo(pp);
        if (d < nearestEntityDist) nearestEntityDist = d;
      }
      const raw = pickCompanionLine(c.name, {
        nearestEntityDist,
        sanity: player.sanity,
        hp: player.hp / MAX_HP,
        speedBoost: player.speedBoost,
        currentLevel: getCurrentLevel(),
      });
      const line = `${c.name}：「${raw}」`;
      say(line, 4);
      speak(c.name, line);
    }
    companionLineCooldown = 8 + Math.random()*8;
  }

  return {
    runCompanionKnifeCombat,
    updateCompanions,
    tickCompanionChatter,
    upgradeEntitiesToGLTF,
    scheduleGLTFUpgrade,
    isGLTFUpgradeComplete,
  };
}
