// The mutable `player` state record + the `setWeapon` switcher.
//
// `MAX_HP` and `createPlayerState()` are exported so the constants live
// in one place. `createSetWeapon({ player, WEAPONS, WEAPON_ORDER, say })`
// returns the weapon switcher closure, which:
//   - validates the requested weapon exists in WEAPONS
//   - flips player.weapon to the new key
//   - toggles each weapon-pivot's visibility (only the active one shows)
//   - announces the swap via the subtitle queue

export const MAX_HP = 10000;

export function createPlayerState(THREE) {
  return {
    hp: MAX_HP, sanity: 1.0, stamina: 1.0,
    flashlightOn: false, flashlightBattery: 1.0,
    totalDist: 0,
    speedBoost: 0,
    almondsCollected: 0,
    hasKnife: true,           // always equipped — selectable in weapon menu
    knifeSwing: 0,
    dying: 0,                 // 0..1 death animation progress
    gunRecoil: 0,
    shotsFired: 0,
    kills: { entities: 0, companions: 0 },
    weapon: 'pistol',
    mouseHeld: false,
    lastPos: new THREE.Vector3(),
  };
}

export function createSetWeapon({ player, WEAPONS, WEAPON_ORDER, say }) {
  return function setWeapon(name) {
    if (!WEAPONS[name]) return;
    player.weapon = name;
    for (const k of WEAPON_ORDER) WEAPONS[k].pivot.visible = (k === name);
    say(`武器：${WEAPONS[name].name}`, 1.5);
  };
}
