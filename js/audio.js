// Procedural audio: ambient hum + blips + static + heartbeat + death cries.
// All sound here is synthesized with WebAudio — no asset files.
//
// `playDeathCry` needs the TTS layer to vocalise; pass a `speak` callback in.

let audioCtx = null, hum = null, humGain = null;
let lastHeart = 0;

export function initAudio() {
  if (audioCtx) return audioCtx;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
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

// Synthesised scream + (optional) TTS vocal cry.
// `speak` is `(speakerName, text, opts) => void` — pass game-side speak() in.
export function playDeathCry(c, speak) {
  if (audioCtx) {
    const t0 = audioCtx.currentTime;
    const o = audioCtx.createOscillator();
    o.type = 'sawtooth';
    const base = 380 + ((c?.bobSeed ?? 0) * 47 % 1) * 220;
    o.frequency.setValueAtTime(base * 1.4, t0);
    o.frequency.exponentialRampToValueAtTime(base * 0.55, t0 + 0.55);
    const g = audioCtx.createGain();
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(0.30, t0 + 0.04);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.6);
    const f = audioCtx.createBiquadFilter();
    f.type = 'bandpass'; f.frequency.value = base; f.Q.value = 4;
    o.connect(f).connect(g).connect(audioCtx.destination);
    o.start(t0); o.stop(t0 + 0.65);
  }
  const cry = DEATH_CRIES[Math.floor(Math.random() * DEATH_CRIES.length)];
  if (c && c.name && speak) speak(c.name, cry, { rate: 1.1, pitch: 1.4 });
}
