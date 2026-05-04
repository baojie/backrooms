// Welcome / death / win overlays + game-state reset.
//
// `setupOverlay(ctx)` wires the DOM elements (#overlay, #deathScreen,
// #winScreen) to their click handlers, registers the pointer-lock
// listeners that re-show the welcome screen (only on first session),
// and binds F1 to bring the overlay back on demand.
//
// Returns `{ startGame, resetAll }` so the keyboard handler in
// index.html can call them on Enter / death-screen click.

export function setupOverlay(ctx) {
  const {
    controls, camera, player, companions, MAX_HP,
    setWeapon, buildLevel, isElevatorOpen,
  } = ctx;

  const overlay = document.getElementById('overlay');
  const deathScreen = document.getElementById('deathScreen');
  const winScreen = document.getElementById('winScreen');

  // Welcome overlay only auto-shows on first launch. After the player
  // dismisses it once, ESC / floor transitions / elevator-unlock no
  // longer pop it back up. F1 brings it back on demand.
  let welcomeDismissed = false;

  function startGame() {
    overlay.style.display = 'none';
    welcomeDismissed = true;
    try { controls.lock(); } catch (err) { console.warn('[lock] failed', err); }
  }
  overlay.addEventListener('click', startGame);
  deathScreen.addEventListener('click', () => {
    resetAll();
    deathScreen.style.display = 'none';
    try { controls.lock(); } catch (err) { console.warn('[lock] failed', err); }
  });
  winScreen.addEventListener('click', () => {
    resetAll();
    winScreen.style.display = 'none';
    try { controls.lock(); } catch (err) { console.warn('[lock] failed', err); }
  });
  document.addEventListener('pointerlockerror', () => {
    console.warn('[pointerlock] denied — click the canvas to retry');
  });

  controls.addEventListener('lock', () => {
    overlay.style.display = 'none';
    welcomeDismissed = true;
  });
  controls.addEventListener('unlock', () => {
    if (welcomeDismissed) return;
    if (deathScreen.style.display !== 'flex'
        && winScreen.style.display !== 'flex'
        && !isElevatorOpen())
      overlay.style.display = 'flex';
  });

  addEventListener('keydown', e => {
    if (e.code === 'F1') {
      e.preventDefault();
      overlay.style.display = 'flex';
      try { controls.unlock(); } catch {}
    }
  });

  function resetAll() {
    player.hp = MAX_HP; player.sanity = 1; player.stamina = 1;
    player.flashlightBattery = 1; player.flashlightOn = false;
    player.totalDist = 0; player.speedBoost = 0; player.almondsCollected = 0;
    player.hasKnife = true; player.knifeSwing = 0;
    player.gunRecoil = 0; player.shotsFired = 0;
    player.kills = { entities: 0, companions: 0 };
    player.dying = 0;
    player.lyingDown = false;
    player.standingUp = null;
    player.hasWokenUp = true;
    camera.rotation.x = 0;
    setWeapon('pistol');
    for (const c of companions) { c.hp = 1; c.alive = true; }
    buildLevel(0);
  }

  return { startGame, resetAll, overlay, deathScreen, winScreen };
}
