import test from 'node:test';
import assert from 'node:assert/strict';
import { createSounds, SOUND_NAMES } from '../client/js/ui/sounds.js';

/** Counts every audio node the code creates. */
function fakeAudio() {
  const made = { nodes: 0, resumed: 0, contexts: 0 };
  class Ctx {
    constructor() {
      made.contexts++;
      this.currentTime = 0;
      this.sampleRate = 8000;
      this.state = 'suspended';
      this.destination = {};
    }
    resume() { made.resumed++; this.state = 'running'; }
    createOscillator() {
      made.nodes++;
      return { frequency: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {}, start() {}, stop() {} };
    }
    createGain() { return { gain: { value: 1, setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} }; }
    createBuffer(_c, n) { return { getChannelData: () => new Float32Array(n) }; }
    createBufferSource() { made.nodes++; return { connect() {}, start() {} }; }
  }
  return { Ctx, made };
}
const memory = () => {
  const m = new Map();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)) };
};

test('every named sound makes at least one audio node when unmuted', () => {
  assert.equal(SOUND_NAMES.length, 14);
  for (const name of SOUND_NAMES) {
    const { Ctx, made } = fakeAudio();
    createSounds(Ctx, memory()).play(name);
    assert.ok(made.nodes >= 1, `${name} made no sound`);
  }
});

test('the required names exist', () => {
  for (const n of ['bid', 'buyin', 'flip', 'gavel1', 'gavel2', 'sold', 'fine', 'revealJunk', 'revealCommon',
    'revealValuable', 'revealUnique', 'revealHavoc', 'victory', 'click']) {
    assert.ok(SOUND_NAMES.includes(n), n);
  }
});

test('muted means no audio context and no node at all, and the choice is remembered', () => {
  const { Ctx, made } = fakeAudio();
  const storage = memory();
  const s = createSounds(Ctx, storage);
  s.setMuted(true);
  s.play('sold');
  assert.equal(made.nodes, 0);
  assert.equal(made.contexts, 0);
  assert.equal(s.isMuted(), true);
  assert.equal(createSounds(Ctx, storage).isMuted(), true); // a fresh page load
  s.setMuted(false);
  s.play('bid');
  assert.ok(made.nodes >= 1);
});

test('unknown names are ignored and a blocked or missing audio API never throws', () => {
  const { Ctx } = fakeAudio();
  assert.doesNotThrow(() => createSounds(Ctx, memory()).play('nope'));
  assert.doesNotThrow(() => createSounds(undefined, memory()).play('bid'));
  const broken = class { constructor() { throw new Error('blocked'); } };
  assert.doesNotThrow(() => createSounds(broken, memory()).play('bid'));
  assert.doesNotThrow(() => createSounds(Ctx, { getItem() { throw new Error('x'); }, setItem() { throw new Error('x'); } }).play('bid'));
});

test('a suspended audio context is resumed on play (browsers start it suspended)', () => {
  const { Ctx, made } = fakeAudio();
  createSounds(Ctx, memory()).play('click');
  assert.equal(made.resumed, 1);
});
