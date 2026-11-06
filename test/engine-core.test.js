import test from 'node:test';
import assert from 'node:assert/strict';
import { reduce, tick } from '../server/game/engine.js';
import { ActionError, registerHandler, registerTimeout } from '../server/game/registry.js';
import { createGame } from '../server/game/state.js';

const players = [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }, { id: 'c', name: 'C' }];
const deepFreeze = (o) => {
  Object.values(o).forEach((v) => { if (v && typeof v === 'object') deepFreeze(v); });
  return Object.freeze(o);
};

registerHandler('test-touch', (s, action, now, events) => {
  s.roundNo = 99;
  events.push({ type: 'touched', by: action.by });
});

test('reduce never mutates its input and returns the events', () => {
  const s = deepFreeze(createGame(players, 'manual', 1));
  const out = reduce(s, { type: 'test-touch', by: 'a' }, 0);
  assert.equal(s.roundNo, 1);
  assert.equal(out.state.roundNo, 99);
  assert.deepEqual(out.events, [{ type: 'touched', by: 'a' }]);
});

test('unknown action type throws ActionError invalid', () => {
  const s = createGame(players, 'manual', 1);
  assert.throws(() => reduce(s, { type: 'nope', by: 'a' }, 0), (e) => e instanceof ActionError && e.code === 'invalid');
});

test('unknown or eliminated actor throws not-allowed', () => {
  const s = createGame(players, 'manual', 1);
  assert.throws(() => reduce(s, { type: 'test-touch', by: 'zzz' }, 0), (e) => e.code === 'not-allowed');
  s.players.b.eliminated = true;
  assert.throws(() => reduce(s, { type: 'test-touch', by: 'b' }, 0), (e) => e.code === 'not-allowed');
});

test('tick does nothing before the deadline and fires the timeout exactly once at it', () => {
  let calls = 0;
  registerTimeout('test-kind', (s, now, events) => {
    calls++;
    events.push({ type: 'timed-out', now });
  });
  const s = createGame(players, 'manual', 1);
  s.deadline = { kind: 'test-kind', at: 1000 };

  const early = tick(s, 999);
  assert.equal(early.state, s);
  assert.deepEqual(early.events, []);
  assert.equal(calls, 0);

  const fired = tick(s, 1000);
  assert.equal(calls, 1);
  assert.deepEqual(fired.events, [{ type: 'timed-out', now: 1000 }]);
  assert.equal(fired.state.deadline, null);
  assert.deepEqual(s.deadline, { kind: 'test-kind', at: 1000 }); // input untouched

  const again = tick(fired.state, 5000);
  assert.equal(calls, 1);
  assert.deepEqual(again.events, []);
});

test('a timeout handler may set a new deadline', () => {
  registerTimeout('test-rearm', (s, now) => { s.deadline = { kind: 'test-rearm', at: now + 10 }; });
  const s = createGame(players, 'manual', 1);
  s.deadline = { kind: 'test-rearm', at: 100 };
  assert.deepEqual(tick(s, 100).state.deadline, { kind: 'test-rearm', at: 110 });
});
