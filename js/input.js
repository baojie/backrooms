// Keyboard + mouse input handlers.
//
// `setupInput(ctx)` registers `keydown`, `keyup`, `mousedown`, `mouseup`
// on `window` and wires them to the game's actions:
//   - Elevator panel: ESC closes, Digit1–9 / Digit0 pick a floor
//   - Enter: dismiss start / death / win screens
//   - Shift+digit: jump to floor 1–9 (Shift+0 = floor 10)
//   - WASD: move (only the `keys` map is updated; movement runs in tick)
//   - F: toggle flashlight
//   - E: tryInteract
//   - 1–5 / Q: weapon select / cycle
//   - Space: fire current weapon
//   - Mouse left: fire (if pointer-locked) or re-acquire pointer lock
//
// Returns the same `keys` object the game loop reads from for movement.

export function setupInput(ctx) {
  const {
    LEVELS, WEAPON_ORDER, controls, player,
    overlay, deathScreen, winScreen,
    isElevatorOpen, closeElevator, gotoFloor,
    startGame, tryInteract,
    setWeapon, useWeapon,
    keys,
  } = ctx;

  addEventListener('keydown', e => {
    if (isElevatorOpen()) {
      if (e.code === 'Escape') { closeElevator(); return; }
      if (e.code >= 'Digit1' && e.code <= 'Digit9') {
        gotoFloor(parseInt(e.code.slice(5), 10) - 1); return;
      }
      if (e.code === 'Digit0') { gotoFloor(9); return; }
      return;
    }
    if (e.code === 'Enter') {
      if (overlay.style.display !== 'none') { startGame(); return; }
      if (deathScreen.style.display === 'flex') { deathScreen.click(); return; }
      if (winScreen.style.display === 'flex') { winScreen.click(); return; }
    }
    // Shift + digit: jump to floor (1-9 → floor 1-9, 0 → floor 10)
    if (e.shiftKey && e.code >= 'Digit0' && e.code <= 'Digit9') {
      const d = parseInt(e.code.slice(5), 10);
      const idx = d === 0 ? 9 : d - 1;
      if (idx < LEVELS.length) { e.preventDefault(); gotoFloor(idx); return; }
    }
    keys[e.code] = true;
    if (e.code === 'KeyF') player.flashlightOn = !player.flashlightOn;
    if (e.code === 'KeyE') tryInteract();
    if (e.code === 'Digit1') setWeapon('pistol');
    else if (e.code === 'Digit2') setWeapon('ak47');
    else if (e.code === 'Digit3') setWeapon('knife');
    else if (e.code === 'Digit4') setWeapon('rocket');
    else if (e.code === 'Digit5') setWeapon('spray');
    else if (e.code === 'KeyQ') {
      const idx = WEAPON_ORDER.indexOf(player.weapon);
      setWeapon(WEAPON_ORDER[(idx + 1) % WEAPON_ORDER.length]);
    }
    if (e.code === 'Space') { e.preventDefault(); useWeapon(); }
  });
  addEventListener('keyup', e => {
    keys[e.code] = false;
  });
  addEventListener('mousedown', e => {
    if (e.button !== 0) return;
    if (controls.isLocked) {
      player.mouseHeld = true;
      useWeapon();
      return;
    }
    if (overlay.style.display === 'none'
        && deathScreen.style.display !== 'flex'
        && winScreen.style.display !== 'flex'
        && !isElevatorOpen()) {
      try { controls.lock(); } catch {}
    }
  });
  addEventListener('mouseup', e => {
    if (e.button === 0) player.mouseHeld = false;
  });
}
