// All sound is synthesized with the Web Audio API: no audio files. Safe to import in Node (tests
// pass a fake AudioContext constructor). Nothing is created until the first play(), because browsers
// only allow audio after a user gesture.

const MUTE_KEY = 'storage-wars-muted';

export function createSounds(AudioContextCtor, storage) {
  let ctx = null;
  let muted = false;
  try { muted = storage.getItem(MUTE_KEY) === '1'; } catch { /* storage blocked */ }

  const audio = () => {
    if (!ctx) ctx = new AudioContextCtor();
    if (ctx.state === 'suspended') ctx.resume?.();
    return ctx;
  };

  /** One oscillator note: frequency f (optionally gliding to f2), duration d, delayed by s seconds. */
  function tone(f, type, d, s = 0, v = 0.2, f2) {
    const a = audio();
    const t = a.currentTime + s;
    const o = a.createOscillator();
    const g = a.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
    g.gain.setValueAtTime(v, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + d);
    o.connect(g);
    g.connect(a.destination);
    o.start(t);
    o.stop(t + d);
  }

  /** A burst of fading white noise. */
  function noise(d, v, s = 0) {
    const a = audio();
    const n = Math.max(1, Math.floor(a.sampleRate * d));
    const buf = a.createBuffer(1, n, a.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const src = a.createBufferSource();
    const g = a.createGain();
    g.gain.value = v;
    src.buffer = buf;
    src.connect(g);
    g.connect(a.destination);
    src.start(a.currentTime + s);
  }

  const gavel = (s = 0) => { noise(0.08, 0.4, s); tone(180, 'square', 0.12, s, 0.3, 90); };

  const SOUNDS = {
    click: () => tone(660, 'square', 0.04, 0, 0.05),
    bid: () => tone(520, 'triangle', 0.12, 0, 0.18, 780),
    buyin: () => { tone(880, 'sine', 0.1, 0, 0.2); tone(1320, 'sine', 0.2, 0.08, 0.2); },
    flip: () => { noise(0.12, 0.15); tone(300, 'triangle', 0.1, 0, 0.1, 600); },
    gavel1: () => gavel(),
    gavel2: () => { gavel(); gavel(0.14); },
    sold: () => { noise(0.2, 0.5); tone(120, 'square', 0.3, 0, 0.4, 60); tone(784, 'triangle', 0.5, 0.1, 0.2); tone(1047, 'triangle', 0.5, 0.18, 0.18); },
    fine: () => { tone(220, 'sawtooth', 0.3, 0, 0.25, 110); tone(180, 'sawtooth', 0.45, 0.25, 0.25, 70); },
    revealJunk: () => { tone(300, 'sawtooth', 0.35, 0, 0.15, 120); tone(220, 'sawtooth', 0.5, 0.3, 0.15, 70); },
    revealCommon: () => tone(500, 'triangle', 0.12, 0, 0.2, 900),
    revealValuable: () => { tone(880, 'sine', 0.25, 0, 0.22); tone(1320, 'sine', 0.4, 0.14, 0.22); },
    revealUnique: () => {
      [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 'square', 0.3, i * 0.09, 0.12));
      tone(1047, 'sine', 0.9, 0.5, 0.2);
    },
    revealHavoc: () => { noise(0.6, 0.5); tone(90, 'sawtooth', 0.7, 0, 0.35, 30); tone(660, 'square', 0.15, 0, 0.1, 200); },
    victory: () => {
      [523, 659, 784, 1047].forEach((f, i) => tone(f, 'triangle', 0.35, i * 0.12, 0.2));
      tone(1047, 'sine', 1.2, 0.5, 0.22);
      tone(1319, 'sine', 1.2, 0.5, 0.15);
    },
  };

  return {
    play(name) {
      const fn = SOUNDS[name];
      if (muted || !fn || !AudioContextCtor) return;
      try { fn(); } catch { /* audio blocked or unavailable: the game works without it */ }
    },
    setMuted(value) {
      muted = Boolean(value);
      try { storage.setItem(MUTE_KEY, muted ? '1' : '0'); } catch { /* ignore */ }
    },
    isMuted: () => muted,
  };
}

export const SOUND_NAMES = [
  'click', 'bid', 'buyin', 'flip', 'gavel1', 'gavel2', 'sold', 'fine',
  'revealJunk', 'revealCommon', 'revealValuable', 'revealUnique', 'revealHavoc', 'victory',
];
