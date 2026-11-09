const BPM = 104;
const STEPS_PER_BAR = 16;
const BARS = 8;
const TOTAL_STEPS = STEPS_PER_BAR * BARS;
const STEP_DURATION = 60 / BPM / 4;
const TARGET_GAIN = 0.22;

const CHORDS = [
  { lead: [69, 72, 76], bass: 45 },
  { lead: [69, 72, 76], bass: 45 },
  { lead: [65, 69, 72], bass: 41 },
  { lead: [65, 69, 72], bass: 41 },
  { lead: [72, 76, 79], bass: 48 },
  { lead: [72, 76, 79], bass: 48 },
  { lead: [67, 71, 74], bass: 43 },
  { lead: [67, 71, 74], bass: 43 }
];

const ARPEGGIO = [0, 1, 2, 1];

function midiToFrequency(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function createMusic() {
  let context = null;
  let master = null;
  let noise = null;
  let timer = 0;
  let nextTime = 0;
  let step = 0;
  let playing = false;

  function ensureNodes(ctx) {
    if (master && context === ctx) return;
    context = ctx;
    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);

    const length = Math.floor(ctx.sampleRate * 0.2);
    noise = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
  }

  function playLead(frequency, time) {
    const oscillator = context.createOscillator();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();

    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(frequency, time);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2600, time);

    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(0.11, time + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.16);

    oscillator.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    oscillator.start(time);
    oscillator.stop(time + 0.18);
  }

  function playBass(frequency, time) {
    const oscillator = context.createOscillator();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();

    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(frequency, time);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(900, time);

    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(0.16, time + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.3);

    oscillator.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    oscillator.start(time);
    oscillator.stop(time + 0.32);
  }

  function playHat(time) {
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();

    source.buffer = noise;
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(7000, time);
    filter.Q.setValueAtTime(0.7, time);

    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(0.035, time + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.045);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    source.start(time);
    source.stop(time + 0.06);
  }

  function playKick(time) {
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(130, time);
    oscillator.frequency.exponentialRampToValueAtTime(48, time + 0.11);

    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(0.18, time + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.14);

    oscillator.connect(gain);
    gain.connect(master);
    oscillator.start(time);
    oscillator.stop(time + 0.16);
  }

  function schedule(absoluteStep, time) {
    const bar = Math.floor(absoluteStep / STEPS_PER_BAR) % BARS;
    const local = absoluteStep % STEPS_PER_BAR;
    const chord = CHORDS[bar];

    if (local % 8 === 0) playKick(time);
    if (local % 4 === 0) playBass(midiToFrequency(chord.bass), time);
    if (local % 2 === 0) {
      const index = ARPEGGIO[(local / 2) % ARPEGGIO.length];
      playLead(midiToFrequency(chord.lead[index]), time);
    }
    if (local % 4 === 2) playHat(time);
  }

  function tick() {
    if (!playing || !context) return;

    if (nextTime < context.currentTime - 0.5) {
      nextTime = context.currentTime + 0.05;
    }

    while (nextTime < context.currentTime + 0.12) {
      schedule(step % TOTAL_STEPS, nextTime);
      nextTime += STEP_DURATION;
      step += 1;
    }
  }

  function start(ctx) {
    if (!ctx) return;
    ensureNodes(ctx);
    if (playing) return;

    playing = true;
    step = 0;
    nextTime = ctx.currentTime + 0.08;

    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setValueAtTime(0, ctx.currentTime);
    master.gain.linearRampToValueAtTime(TARGET_GAIN, ctx.currentTime + 1.2);

    tick();
    timer = setInterval(tick, 25);
  }

  function stop() {
    if (!playing || !context) return;
    playing = false;
    clearInterval(timer);

    master.gain.cancelScheduledValues(context.currentTime);
    master.gain.setValueAtTime(master.gain.value, context.currentTime);
    master.gain.linearRampToValueAtTime(0, context.currentTime + 0.35);
  }

  return { start, stop };
}
