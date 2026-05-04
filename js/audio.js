// Procedural audio: ambient hum + blips + static + heartbeat + death cries.
// All sound here is synthesized with WebAudio — no asset files.
//
// `playDeathCry` needs the TTS layer to vocalise; pass a `speak` callback in.

let audioCtx = null, hum = null, humGain = null;
let lastHeart = 0;

export function initAudio() {
  if (audioCtx) {
    if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
    return audioCtx;
  }
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
  hum = audioCtx.createOscillator();
  hum.type = 'sawtooth';
  hum.frequency.value = 60;
  humGain = audioCtx.createGain();
  humGain.gain.value = 0.04;
  const f = audioCtx.createBiquadFilter();
  f.type = 'lowpass'; f.frequency.value = 400;
  hum.connect(f).connect(humGain).connect(audioCtx.destination);
  hum.start();
  return audioCtx;
}

export function getAudioCtx()   { return audioCtx; }
export function getHumGain()    { return humGain; }

export function blip(freq, dur = 0.2, vol = 0.15) {
  if (!audioCtx) return;
  if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
  const t = audioCtx.currentTime;
  const o = audioCtx.createOscillator();
  o.frequency.setValueAtTime(freq, t);
  const g = audioCtx.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g).connect(audioCtx.destination);
  o.start(); o.stop(t + dur);
}

export function playStatic() {
  if (!audioCtx) return;
  if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
  const buf = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.15, audioCtx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * 0.4;
  const s = audioCtx.createBufferSource();
  s.buffer = buf;
  const g = audioCtx.createGain(); g.gain.value = 0.3;
  s.connect(g).connect(audioCtx.destination);
  s.start();
}

// `sanity` ∈ [0,1]; lower sanity → louder thump.
export function heartbeat(sanity) {
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  const o = audioCtx.createOscillator();
  o.frequency.value = 55;
  const g = audioCtx.createGain();
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(0.6 * (1 - sanity), now + 0.02);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
  o.connect(g).connect(audioCtx.destination);
  o.start(now); o.stop(now + 0.3);
}

export function getLastHeart()      { return lastHeart; }
export function setLastHeart(v)     { lastHeart = v; }

const DEATH_CRIES = [
  '啊——！', '啊啊啊！', '不要——！', '妈呀——！',
  '救命——！', '啊！', '哥——！', '完了——！',
  '别！', '不！', '啊呀——！',
];

// Synthesised vocal "啊!" scream + (optional) TTS cry on top.
// Uses a sawtooth source through three bandpass filters tuned to the
// /a/ vowel formants (F1 ~730 Hz, F2 ~1090 Hz, F3 ~2440 Hz), so it
// sounds like a person screaming "啊" even when TTS is unavailable.
// `speak` is `(speakerName, text, opts) => void` — pass game-side speak() in.
export function playDeathCry(c, speak) {
  // Self-bootstrap: if the user has had at least one gesture, this will
  // succeed; if not, initAudio sets audioCtx and resume() will fire on the
  // next gesture. Either way we don't silently drop the cry.
  initAudio();
  if (audioCtx) {
    if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
    const t0 = audioCtx.currentTime;
    const dur = 0.75;
    const pitchVar = ((c?.bobSeed ?? Math.random()) * 47 % 1);
    const base = 320 + pitchVar * 240;        // 320–560 Hz starting pitch

    // Glottal source — sawtooth + slightly detuned twin for vocal roughness.
    const o = audioCtx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(base * 1.30, t0);
    o.frequency.linearRampToValueAtTime(base * 1.55, t0 + 0.08);    // yelp up
    o.frequency.exponentialRampToValueAtTime(base * 0.55, t0 + dur);
    const detune = audioCtx.createOscillator();
    detune.type = 'sawtooth';
    detune.frequency.value = base * 1.01;

    // Master envelope — fast attack, sustained body, exponential tail.
    const master = audioCtx.createGain();
    master.gain.setValueAtTime(0, t0);
    master.gain.linearRampToValueAtTime(0.85, t0 + 0.04);
    master.gain.linearRampToValueAtTime(0.70, t0 + 0.40);
    master.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    master.connect(audioCtx.destination);

    // Dry mix — keeps the fundamental audible even if all formants attenuate.
    const dryGain = audioCtx.createGain();
    dryGain.gain.value = 0.18;
    o.connect(dryGain); detune.connect(dryGain);
    dryGain.connect(master);

    // /a/ vowel formants (F1/F2/F3) — wider Q so more harmonic energy passes.
    const formants = [
      { freq: 850,  q: 4,  gain: 0.55 },
      { freq: 1300, q: 5,  gain: 0.42 },
      { freq: 2700, q: 6,  gain: 0.25 },
    ];
    for (const f of formants) {
      const bp = audioCtx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = f.freq;
      bp.Q.value = f.q;
      const fg = audioCtx.createGain();
      fg.gain.value = f.gain;
      o.connect(bp); detune.connect(bp);
      bp.connect(fg).connect(master);
    }
    o.start(t0); detune.start(t0);
    o.stop(t0 + dur + 0.05); detune.stop(t0 + dur + 0.05);
  }
  const cry = DEATH_CRIES[Math.floor(Math.random() * DEATH_CRIES.length)];
  if (c && c.name && speak) speak(c.name, cry, { rate: 1.1, pitch: 1.4 });
}
