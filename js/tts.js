// Subtitles + TTS (Mandarin only).
// Speech routing: try local Piper HTTP server first, fall back to Web Speech.
// Both paths refuse to speak in non-Mandarin voices.
//
// State:
//   - subtitle DOM lives in the page (id="subtitle")
//   - companions[] is needed so we can flip `talking` flags during speech
//
// Callers must inject `companions` because tts.js doesn't own that array.

let companionsRef = [];
export function setCompanions(arr) { companionsRef = arr; }

const subEl = document.getElementById('subtitle');
let subTimer = 0;

export function say(text, duration = 4) {
  subEl.textContent = text;
  subEl.style.opacity = '1';
  subTimer = duration;
}

export function tickSubtitle(dt) {
  if (subTimer > 0) {
    subTimer -= dt;
    if (subTimer <= 0) subEl.style.opacity = '0';
  }
}
export function getSubTimer() { return subTimer; }

// ---------- Piper sidecar probe ----------
const PIPER_URL = 'http://127.0.0.1:6465';
let piperOK = null;
let currentTTSAudio = null;

(async function probePiper() {
  try {
    const r = await fetch(PIPER_URL + '/health', { method: 'GET' });
    piperOK = r.ok;
  } catch { piperOK = false; }
  console.log('[tts] piper available:', piperOK);
})();

// ---------- Mandarin voice filter ----------
let zhVoices = [];
function isMandarinVoice(v) {
  const lang = (v.lang || '').toLowerCase();
  const name = (v.name || '').toLowerCase();
  if (lang.startsWith('zh-hk') || lang.startsWith('zh-yue') || lang.startsWith('yue')
      || /cantonese|hakka|min nan|wu/.test(name)) return false;
  return lang === 'zh' || lang.startsWith('zh-cn') || lang.startsWith('zh-tw')
      || lang.startsWith('zh-cmn') || lang.startsWith('cmn')
      || /mandarin|普通话|国语|汉语|chinese.*mandarin/i.test(name);
}
function refreshVoices() {
  if (!('speechSynthesis' in window)) return;
  const all = window.speechSynthesis.getVoices();
  zhVoices = all.filter(isMandarinVoice);
  if (zhVoices.length) {
    console.log('[tts] mandarin voices:', zhVoices.map(v => `${v.name} (${v.lang})`));
  } else {
    console.log('[tts] no mandarin voices installed — Web Speech disabled');
  }
}
if ('speechSynthesis' in window) {
  refreshVoices();
  window.speechSynthesis.onvoiceschanged = refreshVoices;
}
function pickVoice(speakerName) {
  if (!zhVoices.length) return null;
  let h = 0; for (const ch of speakerName) h = (h*31 + ch.charCodeAt(0)) & 0xffff;
  return zhVoices[h % zhVoices.length];
}

const SPEAKER_KEY = { '小王': 'xiaowang', '小李': 'xiaoli', '旁白': 'narrator' };

function speakWebSpeech(speakerName, text, opts) {
  if (!('speechSynthesis' in window)) return;
  const voice = pickVoice(speakerName);
  if (!voice || !isMandarinVoice(voice)) return;
  const c = companionsRef.find(x => x.name === speakerName);
  if (c) c.talking = true;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'zh-CN';
  u.voice = voice;
  // Per-name baseline so each girl has a distinct voice…
  let basePitch, baseRate;
  if (speakerName === '旁白') { basePitch = 0.7; baseRate = 0.9; }
  else {
    let h = 0; for (const ch of speakerName) h = (h*31 + ch.charCodeAt(0)) & 0xff;
    basePitch = 0.90 + (h / 255) * 0.70;          // 0.90–1.60
    baseRate  = 0.92 + ((h * 7) & 0xff) / 255 * 0.30; // 0.92–1.22
  }
  // …but explicit opts (e.g. urgent death cry) override.
  u.pitch = opts.pitch ?? basePitch;
  u.rate  = opts.rate  ?? baseRate;
  u.onend = () => { if (c) c.talking = false; };
  u.onerror = () => { if (c) c.talking = false; };
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

export function speak(speakerName, line, opts = {}) {
  const m = line.match(/「(.+)」/);
  const text = m ? m[1] : line;
  const c = companionsRef.find(x => x.name === speakerName);
  if (piperOK) {
    if (c) c.talking = true;
    if (currentTTSAudio) { try { currentTTSAudio.pause(); } catch {} currentTTSAudio = null; }
    const speaker = SPEAKER_KEY[speakerName] || 'default';
    const url = `${PIPER_URL}/tts?speaker=${speaker}&text=${encodeURIComponent(text)}`;
    const a = new Audio(url);
    currentTTSAudio = a;
    a.addEventListener('ended', () => {
      if (c) c.talking = false;
      if (currentTTSAudio === a) currentTTSAudio = null;
    });
    a.addEventListener('error', () => {
      piperOK = false;
      if (c) c.talking = false;
      currentTTSAudio = null;
      speakWebSpeech(speakerName, text, opts);
    });
    a.play().catch(() => {
      piperOK = false;
      if (c) c.talking = false;
      speakWebSpeech(speakerName, text, opts);
    });
    return;
  }
  speakWebSpeech(speakerName, text, opts);
}

export const whispers = [
  '……你不该来这里……',
  '……这些墙不对劲……',
  '……别停下……',
  '……不要回头……',
  '……它知道你的名字……',
  '……我也曾是活人……',
  '……出口在更深处……',
];
