// Per-frame atmospheric updates: sanity, HP regen, heartbeat, whispers,
// stair pillar pulse.
//
// `createAtmosphere(ctx).updateAtmosphere(dt, t)` does:
//   - light proximity scan → `inLight` (sanity bonus)
//   - fear proximity from nearest entity → drives sanity drain + heartbeat
//   - sanity drift, HP regen (when no fear)
//   - heartbeat scheduling + ambient hum gain modulated by sanity
//   - whisper subtitle on a low-probability dt-scaled roll
//   - stair pulse: regular stair gentle scale, random stair faster +
//     hue shift to differentiate it
//
// ctx shape:
//   THREE
//   controls, player, MAX_HP
//   getEntities(), getLights(), getStairExit(), getRandomStair()
//   whispers
//   getAudioCtx, getHumGain, getLastHeart, setLastHeart, heartbeat
//   say, speak

export function createAtmosphere(ctx) {
  const {
    THREE,
    controls, player, MAX_HP,
    getEntities, getLights, getStairExit, getRandomStair,
    whispers,
    getAudioCtx, getHumGain, getLastHeart, setLastHeart, heartbeat,
    say, speak,
  } = ctx;

  return function updateAtmosphere(dt, t) {
    const pp = controls.getObject().position;
    const lights = getLights();
    const entities = getEntities();

    // Light flicker (level-spawned fluorescents): random brightness wobble
    // + occasional dropouts, panel surface tint follows the bulb.
    let nearestLightDist = Infinity;
    for (const L of lights) {
      if (L.broken) { L.light.intensity = 0; continue; }
      const f = 0.85 + Math.sin(t * 30 + L.seed) * 0.05 + (Math.random() < 0.005 ? -0.6 : 0);
      L.light.intensity = L.base * Math.max(0.1, f);
      if (L.panel && L.panel.material && L.panel.material.color)
        L.panel.material.color.setRGB(0.95 * f, 0.9 * f, 0.6 * f);
      const d = L.light.position.distanceTo(pp);
      if (d < nearestLightDist) nearestLightDist = d;
    }
    const inLight = nearestLightDist < 5;
    const fearProx = entities.length
      ? THREE.MathUtils.clamp(1 - entities[0].mesh.position.distanceTo(pp)/18, 0, 1)
      : 0;
    player.sanity -= dt * (0.010 + fearProx * 0.05);
    if (inLight) player.sanity += dt * 0.02;
    player.sanity = THREE.MathUtils.clamp(player.sanity, 0, 1);

    // HP slowly regenerates when no entity is breathing down your neck.
    if (fearProx < 0.25 && player.hp < MAX_HP) {
      player.hp = Math.min(MAX_HP, player.hp + dt * MAX_HP * 0.02);
    }

    const _ac = getAudioCtx();
    if (_ac) {
      const interval = 1.6 - fearProx * 1.0;
      if (t - getLastHeart() > interval) { heartbeat(player.sanity); setLastHeart(t); }
      const _hg = getHumGain();
      if (_hg) _hg.gain.value = 0.04 + (1 - player.sanity) * 0.06;
    }

    if (Math.random() < dt * 0.05 * (1 - player.sanity + fearProx)) {
      const w = whispers[Math.floor(Math.random()*whispers.length)];
      say(w, 3);
      speak('旁白', w, { rate: 0.85, pitch: 0.6 });
    }

    const stairExit = getStairExit();
    if (stairExit && stairExit.pillar) {
      const sc = 1 + Math.sin(t * 3) * 0.1;
      stairExit.pillar.scale.set(1, sc, 1);
    }
    const randomStair = getRandomStair();
    if (randomStair && randomStair.pillar) {
      // Slightly faster pulse + hue shift so it stands out from the regular stair.
      const sc = 1 + Math.sin(t * 4.5) * 0.12;
      randomStair.pillar.scale.set(1, sc, 1);
      randomStair.pillar.material.color.setHSL(0.75 + Math.sin(t * 1.3) * 0.05, 0.7, 0.55);
    }
  };
}
