import test from 'node:test';
import assert from 'node:assert/strict';
import { reduce, tick } from '../server/game/engine.js';
import { createGame } from '../server/game/state.js';
import { UNITS } from '../shared/cards.js';

const it = (id, value, tier = 'common') => ({ id, tier, name: id, value });
const HAVOC = it('mold', 0, 'havoc');

/** p1 leads at `price` on the last "going twice": the next tick at t=1000 says SOLD. Medium unit, three crates. */
function lastCall({ price = 1000, items } = {}) {
  const s = createGame(['p0', 'p1', 'p2', 'p3'].map((id) => ({ id, name: id })), 1);
  const { count, ...unit } = UNITS.medium;
  s.unit = unit;
  s.slots = (items || [it('a', 500), it('b', 500), it('c', 500)]).map((item) => ({ item, faceUp: false }));
  s.buyIns = { p0: 'pass', p1: 'in', p2: 'in', p3: 'pass' };
  s.phase = 'bidding';
  s.bid = { amount: price, bidderId: 'p1' };
  s.call = 2;
  s.deadline = { kind: 'call', at: 1000 };
  return s;
}
const sell = (s) => tick(s, 1000);

test('SOLD pays at once: the price leaves the winner\'s cash for the bank and the unit opens', () => {
  const { state, events } = sell(lastCall({ price: 1500 }));
  assert.equal(state.phase, 'reveal');
  assert.equal(state.players.p1.cash, 3500);
  assert.equal(state.bank, 1500);
  assert.deepEqual(state.winner, { playerId: 'p1', price: 1500 });
  assert.ok(events.some((e) => e.type === 'sold' && e.playerId === 'p1' && e.price === 1500));
  assert.ok(events.some((e) => e.type === 'paid' && e.by === 'p1' && e.price === 1500));
  assert.deepEqual(state.deadline, { kind: 'reveal', at: 1000 + 4000 });
});

test('money is conserved: cash plus the bank always equals what the players started with', () => {
  const { state } = sell(lastCall({ price: 700 }));
  const cash = Object.values(state.players).reduce((n, p) => n + p.cash, 0);
  assert.equal(cash + state.bank, 4 * 5000);
});

test('items are never spent: a winner holding valuable items still pays in cash only', () => {
  const s = lastCall({ price: 1000 });
  s.players.p1.items = [it('rug', 9000, 'valuable')];
  const { state, events } = sell(s);
  assert.equal(state.players.p1.cash, 4000);
  assert.ok(state.players.p1.items.some((x) => x.id === 'rug'));
  assert.ok(!events.some((e) => /-items$/.test(e.type)));
  assert.ok(!JSON.stringify(events.filter((e) => e.type === 'paid')).includes('rug'));
});

test('a safe unit goes to the winner, hidden from everyone else', () => {
  const { state, events } = sell(lastCall());
  assert.equal(state.players.p1.items.length, 3);
  const priv = events.find((e) => e.type === 'revealed' && e.to === 'p1');
  assert.equal(priv.items.length, 3);
  const pub = events.filter((e) => e.type === 'revealed' && !e.to);
  assert.deepEqual(pub.map((e) => ({ winnerId: e.winnerId, count: e.count })), [{ winnerId: 'p1', count: 3 }]);
  assert.ok(!JSON.stringify(pub).includes('"id":"a"'));
});

test('winning a unit with Havoc voids it: paid for nothing, only the Havoc card is shown', () => {
  const { state, events } = sell(lastCall({ items: [it('secret1', 9000), HAVOC, it('secret2', 700)] }));
  assert.equal(state.voided, true);
  assert.equal(state.players.p1.items.length, 0);
  assert.equal(state.players.p1.cash, 4000); // still paid
  assert.equal(state.bank, 1000);
  const pubText = JSON.stringify(events.filter((e) => !e.to));
  assert.ok(pubText.includes('mold'));
  assert.ok(!pubText.includes('secret1') && !pubText.includes('secret2'));
});

test('the reveal timer starts the next round', () => {
  const sold = sell(lastCall()).state;
  const next = tick(sold, 5000);
  assert.equal(next.state.roundNo, 2);
  assert.ok(next.events.some((e) => e.type === 'round-end'));
});

test('the last reveal ends the game with scores', () => {
  const s = lastCall();
  s.roundNo = s.config.rounds;
  const end = tick(sell(s).state, 5000);
  assert.equal(end.state.phase, 'gameover');
  assert.equal(end.state.result.scores[0].total >= end.state.result.scores[1].total, true);
  assert.ok(end.events.some((e) => e.type === 'game-over'));
});

test('there is no pay action any more: the sale pays itself', () => {
  assert.throws(() => reduce(lastCall(), { type: 'pay', by: 'p1', cash: 1000, itemIds: [] }, 0), (e) => e.code === 'invalid');
});
