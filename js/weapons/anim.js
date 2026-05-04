// Per-frame held-weapon animations + auto-fire trigger.
//
// `createWeaponAnim(ctx)` returns `updateWeaponAnim(dt, t)` bound to
// the live state. Handles:
//   - Knife swing: when player.knifeSwing > 0, drive heldKnifePivot
//     rotation through a sine arc; otherwise idle bob if armed.
//   - Auto-fire: while LMB is held and the active weapon is .auto,
//     re-fire each frame (gun via fireGun, spray via sprayInsecticide).
//   - Mist fade: lower the spray-can mist opacity each frame regardless
//     of whether we sprayed this frame.
//   - Gun recoil + idle bob: animate the active gun's pivot based on
//     player.gunRecoil and a small sine sway when settled.

export function createWeaponAnim(ctx) {
  const {
    WEAPONS, controls, player, heldKnifePivot,
    fireGun, sprayInsecticide,
  } = ctx;

  return function updateWeaponAnim(dt, t) {
    // Knife swing animation
    if (player.knifeSwing > 0) {
      player.knifeSwing = Math.max(0, player.knifeSwing - dt);
      const phase = 1 - player.knifeSwing / 0.35;
      const swing = Math.sin(phase * Math.PI);
      heldKnifePivot.rotation.x = -0.2 - swing * 1.4;
      heldKnifePivot.rotation.z =  0.3 - swing * 0.6;
    } else if (player.hasKnife) {
      heldKnifePivot.rotation.x = -0.2 + Math.sin(t * 1.6) * 0.03;
      heldKnifePivot.rotation.z =  0.3 + Math.sin(t * 1.2) * 0.02;
    }

    // Auto-fire for full-auto weapons while LMB is held.
    const wActive = WEAPONS[player.weapon];
    if (player.mouseHeld && wActive && wActive.auto && controls.isLocked) {
      if (wActive.kind === 'gun') fireGun();
      else if (wActive.kind === 'spray') sprayInsecticide();
    }

    // Mist fades each frame whether or not we sprayed.
    if (WEAPONS.spray && WEAPONS.spray.held.userData.mist) {
      const mm = WEAPONS.spray.held.userData.mist.material;
      mm.opacity = Math.max(0, mm.opacity - dt * 4.5);
    }

    // Gun recoil + idle bob (animates whichever gun is held).
    const gunPivot = wActive && wActive.kind === 'gun' ? wActive.pivot : null;
    if (gunPivot) {
      if (player.gunRecoil > 0) {
        player.gunRecoil = Math.max(0, player.gunRecoil - dt);
        const k = player.gunRecoil / wActive.cooldown;
        gunPivot.rotation.x = -k * wActive.recoilKick;
        gunPivot.position.z = (player.weapon === 'ak47' ? -0.55 : -0.50) + k * 0.06;
      } else {
        gunPivot.rotation.x = Math.sin(t * 1.5) * 0.02;
        gunPivot.position.z = (player.weapon === 'ak47' ? -0.55 : -0.50) + Math.sin(t * 1.2) * 0.005;
      }
    }
  };
}
