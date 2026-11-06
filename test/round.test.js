import test from 'node:test';
import assert from 'node:assert/strict';
import { reduce, tick } from '../server/game/engine.js';
import { createGame, beginRoundPhase } from '../server/game/state.js';
import { UNITS } from '../shared/cards.js';

const safe = (n, value = 500) => ({ id: `t-${n}`, tier: 'common', name: `Thing ${n}`, value });
const havoc = { id: 't-havoc', tier: 'havoc', name: 'Black Mold', value: 0 };

/** 4 players, p0 is the Auctioneer, a chosen unit and chosen face-down items. */
function setup({ unit = 'jumbo', mode = 'manual', items, n = 4 } = {}) {
  const players = Array.from({ length: n }, (_, i) => ({ id: `p${i}`, name: `P${i}` }));
  const s = createGame(players, mode, 1);
  const { count, ...u } = UNITS[unit];
  s.auctioneerId = 'p0';
  s.unit = u;
  s.slots = (items || Array.from({ length: u.items }, (_, i) => safe(i))).map((item) => ({ item, faceUp: false }));
  beginRoundPhase(s, 0);
  return s;
}
const act = (s, type, by, extra = {}, now = 0) => reduce(s, { type, by, ...extra }, now);
const code = (fn) => { try { fn(); } catch (e) { return e.code; } return null; };

test('flip: only the Auctioneer may flip, index must be valid, a safe flip opens buy-in', () => {
  const s = setup({ unit: 'jumbo' });
  assert.equal(s.phase, 'flip');
  assert.equal(code(() => act(s, 'flip', 'p1', { index: 0 })), 'not-allowed');
  assert.equal(code(() => act(s, 'flip', 'p0', { index: 9 })), 'invalid');
  assert.equal(code(() => act(s, 'flip', 'p0', { index: 1.5 })), 'invalid');
  const { state, events } = act(s, 'flip', 'p0', { index: 2 });
  assert.equal(state.slots[2].faceUp, true);
  assert.equal(state.phase, 'buyin');
  assert.equal(state.buyInTurn, 'p1');
  assert.ok(events.some((e) => e.type === 'flipped' && e.index === 2));
  assert.equal(code(() => act(state, 'flip', 'p0', { index: 3 })), 'wrong-phase');
});

test('flipping a Havoc voids the unit, ends the round and credits the Auctioneer turn', () => {
  const s = setup({ unit: 'large', items: [safe(0), havoc, safe(2), safe(3)] });
  const { state, events } = act(s, 'flip', 'p0', { index: 1 });
  assert.ok(events.some((e) => e.type === 'voided'));
  assert.ok(events.some((e) => e.type === 'round-end'));
  assert.equal(state.players.p0.turnsPlayed, 1);
  assert.equal(state.auctioneerId, 'p1');
  assert.equal(state.roundNo, 2);
});

test('auto mode flips by itself and humans cannot flip; manual idle hands the round to auto', () => {
  const a = setup({ unit: 'jumbo', mode: 'auto' });
  assert.deepEqual(a.deadline, { kind: 'auto-flip', at: 2000 });
  assert.equal(code(() => act(a, 'flip', 'p0', { index: 0 })), 'not-allowed');
  const flippedAuto = tick(a, 2000).state;
  assert.equal(flippedAuto.slots.filter((x) => x.faceUp).length, 1);

  const m = setup({ unit: 'jumbo', mode: 'manual' });
  assert.deepEqual(m.deadline, { kind: 'flip-idle', at: 45000 });
  const out = tick(m, 45000);
  assert.equal(out.state.roundAuto, true);
  assert.ok(out.events.some((e) => e.type === 'auto-takeover'));
  assert.equal(out.state.slots.filter((x) => x.faceUp).length, 1);
});

test('the Auctioneer peeks privately, once', () => {
  const s = setup({ unit: 'locker' });
  const { state, events } = act(s, 'peek', 'p0', { index: 0 });
  const priv = events.find((e) => e.type === 'peeked');
  assert.equal(priv.to, 'p0');
  assert.equal(priv.item.id, 't-0');
  assert.ok(events.some((e) => e.type === 'peek-used' && e.by === 'p0' && !('item' in e)));
  assert.equal(code(() => act(state, 'peek', 'p0', { index: 0 })), 'invalid');
});

