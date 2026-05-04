// Weapon firing / impact effects + active rocket projectile updater.
//
// `createWeaponFX(ctx)` factory takes a context object with the live game
// state and returns the firing functions bound to it:
//   fireGun, fireRocket, sprayInsecticide, trySwingKnife, useWeapon,
//   explode, destroyWallsAt, tickRockets
//
// `ctx` shape:
//   THREE          — Three.js namespace
//   WEAPONS        — weapon definition table (keyed by player.weapon)
//   GRID, CELL, WALL_HEIGHT  — level bounds for projectile despawn
//   player, camera, controls, flashEl  — game references
//   entities, companions, wallBoxes, rockets, moths  — mutable arrays
//                    (mutated in place; never reassigned)
//   getLevelGroup(), getWallMeshRef()  — getters because these refs are
//                    rebuilt on every level transition; getter dereference
//                    keeps the closure valid across rebuilds
//   blip, playStatic, say, initAudio   — audio + subtitle helpers
//   playDeathCry, leaveCorpse          — bridge to characters / corpse drop

import * as THREE from 'three';

export function createWeaponFX(ctx) {
  const {
    WEAPONS, GRID, CELL, WALL_HEIGHT,
    player, camera, controls, flashEl,
    entities, companions, wallBoxes, rockets, moths,
    getLevelGroup, getWallMeshRef,
    blip, playStatic, say, initAudio,
    playDeathCry, leaveCorpse,
  } = ctx;

  const _gunRay = new THREE.Raycaster();
  const _gunOrigin = new THREE.Vector2(0, 0);

  function useWeapon() {
    const w = WEAPONS[player.weapon];
    if (!w) return;
    initAudio();   // ensure WebAudio context is running before any blip
    if (w.kind === 'gun') fireGun();
    else if (w.kind === 'melee') trySwingKnife();
    else if (w.kind === 'rocket') fireRocket();
    else if (w.kind === 'spray') sprayInsecticide();
  }

  function sprayInsecticide() {
    const w = WEAPONS.spray;
    const mist = w.held.userData.mist;
    if (mist) {
      mist.material.opacity = 0.65;
      mist.scale.set(1 + Math.random()*0.3, 1 + Math.random()*0.5, 1 + Math.random()*0.3);
    }
    if (!sprayInsecticide._hissT || performance.now() - sprayInsecticide._hissT > 90) {
      blip(2200 + Math.random()*400, 0.06, 0.04);
      sprayInsecticide._hissT = performance.now();
    }
    if (!moths.length) return;
    const camPos = controls.getObject().position;
    const fwd = new THREE.Vector3();
    camera.getWorldDirection(fwd);
    for (const m of moths) {
      if (!m.alive) continue;
      const dx = m.mesh.position.x - camPos.x;
      const dy = m.mesh.position.y - camPos.y;
      const dz = m.mesh.position.z - camPos.z;
      const dist = Math.hypot(dx, dy, dz);
      if (dist > w.range) continue;
      const dot = (dx*fwd.x + dy*fwd.y + dz*fwd.z) / Math.max(0.0001, dist);
      if (dot < w.coneCos) continue;
      m.poison = (m.poison ?? 0) + 0.06;
      if (m.poison > 0.5) m.alive = false;
    }
  }

  function fireGun() {
    const w = WEAPONS[player.weapon];
    if (!w || w.kind !== 'gun') return;
    if (player.gunRecoil > 0) return;
    player.gunRecoil = w.cooldown;
    player.shotsFired++;
    blip(w.soundHi, 0.05, 0.28); blip(w.soundLo, 0.10, 0.20);
    const flash = w.held.userData.flash;
    if (flash) {
      flash.material.opacity = 1.0;
      setTimeout(() => { flash.material.opacity = 0; }, 50);
    }
    flashEl.style.opacity = String(w.flashScreen);
    setTimeout(() => flashEl.style.opacity = '0', 50);

    const targets = [];
    for (const c of companions) if (c.alive && c.mesh) targets.push({ mesh: c.mesh, kind: 'companion', ref: c });
    for (const e of entities) if (e.mesh) targets.push({ mesh: e.mesh, kind: 'entity', ref: e });
    if (!targets.length) return;

    _gunRay.setFromCamera(_gunOrigin, camera);
    _gunRay.far = 80;
    const hits = _gunRay.intersectObjects(targets.map(t => t.mesh), true);
    if (!hits.length) return;

    let obj = hits[0].object;
    let target = null;
    while (obj && !target) {
      target = targets.find(t => t.mesh === obj);
      obj = obj.parent;
    }
    if (!target) return;

    if (target.kind === 'entity') {
      leaveCorpse(target.ref.mesh);
      target.ref.mesh = null;
      player.kills.entities++;
      say('击中怪物！', 1.5);
      playStatic();
      // In-place compaction (don't reassign — closure captures the array reference).
      for (let i = entities.length - 1; i >= 0; i--) {
        if (!entities[i].mesh) entities.splice(i, 1);
      }
    } else {
      target.ref.alive = false;
      leaveCorpse(target.ref.mesh);
      target.ref.mesh = null;
      player.kills.companions++;
      player.sanity = Math.max(0, player.sanity - w.sanityHitCompanion);
      say(`你射杀了 ${target.ref.name}……`, 3);
    }
  }

  function fireRocket() {
    const w = WEAPONS.rocket;
    if (player.gunRecoil > 0) return;
    const levelGroup = getLevelGroup();
    if (!levelGroup) return;
    player.gunRecoil = w.cooldown;
    blip(80, 0.35, 0.45); blip(180, 0.20, 0.30);
    const flash = w.held.userData.flash;
    if (flash) {
      flash.material.opacity = 1.0;
      setTimeout(() => { flash.material.opacity = 0; }, 80);
    }
    flashEl.style.opacity = String(w.flashScreen);
    setTimeout(() => flashEl.style.opacity = '0', 100);

    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    const start = controls.getObject().position.clone();
    start.addScaledVector(dir, 0.9);
    start.y -= 0.05;

    const rocket = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.045, 0.40, 10),
      new THREE.MeshLambertMaterial({ color: 0x666666, emissive: 0x441100, emissiveIntensity: 0.5 })
    );
    body.rotation.x = Math.PI / 2;
    rocket.add(body);
    const tip = new THREE.Mesh(
      new THREE.ConeGeometry(0.045, 0.10, 10),
      new THREE.MeshBasicMaterial({ color: 0xff6644 })
    );
    tip.rotation.x = -Math.PI / 2;
    tip.position.z = -0.25;
    rocket.add(tip);
    const flame = new THREE.PointLight(0xff8033, 3.0, 5, 2);
    flame.position.z = 0.20;
    rocket.add(flame);

    rocket.position.copy(start);
    const lookAt = start.clone().add(dir);
    rocket.lookAt(lookAt);
    levelGroup.add(rocket);

    rockets.push({
      mesh: rocket, pos: start.clone(), dir: dir.clone().normalize(),
      age: 0, light: flame,
    });
  }

  function explode(pos) {
    const levelGroup = getLevelGroup();
    if (!levelGroup) return;
    const radius = WEAPONS.rocket.blastRadius;
    const flashMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.5, 16, 12),
      new THREE.MeshBasicMaterial({ color: 0xfff2a0, transparent: true, opacity: 1.0 })
    );
    flashMesh.position.copy(pos);
    levelGroup.add(flashMesh);
    const blastLight = new THREE.PointLight(0xff8044, 6, 12, 2);
    blastLight.position.copy(pos);
    levelGroup.add(blastLight);
    let age = 0;
    function animate() {
      age += 0.05;
      flashMesh.scale.setScalar(1 + age * 5);
      flashMesh.material.opacity = Math.max(0, 1 - age);
      blastLight.intensity = Math.max(0, 6 - age * 7);
      if (age < 1) requestAnimationFrame(animate);
      else {
        levelGroup.remove(flashMesh);
        levelGroup.remove(blastLight);
        flashMesh.geometry.dispose();
        flashMesh.material.dispose();
      }
    }
    animate();

    blip(45, 0.45, 0.55);
    blip(120, 0.35, 0.40);
    blip(220, 0.25, 0.25);
    playStatic();

    for (let i = entities.length - 1; i >= 0; i--) {
      const e = entities[i];
      if (!e.mesh) continue;
      const d = e.mesh.position.distanceTo(pos);
      if (d < radius) {
        e.hp = (e.hp ?? 1) - WEAPONS.rocket.blastDamage;
        if (e.hp <= 0) {
          leaveCorpse(e.mesh);
          entities.splice(i, 1);
        }
      }
    }
    for (const c of companions) {
      if (!c.alive || !c.mesh) continue;
      if (c.mesh.position.distanceTo(pos) < radius) {
        c.alive = false;
        const m = c.mesh;
        c.mesh = null;
        leaveCorpse(m);
        playDeathCry(c);
      }
    }
    const playerPos = controls.getObject().position;
    const pd = playerPos.distanceTo(pos);
    if (pd < radius) {
      player.hp -= 4000 * (1 - pd / radius);
    }
    destroyWallsAt(pos, radius);
  }

  function destroyWallsAt(pos, radius) {
    const wallMeshRef = getWallMeshRef();
    if (!wallMeshRef) return;
    const r2 = radius * radius;
    const zeroMat = new THREE.Matrix4().makeScale(0.0001, 0.0001, 0.0001);
    let removed = 0;
    for (let i = wallBoxes.length - 1; i >= 0; i--) {
      const wb = wallBoxes[i];
      const dx = wb.x - pos.x, dz = wb.z - pos.z;
      if (dx * dx + dz * dz < r2) {
        wallMeshRef.setMatrixAt(wb.instanceIdx, zeroMat);
        wallBoxes.splice(i, 1);
        removed++;
      }
    }
    if (removed > 0) wallMeshRef.instanceMatrix.needsUpdate = true;
  }

  function trySwingKnife() {
    if (!player.hasKnife || player.knifeSwing > 0) return;
    player.knifeSwing = 0.35;
    blip(420, 0.08, 0.12);
    const reach = 2.2;
    const camDir = new THREE.Vector3();
    camera.getWorldDirection(camDir); camDir.y = 0; camDir.normalize();
    const pp = controls.getObject().position;
    for (const e of entities) {
      if (!e.mesh) continue;
      const v = new THREE.Vector3().subVectors(e.mesh.position, pp);
      const d = v.length();
      if (d > reach) continue;
      v.y = 0; v.normalize();
      if (v.dot(camDir) < 0.4) continue;
      e.hp = (e.hp ?? 1.0) - 0.5;
      e.mesh.position.addScaledVector(camDir, 0.4);
      flashEl.style.opacity = '0.25';
      setTimeout(() => flashEl.style.opacity = '0', 80);
      if (e.hp <= 0) {
        leaveCorpse(e.mesh);
        e.mesh = null;
        say('它退散了……', 2);
        playStatic();
      }
    }
    // In-place compaction (don't reassign — closure captures the array reference).
    for (let i = entities.length - 1; i >= 0; i--) {
      if (!entities[i].mesh) entities.splice(i, 1);
    }
  }

  // Per-frame rocket-projectile update — called from tick(). Advances
  // each rocket along its dir vector, tests for wall / entity / floor /
  // ceiling / out-of-bounds / 4s timeout collision, and detonates via
  // `explode()` on the first hit.
  function tickRockets(dt) {
    if (!rockets.length) return;
    const levelGroup = getLevelGroup();
    for (let i = rockets.length - 1; i >= 0; i--) {
      const r = rockets[i];
      r.age += dt;
      r.pos.addScaledVector(r.dir, 32 * dt);
      r.mesh.position.copy(r.pos);

      let hit = false;
      for (const wb of wallBoxes) {
        const dx = r.pos.x - wb.x, dz = r.pos.z - wb.z;
        if (Math.abs(dx) < wb.half + 0.15 && Math.abs(dz) < wb.half + 0.15) { hit = true; break; }
      }
      if (!hit) {
        for (const e of entities) {
          if (e.mesh && e.mesh.position.distanceTo(r.pos) < 1.0) { hit = true; break; }
        }
      }
      if (r.pos.y < 0.05 || r.pos.y > WALL_HEIGHT) hit = true;
      if (r.age > 4.0) hit = true;
      const limit = (GRID/2) * CELL;
      if (Math.abs(r.pos.x) > limit || Math.abs(r.pos.z) > limit) hit = true;

      if (hit) {
        explode(r.pos.clone());
        if (levelGroup) levelGroup.remove(r.mesh);
        r.mesh.traverse(o => {
          if (o.geometry) o.geometry.dispose();
          if (o.material) o.material.dispose();
        });
        rockets.splice(i, 1);
      }
    }
  }

  return {
    useWeapon, fireGun, fireRocket, sprayInsecticide,
    trySwingKnife, explode, destroyWallsAt, tickRockets,
  };
}
