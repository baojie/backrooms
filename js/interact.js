// Interact (E key) handler + corpse helper.
//
// `leaveCorpse(mesh)` tips a mesh supine where it stood; pure mesh
// manipulation, no game-state mutation.
//
// `createInteract(ctx)` returns `tryInteract()` bound to the live game
// state. ctx provides every interactable target plus the helpers needed
// to act on each: boats, elevator, stairs, random-stair warp.
//
// ctx shape:
//   LEVELS, controls, player           — read state
//   getBoats(), getElevator(), getStairExit(), getRandomStair()
//                                       — current level objects (rebuilt
//                                         on each transition; getters
//                                         keep the closure valid)
//   getCurrentLevel()                   — current floor index
//   buildLevel(i)                       — for stair / random-stair warp
//   tryEnterElevator(),
//   isElevatorInTransition()            — bridge to js/elevator.js
//   say, speak, blip                    — audio + subtitles
//   getWinScreen()                      — final-floor exit dialog
//
// `tryInteract()` short-circuits in priority order: boat dismount →
// boat board → elevator → stair → random stair. The first match returns
// and the rest don't run.

export function leaveCorpse(mesh) {
  if (!mesh) return;
  const yaw = mesh.rotation.y + (Math.random() - 0.5) * 0.6;
  // Tip backward 90° around X so the figure falls supine, then yaw randomly.
  mesh.rotation.set(-Math.PI / 2, yaw, (Math.random() - 0.5) * 0.4);
  mesh.position.y = 0.0;
  mesh.userData.corpse = true;
}

export function createInteract(ctx) {
  const {
    LEVELS, controls, player,
    getBoats, getElevator, getStairExit, getRandomStair,
    getCurrentLevel,
    buildLevel,
    tryEnterElevator, isElevatorInTransition,
    say, speak, blip,
    getWinScreen,
  } = ctx;

  return function tryInteract() {
    if (isElevatorInTransition()) return;
    const p = controls.getObject().position;

    // Boats — disembark / board.
    if (player.boat) {
      const b = player.boat;
      b.occupied = false;
      player.boat = null;
      p.x = b.x + Math.cos(b.yaw + Math.PI/2) * 1.2;
      p.z = b.z + Math.sin(b.yaw + Math.PI/2) * 1.2;
      say('下船', 1.2);
      return;
    }
    for (const b of getBoats()) {
      const dx = p.x - b.x, dz = p.z - b.z;
      if (dx*dx + dz*dz < 2.2*2.2) {
        b.occupied = true;
        player.boat = b;
        say('上船 — 再按 E 下船', 1.5);
        blip(560, 0.18, 0.16);
        return;
      }
    }

    const elevator = getElevator();
    if (elevator) {
      const dx = p.x - elevator.pos.x, dz = p.z - elevator.pos.z;
      if (dx*dx + dz*dz < 2.0*2.0) {
        tryEnterElevator();
        return;
      }
    }
    const stairExit = getStairExit();
    if (stairExit) {
      const dx = p.x - stairExit.pos.x, dz = p.z - stairExit.pos.z;
      if (dx*dx + dz*dz < 1.6*1.6) {
        const cur = getCurrentLevel();
        if (cur === LEVELS.length - 1) {
          controls.unlock();
          getWinScreen().style.display = 'flex';
          return;
        }
        blip(660, 0.3, 0.2); blip(990, 0.4, 0.18);
        say('下楼……');
        speak('旁白', '下楼');
        setTimeout(() => buildLevel(cur + 1), 600);
        return;
      }
    }
    const randomStair = getRandomStair();
    if (randomStair) {
      const dx = p.x - randomStair.pos.x, dz = p.z - randomStair.pos.z;
      if (dx*dx + dz*dz < 1.6*1.6) {
        const cur = getCurrentLevel();
        const others = [];
        for (let i = 0; i < LEVELS.length; i++) if (i !== cur) others.push(i);
        if (!others.length) return;
        const target = others[Math.floor(Math.random() * others.length)];
        blip(540, 0.25, 0.2); blip(820, 0.3, 0.18); blip(1180, 0.35, 0.16);
        say(`随机楼层…… ${LEVELS[target].name}`, 2);
        speak('旁白', '随机楼层');
        setTimeout(() => buildLevel(target), 700);
      }
    }
  };
}
