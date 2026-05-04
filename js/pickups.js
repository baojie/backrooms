// Per-frame pickup proximity scans: almond water, knives, medkits.
//
// Each pickup mesh hovers + spins on its own axis; when the player gets
// within 0.7m the pickup is consumed (alive=false, removed from
// levelGroup) and the corresponding player effect is applied:
//   almond  — sanity +35%, 8s speed boost, almondsCollected++
//   knife   — player.hasKnife = true, heldKnifePivot.visible = true
//   medkit  — restore 3000 HP (capped at MAX_HP)
//
// `createPickups(ctx)` returns `updatePickups(dt, t)` bound to the live
// game state. ctx provides the arrays via getter (rebuilt per level)
// plus the helpers needed for each effect.

export function createPickups(ctx) {
  const {
    S,
    controls, player, MAX_HP, heldKnifePivot,
    say, blip,
  } = ctx;

  return function updatePickups(dt, t) {
    const pp = controls.getObject().position;
    const levelGroup = S.levelGroup;

    // Almond water — sanity restore + speed boost.
    if (player.speedBoost > 0) player.speedBoost = Math.max(0, player.speedBoost - dt);
    for (const a of S.almonds) {
      if (!a.alive) continue;
      a.mesh.rotation.y += dt * 1.5;
      a.mesh.position.y = a.baseY + Math.sin(t * 2 + a.seed) * 0.06;
      const dx = a.mesh.position.x - pp.x;
      const dz = a.mesh.position.z - pp.z;
      if (dx*dx + dz*dz < 0.7*0.7) {
        a.alive = false;
        if (levelGroup) { levelGroup.remove(a.mesh); levelGroup.remove(a.glow); }
        player.sanity = Math.min(1, player.sanity + 0.35);
        player.speedBoost = 8;
        player.almondsCollected++;
        say('饮下杏仁水。理智 +35%　速度 +45%（8秒）', 3);
        blip(880, 0.18, 0.18); setTimeout(()=>blip(1320, 0.2, 0.15), 80);
      }
    }
    // Knife — give the player melee.
    for (const k of S.knives) {
      if (!k.alive) continue;
      k.mesh.rotation.y += dt * 2;
      k.mesh.position.y = k.baseY + Math.sin(t * 2.5 + k.seed) * 0.08;
      const dx = k.mesh.position.x - pp.x;
      const dz = k.mesh.position.z - pp.z;
      if (dx*dx + dz*dz < 0.7*0.7) {
        k.alive = false;
        if (levelGroup) { levelGroup.remove(k.mesh); levelGroup.remove(k.glow); }
        player.hasKnife = true;
        heldKnifePivot.visible = true;
        say('拾起刀。空格 / 左键 挥砍', 3);
        blip(660, 0.15, 0.18); setTimeout(()=>blip(990, 0.18, 0.15), 60);
      }
    }
    // Medkits — restore 3000 HP each.
    for (const m of S.medkits) {
      if (!m.alive) continue;
      m.mesh.rotation.y += dt * 1.2;
      m.mesh.position.y = m.baseY + Math.sin(t * 2.2 + m.seed) * 0.06;
      const dx = m.mesh.position.x - pp.x;
      const dz = m.mesh.position.z - pp.z;
      if (dx*dx + dz*dz < 0.7*0.7 && player.hp < MAX_HP) {
        const heal = Math.min(3000, MAX_HP - player.hp);
        m.alive = false;
        if (levelGroup) { levelGroup.remove(m.mesh); levelGroup.remove(m.glow); }
        player.hp = Math.min(MAX_HP, player.hp + 3000);
        say(`使用医药包。HP +${Math.ceil(heal)}`, 2.5);
        blip(720, 0.15, 0.18); setTimeout(()=>blip(1080, 0.18, 0.15), 60);
      }
    }
  };
}
