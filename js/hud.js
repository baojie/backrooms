// HUD bar + readout updates and "press E" interact prompts.
//
// `createHUD(ctx).updateHUD(dt, t, pp)`:
//   - bar widths: stamina, sanity, hp (clamped at 0)
//   - hp numeric readout: "<n> / <MAX_HP>"
//   - distance / almond / weapon / speed-boost summary line
//   - team panel: alive count + average HP
//   - proximity prompts within 1.6m of stair / random stair / 2.0m of
//     elevator, only emitted when the subtitle queue is idle
//
// ctx shape:
//   LEVELS, MAX_HP, TEAM_SIZE
//   WEAPONS                — for weapon name in distance line
//   player, companions     — bar values + team count
//   getStairExit(), getRandomStair(), getElevator(), getCurrentLevel()
//   isElevatorInTransition()
//   say, getSubTimer

export function createHUD(ctx) {
  const {
    LEVELS, MAX_HP, TEAM_SIZE,
    WEAPONS, player, companions,
    getStairExit, getRandomStair, getElevator, getCurrentLevel,
    isElevatorInTransition,
    say, getSubTimer,
  } = ctx;

  const staminaFill = document.getElementById('staminaFill');
  const sanityFill  = document.getElementById('sanityFill');
  const hpFill      = document.getElementById('hpFill');
  const hpNumEl     = document.getElementById('hpNum');
  const distanceEl  = document.getElementById('distance');
  const teamEl      = document.getElementById('team');

  return function updateHUD(_dt, _t, pp) {
    staminaFill.style.width = (player.stamina*100)+'%';
    sanityFill.style.width  = (player.sanity *100)+'%';
    hpFill.style.width      = (Math.max(0,player.hp)/MAX_HP*100)+'%';
    if (hpNumEl) hpNumEl.textContent = `${Math.max(0, Math.ceil(player.hp))} / ${MAX_HP}`;
    distanceEl.textContent =
      '行程：' + Math.floor(player.totalDist) + ' 米　杏仁水：' + player.almondsCollected +
      '　武器：' + WEAPONS[player.weapon].name +
      (player.speedBoost > 0 ? '　加速 ' + player.speedBoost.toFixed(1) + 's' : '');

    const aliveCount = companions.reduce((n, c) => n + (c.alive ? 1 : 0), 0);
    const totalHp = companions.reduce((s, c) => s + (c.alive ? c.hp : 0), 0);
    const avgPct = aliveCount ? Math.round(totalHp / aliveCount * 100) : 0;
    teamEl.innerHTML =
      `<div class="member"><span class="name">队伍</span>` +
      `<span class="bar"><span class="fill" style="width:${avgPct}%"></span></span>` +
      `&nbsp;<b style="color:#fff">${aliveCount}</b> / ${TEAM_SIZE} 存活</div>`;

    const stairExit = getStairExit();
    if (stairExit) {
      const dx = pp.x - stairExit.pos.x, dz = pp.z - stairExit.pos.z;
      if (dx*dx + dz*dz < 1.6*1.6) {
        const tag = getCurrentLevel() === LEVELS.length - 1 ? '逃出后室' : '下一层';
        if (getSubTimer() <= 0) say(`按 E ${tag}`, 0.4);
      }
    }
    const randomStair = getRandomStair();
    if (randomStair) {
      const dx = pp.x - randomStair.pos.x, dz = pp.z - randomStair.pos.z;
      if (dx*dx + dz*dz < 1.6*1.6) {
        if (getSubTimer() <= 0) say('按 E 进入随机楼层', 0.4);
      }
    }
    const elevator = getElevator();
    if (elevator) {
      const dx = pp.x - elevator.pos.x, dz = pp.z - elevator.pos.z;
      if (!isElevatorInTransition() && dx*dx + dz*dz < 2.0*2.0) {
        if (getSubTimer() <= 0) say('按 E 进入电梯', 0.4);
      }
    }
  };
}
