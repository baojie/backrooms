// Per-frame hazard ticks for the swimming-pool level.
//
// `createHazards(ctx)` returns three independent updaters that the main
// game loop calls each frame:
//   updateElectric(dt)  — sparking live-wire patches; instant kill on
//                         contact, electrocutes companions
//   updateMoths(dt)     — fluttering insects with hysteresis-based alert
//                         state; bite player + companions when alerted
//   updateToxic(dt, t)  — bubbling green slime; slow corrosive damage
//                         (800 HP/s for player, 0.5/s for companions)
//
// Each early-returns when its zone array is empty, so non-pool floors
// pay nothing.
//
// ctx shape:
//   GRID, CELL                          — arena bounds for moth clamping
//   controls, player, deathScreen, flashEl  — game refs
//   companions                     — companion roster (read every
//                                         frame so disposeLevel's
//                                         reassignment is invisible to us)
//   S.electricZones, S.toxicZones, S.moths
//                                       — current level's hazard arrays
//   leaveCorpse, playDeathCry           — companion-death helpers
//   playStatic, blip, say, speak        — audio + subtitles

export function createHazards(ctx) {
  const {
    S,
    GRID, CELL,
    controls, player, deathScreen, flashEl, companions,
    leaveCorpse, playDeathCry, playStatic,
    say, speak,
  } = ctx;

  function updateElectric(dt) {
    const electricZones = S.electricZones;
    if (!electricZones.length) return;
    const pp = controls.getObject().position;
    for (const z of electricZones) {
      z.phase += dt * 14;
      const flicker = 0.6 + Math.abs(Math.sin(z.phase)) * 0.9 + Math.random() * 0.3;
      if (z.sparkLight) z.sparkLight.intensity = flicker;
      if (z.disc) z.disc.material.opacity = 0.35 + Math.abs(Math.sin(z.phase * 0.7)) * 0.45;
      if (z.plug) z.plug.material.color.setRGB(1, 1, 0.6 + Math.random() * 0.4);

      const dx = pp.x - z.x, dz = pp.z - z.z;
      if (!player.boat && !player.dying && deathScreen.style.display !== 'flex' && dx*dx + dz*dz < z.r * z.r) {
        player.hp = 0;
        flashEl.style.background = '#cfefff';
        flashEl.style.opacity = '0.85';
        setTimeout(() => { flashEl.style.opacity = '0'; flashEl.style.background = '#000'; }, 180);
        playStatic();
      }
      for (const c of companions) {
        if (!c.alive || !c.mesh) continue;
        const cdx = c.mesh.position.x - z.x, cdz = c.mesh.position.z - z.z;
        if (cdx*cdx + cdz*cdz < z.r * z.r) {
          c.alive = false;
          leaveCorpse(c.mesh);
          c.mesh = null;
          playDeathCry(c);
          const line = `${c.name} 触电了！`;
          say(line, 4);
          speak('旁白', line, { rate: 0.9, pitch: 0.6 });
          playStatic();
        }
      }
    }
  }

  function updateMoths(dt) {
    const moths = S.moths;
    if (!moths.length) return;
    const pp = controls.getObject().position;
    const ALARM_R = 4.5;     // moths only attack when player is within this radius
    for (const m of moths) {
      if (!m.alive) {
        // Drop to the surface and lie there.
        m.mesh.position.y = Math.max(1.08, m.mesh.position.y - dt * 1.8);
        m.mesh.rotation.z += dt * 1.5;
        continue;
      }

      // Decide alert state from player distance.
      const dxP = m.mesh.position.x - pp.x;
      const dzP = m.mesh.position.z - pp.z;
      const playerD2 = dxP*dxP + dzP*dzP;
      // Hysteresis: alert at 4.5m, calm down past 7m.
      if (!m.alerted && playerD2 < ALARM_R * ALARM_R)            m.alerted = true;
      else if (m.alerted && playerD2 > (ALARM_R + 2.5) * (ALARM_R + 2.5)) m.alerted = false;

      // Wing flap — slow lazy beat at rest, fast frantic beat when alerted.
      m.phase += dt * (m.alerted ? 22 : 4);
      const flap = Math.sin(m.phase) * (m.alerted ? 1.0 : 0.25);
      if (m.wL) m.wL.rotation.z =  flap;
      if (m.wR) m.wR.rotation.z = -flap;

      // Resting: glide back toward the perch and face outward; skip chase + bite.
      if (!m.alerted) {
        const rx = m.perchX - m.mesh.position.x;
        const ry = m.perchY - m.mesh.position.y;
        const rz = m.perchZ - m.mesh.position.z;
        m.mesh.position.x += rx * Math.min(1, dt * 3);
        m.mesh.position.y += ry * Math.min(1, dt * 3);
        m.mesh.position.z += rz * Math.min(1, dt * 3);
        m.mesh.rotation.y = m.perchYaw;
        m.vx = 0; m.vz = 0;
        continue;
      }

      // Steer toward the nearest target (player by default, or nearest companion if closer).
      let tx = pp.x, ty = pp.y, tz = pp.z;
      let bestD = (m.mesh.position.x - pp.x)**2 + (m.mesh.position.z - pp.z)**2;
      for (const c of companions) {
        if (!c.alive || !c.mesh) continue;
        const d = (m.mesh.position.x - c.mesh.position.x)**2 + (m.mesh.position.z - c.mesh.position.z)**2;
        if (d < bestD) {
          bestD = d;
          tx = c.mesh.position.x; ty = 1.6; tz = c.mesh.position.z;
        }
      }
      const dx = tx - m.mesh.position.x;
      const dz = tz - m.mesh.position.z;
      const d = Math.hypot(dx, dz) || 1;
      const homing = 1.6;
      m.vx += (dx / d) * homing * dt + (Math.random()-0.5) * 1.6 * dt;
      m.vz += (dz / d) * homing * dt + (Math.random()-0.5) * 1.6 * dt;
      // Cap speed.
      const sp = Math.hypot(m.vx, m.vz);
      const maxSp = 2.4;
      if (sp > maxSp) { m.vx = m.vx / sp * maxSp; m.vz = m.vz / sp * maxSp; }
      m.mesh.position.x += m.vx * dt;
      m.mesh.position.z += m.vz * dt;
      m.mesh.position.y += Math.sin(m.phase * 0.4) * dt * 0.6;
      // Keep within level + reasonable height.
      const limit = (GRID/2)*CELL - 1;
      m.mesh.position.x = Math.max(-limit, Math.min(limit, m.mesh.position.x));
      m.mesh.position.z = Math.max(-limit, Math.min(limit, m.mesh.position.z));
      m.mesh.position.y = Math.max(1.3, Math.min(2.4, m.mesh.position.y));
      m.mesh.lookAt(tx, m.mesh.position.y, tz);

      // Bite player.
      m.biteTimer = Math.max(0, (m.biteTimer ?? 0) - dt);
      const pdx = m.mesh.position.x - pp.x;
      const pdy = m.mesh.position.y - pp.y;
      const pdz = m.mesh.position.z - pp.z;
      if (!player.dying && deathScreen.style.display !== 'flex' && pdx*pdx + pdy*pdy + pdz*pdz < 0.7*0.7) {
        if (m.biteTimer <= 0) {
          player.hp -= 80;        // moth bite: 80 HP per bite
          m.biteTimer = 0.6;
          flashEl.style.background = '#603030';
          flashEl.style.opacity = '0.25';
          setTimeout(() => { flashEl.style.opacity = '0'; flashEl.style.background = '#000'; }, 100);
        }
      }
      // Bite companions.
      for (const c of companions) {
        if (!c.alive || !c.mesh) continue;
        const cdx = m.mesh.position.x - c.mesh.position.x;
        const cdz = m.mesh.position.z - c.mesh.position.z;
        if (cdx*cdx + cdz*cdz < 0.7*0.7) {
          c.hp = (c.hp ?? 1) - dt * 0.25;
          if (c.hp <= 0) {
            c.alive = false;
            leaveCorpse(c.mesh);
            c.mesh = null;
            playDeathCry(c);
            const line = `${c.name} 被飞蛾啃噬倒下了……`;
            say(line, 4);
            speak('旁白', line, { rate: 0.85, pitch: 0.55 });
            playStatic();
          }
        }
      }
    }
  }

  function updateToxic(dt, t) {
    const toxicZones = S.toxicZones;
    if (!toxicZones.length) return;
    const pp = controls.getObject().position;
    for (const z of toxicZones) {
      for (const b of z.bubbles) {
        b.mesh.position.y = b.baseY + Math.sin(t * 2.4 + b.seed) * 0.06;
      }
      const dx = pp.x - z.x, dz = pp.z - z.z;
      if (!player.boat && !player.dying && deathScreen.style.display !== 'flex' && dx*dx + dz*dz < z.r * z.r) {
        player.hp -= dt * 800;    // toxic water: 800 HP/s (~12.5s death)
        flashEl.style.background = '#3aa030';
        flashEl.style.opacity = '0.35';
        setTimeout(() => { flashEl.style.opacity = '0'; flashEl.style.background = '#000'; }, 140);
      }
      for (const c of companions) {
        if (!c.alive || !c.mesh) continue;
        const cdx = c.mesh.position.x - z.x, cdz = c.mesh.position.z - z.z;
        if (cdx*cdx + cdz*cdz < z.r * z.r) {
          c.hp = (c.hp ?? 1) - dt * 0.5;
          if (c.hp <= 0) {
            c.alive = false;
            leaveCorpse(c.mesh);
            c.mesh = null;
            playDeathCry(c);
            const line = `${c.name} 中毒倒下了……`;
            say(line, 4);
            speak('旁白', line, { rate: 0.85, pitch: 0.55 });
            playStatic();
          }
        }
      }
    }
  }

  return { updateElectric, updateMoths, updateToxic };
}
