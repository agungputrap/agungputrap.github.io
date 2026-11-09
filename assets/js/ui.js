import { createMusic } from './music.js';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

const yearElement = document.getElementById('year');
if (yearElement) yearElement.textContent = String(new Date().getFullYear());

const BOOT_KEY = 'ap.boot';
const SOUND_KEY = 'ap.sound';
const INTERACTIVE = 'a[href], button';

function readSession(key) {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeSession(key, value) {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    /* storage unavailable, boot screen still shows once per load */
  }
}

function showBootScreen() {
  if (reducedMotion.matches || readSession(BOOT_KEY)) return;
  writeSession(BOOT_KEY, '1');

  const overlay = document.createElement('div');
  overlay.className = 'boot';
  overlay.setAttribute('aria-hidden', 'true');
  overlay.innerHTML = '<p class="boot__text">PRESS START<span class="boot__cursor"></span></p>';
  document.body.appendChild(overlay);

  let finished = false;
  let timer = 0;

  function finish() {
    if (finished) return;
    finished = true;
    clearTimeout(timer);
    document.removeEventListener('keydown', onKey, true);
    document.removeEventListener('pointerdown', finish, true);
    overlay.classList.add('is-leaving');
    setTimeout(() => overlay.remove(), 220);
  }

  function onKey(event) {
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'Escape') finish();
  }

  document.addEventListener('keydown', onKey, true);
  document.addEventListener('pointerdown', finish, true);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) finish();
  }, { once: true });

  timer = setTimeout(finish, 1200);
}

const soundToggle = document.getElementById('sound-toggle');
const AudioContextClass = window.AudioContext || window.webkitAudioContext;
const music = createMusic();

let soundEnabled = (() => {
  try {
    const stored = localStorage.getItem(SOUND_KEY);
    return stored === null ? true : stored === '1';
  } catch {
    return true;
  }
})();

let audioContext = null;
let audioUnlocked = false;

function ensureContext() {
  if (audioContext) {
    if (audioContext.state === 'suspended') audioContext.resume();
    return audioContext;
  }
  if (!AudioContextClass) return null;
  try {
    audioContext = new AudioContextClass();
  } catch {
    return null;
  }
  return audioContext;
}

function blip(frequency, duration, delay = 0) {
  if (!soundEnabled || !audioUnlocked) return;
  const context = ensureContext();
  if (!context) return;

  const start = context.currentTime + delay;
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = 'square';
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(0.04, start + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
}

function unlockAudio() {
  if (audioUnlocked) return;
  audioUnlocked = true;
  if (!soundEnabled) return;
  const context = ensureContext();
  if (context) music.start(context);
}

if (soundToggle) {
  const renderToggle = () => {
    soundToggle.textContent = soundEnabled ? 'AUDIO: ON' : 'AUDIO: OFF';
    soundToggle.setAttribute('aria-pressed', String(soundEnabled));
  };

  renderToggle();

  soundToggle.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    try {
      localStorage.setItem(SOUND_KEY, soundEnabled ? '1' : '0');
    } catch {
      /* preference not persisted */
    }
    renderToggle();

    if (soundEnabled) {
      audioUnlocked = true;
      const context = ensureContext();
      if (context) music.start(context);
      blip(330, 0.08);
    } else {
      music.stop();
    }
  });
}

document.addEventListener('pointerdown', unlockAudio, { once: true, capture: true, passive: true });
document.addEventListener('keydown', unlockAudio, { once: true, capture: true });

document.addEventListener('pointerover', (event) => {
  const target = event.target.closest(INTERACTIVE);
  if (!target || !audioUnlocked) return;
  if (event.relatedTarget && target.contains(event.relatedTarget)) return;
  blip(660, 0.04);
});

document.addEventListener('click', (event) => {
  const target = event.target.closest(INTERACTIVE);
  if (!target || target === soundToggle) return;
  unlockAudio();
  blip(660, 0.05);
  blip(990, 0.09, 0.05);
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    music.stop();
  } else if (soundEnabled && audioUnlocked) {
    music.start(audioContext);
  }
});

showBootScreen();
