import test from 'node:test';
import assert from 'node:assert/strict';
import { createVoice } from '../client/js/ui/voice.js';

function fakes({ voices = [] } = {}) {
  const spoken = [];
  const synth = {
    cancelled: 0,
    getVoices: () => voices,
    cancel() { this.cancelled++; },
    speak(u) { spoken.push(u); },
  };
  class Utterance { constructor(text) { this.text = text; } }
  return { synth, Utterance, spoken };
}

test('say() speaks the text with the given pitch, rate and volume, cutting off older speech', () => {
  const f = fakes();
  const voice = createVoice(f.synth, f.Utterance, () => false);
  voice.say({ text: 'Sold!', pitch: 0.2, rate: 0.8, volume: 1 });
  assert.equal(f.spoken.length, 1);
  assert.deepEqual([f.spoken[0].text, f.spoken[0].pitch, f.spoken[0].rate, f.spoken[0].volume], ['Sold!', 0.2, 0.8, 1]);
  assert.equal(f.synth.cancelled, 1);
});

test('a muted game stays silent', () => {
  const f = fakes();
  createVoice(f.synth, f.Utterance, () => true).say({ text: 'Sold!' });
  assert.equal(f.spoken.length, 0);
});

test('a deep English voice is preferred when the browser has one', () => {
  const voices = [{ name: 'Samantha', lang: 'en-US' }, { name: 'Google UK English Male', lang: 'en-GB' }, { name: 'Anna', lang: 'de-DE' }];
  const f = fakes({ voices });
  createVoice(f.synth, f.Utterance, () => false).say({ text: 'Sold!' });
  assert.equal(f.spoken[0].voice.name, 'Google UK English Male');
});

test('no speech support means no errors', () => {
  const voice = createVoice(undefined, undefined, () => false);
  assert.doesNotThrow(() => voice.say({ text: 'Sold!' }));
  const broken = createVoice({ getVoices() { throw new Error('x'); }, cancel() {}, speak() { throw new Error('blocked'); } }, class { }, () => false);
  assert.doesNotThrow(() => broken.say({ text: 'Sold!' }));
});
