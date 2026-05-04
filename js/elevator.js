// Elevator UI + transition state machine.
//
// `createElevator(ctx)` wires the #elevatorPanel + #floorList DOM, owns
// the per-frame transition state (closing → fadeout → rebuild → fadein
// → opening), and exposes the public surface:
//
//   isOpen()           — panel currently visible?
//   isInTransition()   — between-level animation in progress?
//   open() / close()   — panel show/hide (used by F1, ESC, gotoFloor)
//   gotoFloor(i)       — start the transition to floor `i`; if no
//                        elevator on the current level, fall back to
//                        the cheap immediate buildLevel(i, {spawnAtElevator}).
//   tryEnter()         — used by tryInteract: pull player into cabin,
//                        open the floor panel after 0.7s.
//   tickElevator(dt, t) — call once per frame from the main game loop;
//                        animates doors, drives the phase machine.
//
// Phase 'pulling' is the in-cabin pull; 'closing'/'fadeout'/'rebuild'/
// 'fadein'/'opening' run the cross-floor transition itself.
//
// ctx shape:
//   LEVELS, controls
//   S.elevator       — current elevator object (rebuilt each level)
//   S.currentLevel   — read-only current floor index
//   buildLevel(i, opts) — game's level builder
//   blip, say, speak    — audio + subtitles

export function createElevator(ctx) {
  const {
    S,
    LEVELS, controls,
    buildLevel,
    blip, say, speak,
  } = ctx;

  const elevatorPanel = document.getElementById('elevatorPanel');
  const floorListEl = document.getElementById('floorList');
  const flashEl = document.getElementById('flash');

  // Phases: pulling → closing → fadeout → rebuild → fadein → opening.
  let elevatorTransition = null;

  function isOpen() { return elevatorPanel.style.display === 'flex'; }
  function isInTransition() { return !!elevatorTransition; }

  function open() {
    floorListEl.innerHTML = LEVELS.map((L, i) =>
      `<button data-floor="${i}" class="${i===S.currentLevel?'cur':''}">${i+1}. ${L.name}</button>`
    ).join('');
    elevatorPanel.style.display = 'flex';
    controls.unlock();
  }
  function close() {
    elevatorPanel.style.display = 'none';
    controls.lock();
  }

  function gotoFloor(i) {
    if (i < 0 || i >= LEVELS.length) return;
    if (!elevatorTransition) {
      close();
      if (i === S.currentLevel) return;
      const elevator = S.elevator;
      if (!elevator) { buildLevel(i, { spawnAtElevator: true }); return; }
      elevatorTransition = { phase: 'closing', t: 0, target: i };
      controls.unlock();
      blip(440, 0.3, 0.18);
      say(`电梯前往：${LEVELS[i].name}`, 2);
      speak('旁白', `电梯前往 ${LEVELS[i].name}`);
      return;
    }
    // Already in 'pulling' phase, picked floor → continue from closing.
    if (i === S.currentLevel) {
      elevatorTransition = null;
      controls.lock();
      close();
      return;
    }
    close();
    elevatorTransition.phase = 'closing';
    elevatorTransition.t = 0;
    elevatorTransition.target = i;
    blip(440, 0.3, 0.18);
    say(`电梯前往：${LEVELS[i].name}`, 2);
  }

  floorListEl.addEventListener('click', e => {
    const t = e.target.closest('button');
    if (t) gotoFloor(parseInt(t.dataset.floor, 10));
  });

  function tryEnter() {
    elevatorTransition = { phase: 'pulling', t: 0, target: null };
    controls.unlock();
    blip(880, 0.18, 0.18);
    setTimeout(() => {
      // After 0.7s "pull in", show the panel; gotoFloor continues from there.
      if (elevatorTransition && elevatorTransition.target == null) open();
    }, 700);
  }

  // Animates doors + advances the transition phase each frame.
  function tickElevator(dt, t) {
    const elevator = S.elevator;
    if (elevator) {
      if (elevator.btn) elevator.btn.material.color.setHSL(0.55, 0.8, 0.45 + Math.sin(t*4)*0.2);
      const o = elevator.doorOpen;
      elevator.dL.position.x = elevator.dLBaseX - (1 - o) * elevator.dLBaseX;
      elevator.dR.position.x = elevator.dRBaseX - (1 - o) * elevator.dRBaseX;
    }
    if (!elevatorTransition) return;
    const T = elevatorTransition;
    T.t += dt;
    if (T.phase === 'pulling') {
      const e = S.elevator;
      if (!e) { elevatorTransition = null; return; }
      const targetX = e.pos.x;
      const targetZ = e.pos.z;
      const obj = controls.getObject();
      const a = Math.min(T.t / 0.6, 1);
      obj.position.x += (targetX - obj.position.x) * a * 0.4;
      obj.position.z += (targetZ - obj.position.z) * a * 0.4;
      obj.position.y = 1.7;
      if (T.t > 0.6) { T.phase = 'closing'; T.t = 0; blip(440, 0.3, 0.18); }
    } else if (T.phase === 'closing') {
      const a = Math.min(T.t / 0.7, 1);
      const e = S.elevator;
      if (e) e.doorOpen = 1 - a;
      if (T.t > 0.8) { T.phase = 'fadeout'; T.t = 0; }
    } else if (T.phase === 'fadeout') {
      flashEl.style.opacity = String(Math.min(T.t / 0.6, 1));
      if (T.t > 0.6) {
        T.phase = 'rebuild'; T.t = 0;
        say(`电梯运行中…… → ${LEVELS[T.target].name}`, 1.5);
      }
    } else if (T.phase === 'rebuild') {
      if (T.t > 0.5) {
        try {
          buildLevel(T.target, { spawnAtElevator: true });
        } catch (err) {
          console.error('[elevator] buildLevel failed', err);
        }
        T.phase = 'fadein'; T.t = 0;
      }
    } else if (T.phase === 'fadein') {
      flashEl.style.opacity = String(Math.max(0, 1 - T.t / 0.5));
      if (T.t > 0.5) {
        flashEl.style.opacity = '0';
        T.phase = 'opening'; T.t = 0;
        blip(660, 0.3, 0.18);
      }
    } else if (T.phase === 'opening') {
      const a = Math.min(T.t / 0.9, 1);
      const e = S.elevator;
      if (e) e.doorOpen = a;
      if (T.t > 1.0) {
        flashEl.style.opacity = '0';
        elevatorTransition = null;
        try { controls.lock(); } catch {}
      }
    }
  }

  return { isOpen, isInTransition, open, close, gotoFloor, tryEnter, tickElevator };
}
