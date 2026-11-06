import test from 'node:test';
import assert from 'node:assert/strict';
import { reduce, tick } from '../server/game/engine.js';
import { createGame, beginRoundPhase } from '../server/game/state.js';
import { UNITS } from '../shared/cards.js';

const safe = (n, value = 500) => ({ id: `t-${n}`, tier: 'common', name: `Thing ${n}`, value });
const havoc = { id: 't-havoc', tier: 'havoc', name: 'Black Mold', value: 0 };

/** 4 players, round 1, a chosen unit and chosen face-down items. */
function setup({ unit = 'jumbo', items, n = 4 } = {}) {
  const players = Array.from({ length: n }, (_, i) => ({ id: `p${i}`, name: `P${i}` }));
  const s = createGame(players, 1);
  const { count, ...u } = UNITS[unit];
  s.unit = u;
  s.slots = (items || Array.from({ length: u.items }, (_, i) => safe(i))).map((item) => ({ item, faceUp: false }));
  beginRoundPhase(s, 0);
  return s;
}
const act = (s, type, by, extra = {}, now = 0) => reduce(s, { type, by, ...extra }, now);
const code = (fn) => { try { fn(); } catch (e) { return e.code; } return null; };

test('the game flips a random crate by itself after 2 s and opens buy-in; players cannot flip', () => {
  const s = setup({ unit: 'jumbo' });
  assert.equal(s.phase, 'flip');
  assert.deepEqual(s.deadline, { kind: 'auto-flip', at: 2000 });
  assert.equal(code(() => act(s, 'flip', 'p0', { index: 0 })), 'invalid'); // there is no human flip action
  const out = tick(s, 2000);
  assert.equal(out.state.slots.filter((x) => x.faceUp).length, 1);
  assert.equal(out.state.phase, 'buyin');
  assert.deepEqual(out.state.deadline, { kind: 'buyin', at: 27000 });
  assert.ok(out.events.some((e) => e.type === 'flipped'));
});

test('an automatic flip that finds Havoc voids the unit and moves to the next round', () => {
  const s = setup({ unit: 'large', items: [havoc, havoc, havoc, havoc] });
  const { state, events } = tick(s, 2000);
  assert.ok(events.some((e) => e.type === 'voided'));
  assert.ok(events.some((e) => e.type === 'round-end'));
  assert.equal(state.roundNo, 2);
});

test('a peek is private and allowed once; the Auctioneer follows the same peek rules as everyone', () => {
  const s = setup({ unit: 'medium' });
  const { state, events } = act(s, 'peek', 'p0', { index: 0 });
  const priv = events.find((e) => e.type === 'peeked');
  assert.equal(priv.to, 'p0');
  assert.equal(priv.item.id, 't-0');
  assert.ok(events.some((e) => e.type === 'peek-used' && e.by === 'p0' && !('item' in e)));
  assert.equal(code(() => act(state, 'peek', 'p0', { index: 0 })), 'invalid');
  assert.equal(code(() => act(setup({ unit: 'locker' }), 'peek', 'p0', { index: 0 })), 'not-allowed'); // no peeks on a locker, for anyone
  assert.equal(code(() => act(setup({ unit: 'small' }), 'peek', 'p0', { index: 0 })), 'not-allowed'); // buy in first
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
  const flipped = tick(s, 2000).state;
  const up = flipped.slots.findIndex((x) => x.faceUp);
  assert.equal(code(() => act(flipped, 'peek', 'p1', { index: up })), 'invalid');
  assert.equal(code(() => act(flipped, 'peek', 'p1', { index: 7 })), 'invalid');
});

test('buy-in is simultaneous: every player can decide at once, in any order', () => {
  let s = setup({ unit: 'locker' });
  // p3 goes first, then p2, then p1: nobody has to wait for a turn
  s = act(s, 'buyin', 'p3').state;
  s = act(s, 'buyin', 'p2').state;
  assert.equal(s.phase, 'buyin');
  assert.deepEqual(s.buyIns, { p3: 'in', p2: 'in' });
  s = act(s, 'buyin', 'p1').state;
  assert.equal(s.phase, 'buyin'); // the Auctioneer decides too
  s = act(s, 'pass', 'p0').state;
  assert.equal(s.phase, 'bidding'); // all decided: bidding opens at once
  assert.equal(s.bank, 300); // the three buy-ins of $100 go to the bank
});

test('every player can buy in and then bid; the fee goes to the bank', () => {
  let s = setup({ unit: 'locker' });
  s = act(s, 'buyin', 'p0').state;
  assert.equal(s.players.p0.cash, 4900);
  assert.equal(s.bank, 100);
  for (const id of ['p1', 'p2', 'p3']) s = act(s, 'pass', id).state;
  assert.equal(s.phase, 'bidding');
  assert.equal(act(s, 'bid', 'p0', { amount: 100 }).state.bid.bidderId, 'p0');
});

test('buy-in: cash only, the configured fee, no double clicks', () => {
  const s = setup({ unit: 'locker' });
  const { state } = act(s, 'buyin', 'p1');
  assert.equal(state.players.p1.cash, 4900);
  assert.equal(state.bank, 100);
  assert.equal(state.buyIns.p1, 'in');
  assert.equal(code(() => act(state, 'buyin', 'p1')), 'not-allowed'); // already decided
  assert.equal(code(() => act(state, 'pass', 'p1')), 'not-allowed');

  const broke = setup({ unit: 'locker' });
  broke.players.p1.cash = 50;
  assert.equal(code(() => act(broke, 'buyin', 'p1')), 'invalid');

  const pricey = setup({ unit: 'locker' });
  pricey.config.buyIn = 500;
  const paid = act(pricey, 'buyin', 'p2').state;
  assert.equal(paid.players.p2.cash, 4500);
  assert.equal(paid.bank, 500);
});

test('the shared buy-in clock passes for everyone who has not decided', () => {
  let s = setup({ unit: 'locker' });
  assert.deepEqual(s.deadline, { kind: 'buyin', at: 25000 });
  s = act(s, 'buyin', 'p2').state;
  assert.deepEqual(s.deadline, { kind: 'buyin', at: 25000 }); // deciding does not restart the clock
  const out = tick(s, 25000);
  assert.equal(out.state.buyIns.p0, 'pass');
  assert.equal(out.state.buyIns.p1, 'pass');
  assert.equal(out.state.buyIns.p3, 'pass');
  assert.equal(out.state.buyIns.p2, 'in');
  assert.equal(out.state.phase, 'bidding');
  assert.equal(out.events.filter((e) => e.type === 'pass' && e.auto).length, 3);
});

test('everyone passes: unit discarded, round over, no money moves', () => {
  let s = setup({ unit: 'locker' });
  for (const id of ['p0', 'p1', 'p2', 'p3']) s = act(s, 'pass', id).state;
  assert.equal(s.roundNo, 2);
  assert.ok(Object.values(s.players).every((p) => p.cash === 5000));
});

test('after the last buy-in the peek window opens; ready from all buyers ends it early', () => {
  let s = setup({ unit: 'small' });
  s = act(s, 'buyin', 'p1').state;
  s = act(s, 'pass', 'p2').state;
  s = act(s, 'pass', 'p0').state;
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
  s = act(s, 'pass', 'p0').state;
  assert.equal(tick(s, 15000).state.phase, 'bidding');

  let l = setup({ unit: 'locker' });
  l = act(l, 'buyin', 'p1').state;
  l = act(l, 'pass', 'p2').state;
  l = act(l, 'pass', 'p3').state;
  l = act(l, 'pass', 'p0').state;
  assert.equal(l.phase, 'bidding');
});