test('player peek rules follow the unit: never / before / after buy-in', () => {
  const never = setup({ unit: 'locker' });
  assert.equal(never.phase, 'buyin');
  assert.equal(code(() => act(never, 'peek', 'p1', { index: 0 })), 'not-allowed');

  const before = setup({ unit: 'medium' });
  const ok = act(before, 'peek', 'p2', { index: 1 }); // not their buy-in turn yet, still allowed
  assert.equal(ok.events.find((e) => e.type === 'peeked').item.id, 't-1');
  assert.equal(code(() => act(before, 'peek', 'p0', { index: 1 })), null); // Auctioneer's own peek

  const after = setup({ unit: 'small' });
  assert.equal(code(() => act(after, 'peek', 'p1', { index: 0 })), 'not-allowed');
  const paid = act(after, 'buyin', 'p1').state;
  assert.equal(act(paid, 'peek', 'p1', { index: 0 }).events.find((e) => e.type === 'peeked').item.id, 't-0');
});

test('peeking a face-up crate or an out-of-range crate is invalid', () => {
  const s = setup({ unit: 'jumbo' });
  const flipped = act(s, 'flip', 'p0', { index: 0 }).state;
  assert.equal(code(() => act(flipped, 'peek', 'p1', { index: 0 })), 'invalid');
  assert.equal(code(() => act(flipped, 'peek', 'p1', { index: 7 })), 'invalid');
});

test('buy-in: in turn, cash only, exactly $100 to the Auctioneer, no double clicks', () => {
  const s = setup({ unit: 'locker' });
  assert.equal(code(() => act(s, 'buyin', 'p2')), 'not-allowed');
  assert.equal(code(() => act(s, 'buyin', 'p0')), 'not-allowed');
  const { state } = act(s, 'buyin', 'p1');
  assert.equal(state.players.p1.cash, 4900);
  assert.equal(state.players.p0.cash, 5100);
  assert.equal(state.buyIns.p1, 'in');
  assert.equal(state.buyInTurn, 'p2');
  assert.equal(code(() => act(state, 'buyin', 'p1')), 'not-allowed');

  const broke = setup({ unit: 'locker' });
  broke.players.p1.cash = 50;
  assert.equal(code(() => act(broke, 'buyin', 'p1')), 'invalid');
});

test('buy-in timer auto-passes the current decider and moves on', () => {
  const s = setup({ unit: 'locker' });
  assert.deepEqual(s.deadline, { kind: 'buyin', at: 25000 });
  const out = tick(s, 25000);
  assert.equal(out.state.buyIns.p1, 'pass');
  assert.equal(out.state.buyInTurn, 'p2');
  assert.deepEqual(out.state.deadline, { kind: 'buyin', at: 50000 });
});

test('everyone passes: unit discarded, round over, no money moves', () => {
  let s = setup({ unit: 'locker' });
  for (const id of ['p1', 'p2', 'p3']) s = act(s, 'pass', id).state;
  assert.equal(s.players.p0.turnsPlayed, 1);
  assert.equal(s.auctioneerId, 'p1');
  assert.equal(s.roundNo, 2);
  assert.ok(Object.values(s.players).every((p) => p.cash === 5000));
});

test('after the last buy-in the peek window opens; ready from all buyers ends it early', () => {
  let s = setup({ unit: 'small' });
  s = act(s, 'buyin', 'p1').state;
  s = act(s, 'pass', 'p2').state;
  s = act(s, 'buyin', 'p3').state;
  assert.equal(s.phase, 'peekwin');
  assert.deepEqual(s.deadline, { kind: 'peekwin', at: 15000 });
  assert.equal(code(() => act(s, 'ready', 'p2')), 'not-allowed'); // passed, not a buyer
  s = act(s, 'ready', 'p1').state;
  assert.equal(s.phase, 'peekwin');
  s = act(s, 'peek', 'p3', { index: 0 }).state; // a peek counts as ready
  assert.equal(s.phase, 'bidding');
});

test('peek window timeout opens bidding; a no-peek unit goes straight to bidding', () => {
  let s = setup({ unit: 'small' });
  s = act(s, 'buyin', 'p1').state;
  s = act(s, 'pass', 'p2').state;
  s = act(s, 'pass', 'p3').state;
  assert.equal(tick(s, 15000).state.phase, 'bidding');

  let l = setup({ unit: 'locker' });
  l = act(l, 'buyin', 'p1').state;
  l = act(l, 'pass', 'p2').state;
  l = act(l, 'pass', 'p3').state;
  assert.equal(l.phase, 'bidding');
});
