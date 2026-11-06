import test from 'node:test';
import assert from 'node:assert/strict';
import { createVoice } from '../client/js/ui/voice.js';

function fakes({ voices = [], playFails = false } = {}) {
  const spoken = [];
  const played = [];
  const synth = { cancelled: 0, getVoices: () => voices, cancel() { this.cancelled++; }, speak(u) { spoken.push(u); } };
  class Utterance { constructor(text) { this.text = text; } }
  class Audio {
    constructor(src) { this.src = src; this.paused = true; this.currentTime = 0; }
    play() { played.push(this.src); return playFails ? Promise.reject(new Error('blocked')) : Promise.resolve(); }
    pause() { this.paused = true; }
  }
  return { synth, Utterance, Audio, spoken, played };
}
const make = (f, muted = false) => createVoice({ synth: f.synth, Utterance: f.Utterance, Audio: f.Audio, isMuted: () => muted });

test('a clip is played from its audio file when there is one', () => {
  const f = fakes();
  make(f).say({ clip: 'sold', text: 'Sold!' });
  assert.deepEqual(f.played, ['audio/sold.mp3']);
  assert.equal(f.spoken.length, 0);
});

test('if the audio file cannot play, the browser voice says it instead', async () => {
  const f = fakes({ playFails: true });
  make(f).say({ clip: 'sold', text: 'Sold!', pitch: 1.4, rate: 0.9, volume: 1 });
  await new Promise((r) => setTimeout(r, 0));
  assert.equal(f.spoken.length, 1);
  assert.deepEqual([f.spoken[0].text, f.spoken[0].pitch, f.spoken[0].rate, f.spoken[0].volume], ['Sold!', 1.4, 0.9, 1]);
});

test('without audio support the browser voice is used right away', () => {
  const f = fakes();
  createVoice({ synth: f.synth, Utterance: f.Utterance, Audio: undefined, isMuted: () => false }).say({ clip: 'sold', text: 'Sold!', pitch: 1.2 });
  assert.equal(f.spoken.length, 1);
  assert.equal(f.synth.cancelled, 1);
});

test('a new announcement cuts off the previous clip', () => {
  const f = fakes();
  const voice = make(f);
  voice.say({ clip: 'sold', text: 'Sold!' });
  voice.say({ clip: 'sold-fat-fah', text: 'Sold to fat fah!' });
  assert.deepEqual(f.played, ['audio/sold.mp3', 'audio/sold-fat-fah.mp3']);
});

test('a muted game stays silent', () => {
  const f = fakes();
  make(f, true).say({ clip: 'sold', text: 'Sold!' });
  assert.equal(f.played.length + f.spoken.length, 0);
});

test('a clear English male voice is preferred for the speech fallback', () => {
  const voices = [{ name: 'Samantha', lang: 'en-US' }, { name: 'Google UK English Male', lang: 'en-GB' }, { name: 'Anna', lang: 'de-DE' }];
  const f = fakes({ voices });
  createVoice({ synth: f.synth, Utterance: f.Utterance, Audio: undefined, isMuted: () => false }).say({ text: 'Sold!' });
  assert.equal(f.spoken[0].voice.name, 'Google UK English Male');
});

test('no audio and no speech support means no errors', () => {
  assert.doesNotThrow(() => createVoice({ isMuted: () => false }).say({ clip: 'sold', text: 'Sold!' }));
  const broken = createVoice({ synth: { getVoices() { throw new Error('x'); }, cancel() {}, speak() { throw new Error('blocked'); } }, Utterance: class { }, Audio: class { constructor() { throw new Error('no'); } }, isMuted: () => false });
  assert.doesNotThrow(() => broken.say({ clip: 'sold', text: 'Sold!' }));
});
