import test from 'node:test';
import assert from 'node:assert/strict';
import { reduce, tick } from '../server/game/engine.js';
import { createGame, scores } from '../server/game/state.js';
import { assets, suggestPayment, validatePayment } from '../server/game/payment.js';
import { UNITS } from '../shared/cards.js';

const it = (id, value, tier = 'common') => ({ id, tier, name: id, value });
const HAVOC = it('mold', 0, 'havoc');

/** p0 Auctioneer, p1 won at `price`, p2 also bought in, p3 passed. Phase: payment. */
function paying({ price = 1000, items, n = 4 } = {}) {
  const s = createGame(Array.from({ length: n }, (_, i) => ({ id: `p${i}`, name: `p${i}` })), 'manual', 1);
  const { count, ...unit } = UNITS.medium;
  s.auctioneerId = 'p0';
  s.unit = unit;
  s.slots = (items || [it('a', 500), it('b', 500), it('c', 500)]).map((item) => ({ item, faceUp: false }));
  s.buyIns = { p1: 'in', p2: 'in', p3: 'pass' };
  s.peeks = { p2: [0] };
  s.phase = 'payment';
  s.winner = { playerId: 'p1', price };
  s.bid = { amount: price, bidderId: 'p1' };
  s.deadline = { kind: 'payment', at: 60000 };
  return s;
}
const act = (s, type, by, extra = {}, now = 0) => reduce(s, { type, by, ...extra }, now);
const code = (fn) => { try { fn(); } catch (e) { return e.code; } return null; };
const total = (p) => p.cash + p.items.reduce((n, x) => n + x.value, 0);

test('assets = cash + positive item values (junk never counts)', () => {
  assert.equal(assets({ cash: 1000, items: [it('j', -300, 'junk'), it('v', 2000)] }), 3000);
});

test('suggestPayment: cash first, then the least-overpaying items, never junk', () => {
  const p = (cash, ...vals) => ({ cash, items: vals.map((v, i) => it(`i${i}`, v)) });
  assert.deepEqual(suggestPayment(p(1000), 700), { cash: 700, itemIds: [] });
  assert.deepEqual(suggestPayment(p(1000, 500, 3000), 1500), { cash: 1000, itemIds: ['i0'] });
  assert.deepEqual(suggestPayment(p(0, 500, 3000), 1500), { cash: 0, itemIds: ['i1'] });
  assert.equal(suggestPayment(p(100, 500), 5000), null);
  const withJunk = { cash: 0, items: [it('j', -100, 'junk'), it('v', 200)] };
  assert.equal(suggestPayment(withJunk, 200).itemIds.join(), 'v');
});

test('validatePayment rejects bad cash, unowned, duplicate and junk items, and short totals', () => {
  const p = { cash: 1000, items: [it('v', 2000), it('j', -100, 'junk')] };
  const bad = (pay) => assert.throws(() => validatePayment(p, 1500, pay), (e) => e.code === 'invalid', JSON.stringify(pay));
  bad({ cash: -1, itemIds: ['v'] });
  bad({ cash: 1.5, itemIds: ['v'] });
  bad({ cash: NaN, itemIds: ['v'] });
  bad({ cash: 1001, itemIds: ['v'] });
  bad({ cash: 0, itemIds: ['ghost'] });
  bad({ cash: 0, itemIds: ['v', 'v'] });
  bad({ cash: 1500, itemIds: ['j'] });
  bad({ cash: 1000, itemIds: [] }); // total short
  bad({ cash: 0, itemIds: 'v' });
  assert.doesNotThrow(() => validatePayment(p, 1500, { cash: 0, itemIds: ['v'] })); // overpay is fine
});

test('paying with an item hands it to the Auctioneer and no change comes back', () => {
  const s = paying({ price: 1500 });
  s.players.p1.cash = 0;
  s.players.p1.items = [it('big', 3000)];
  const before = total(s.players.p0);
  const { state, events } = act(s, 'pay', 'p1', { cash: 0, itemIds: ['big'] });
  assert.equal(state.players.p1.items.some((x) => x.id === 'big'), false);
  assert.ok(state.players.p0.items.some((x) => x.id === 'big'));
  assert.equal(total(state.players.p0), before + 3000);
  assert.equal(state.players.p1.cash, 0);
  assert.equal(state.phase, 'reveal');
  assert.ok(events.some((e) => e.type === 'paid'));
});

test('public payment events never name the items used; only the payer and the Auctioneer learn them', () => {
  const s = paying({ price: 1500 });
  s.players.p1.cash = 0;
  s.players.p1.items = [it('secret-rug', 3000)];
  const { events } = act(s, 'pay', 'p1', { cash: 0, itemIds: ['secret-rug'] });
  const publicEvents = events.filter((e) => !e.to);
  assert.ok(!JSON.stringify(publicEvents).includes('secret-rug'), 'item id leaked in a public event');
  const paid = publicEvents.find((e) => e.type === 'paid');
  assert.equal(paid.itemCount, 1);
  const priv = events.filter((e) => e.type === 'paid-items');
  assert.deepEqual(priv.map((e) => e.to).sort(), ['p0', 'p1']);
  assert.ok(priv.every((e) => e.itemIds.join() === 'secret-rug'));
});

test('a fine paid with items does not leak them either', () => {
  const s = paying({ price: 9000 });
  s.players.p1.cash = 0;
  s.players.p1.items = [it('secret-clock', 2000)];
  const { events } = tick(s, 60000);
  assert.ok(events.some((e) => e.type === 'fined' && e.amount === 1000));
  assert.ok(!JSON.stringify(events.filter((e) => !e.to)).includes('secret-clock'));
  assert.deepEqual(events.filter((e) => e.type === 'fined-items').map((e) => e.to).sort(), ['p0', 'p1']);
});

test('only the winner pays, and only in the payment phase', () => {
  const s = paying();
  assert.equal(code(() => act(s, 'pay', 'p2', { cash: 1000, itemIds: [] })), 'not-allowed');
  const done = act(s, 'pay', 'p1', { cash: 1000, itemIds: [] }).state;
  assert.equal(code(() => act(done, 'pay', 'p1', { cash: 0, itemIds: [] })), 'wrong-phase');
});

test('a safe unit goes to the winner, hidden from everyone else', () => {
  const s = paying();
  const { state, events } = act(s, 'pay', 'p1', { cash: 1000, itemIds: [] });
  assert.equal(state.players.p1.items.length, 3);
  const priv = events.find((e) => e.type === 'revealed' && e.to === 'p1');
  assert.equal(priv.items.length, 3);
  const pub = events.filter((e) => e.type === 'revealed' && !e.to);
  assert.deepEqual(pub.map((e) => ({ winnerId: e.winnerId, count: e.count })), [{ winnerId: 'p1', count: 3 }]);
  assert.ok(!JSON.stringify(pub).includes('"id":"a"'));
});

test('winning a unit with Havoc voids it: paid for nothing, only the Havoc card is shown', () => {
  const s = paying({ items: [it('secret1', 9000), HAVOC, it('secret2', 700)] });
  const { state, events } = act(s, 'pay', 'p1', { cash: 1000, itemIds: [] });
  assert.equal(state.voided, true);
  assert.equal(state.players.p1.items.length, 0);
  assert.equal(state.players.p0.cash, 6000);
  const pubText = JSON.stringify(events.filter((e) => !e.to));
  assert.ok(pubText.includes('mold'));
  assert.ok(!pubText.includes('secret1') && !pubText.includes('secret2'));
});

test('the reveal timer starts the next round', () => {
  const s = act(paying(), 'pay', 'p1', { cash: 1000, itemIds: [] }, 5000).state;
  assert.deepEqual(s.deadline, { kind: 'reveal', at: 9000 });
  const next = tick(s, 9000);
  assert.equal(next.state.roundNo, 2);
  assert.equal(next.state.auctioneerId, 'p1');
  assert.ok(next.events.some((e) => e.type === 'round-end'));
});

test('the last reveal ends the game with scores', () => {
  const s = paying();
  s.order.forEach((id) => { s.players[id].turnsPlayed = id === 'p0' ? 1 : 2; });
  const paid = act(s, 'pay', 'p1', { cash: 1000, itemIds: [] }).state;
  const end = tick(paid, 4000);
  assert.equal(end.state.phase, 'gameover');
  assert.equal(end.state.result.scores[0].total >= end.state.result.scores[1].total, true);
  assert.ok(end.events.some((e) => e.type === 'game-over'));
});

test('payment timeout pays automatically when affordable', () => {
  const out = tick(paying({ price: 700 }), 60000);
  assert.equal(out.state.phase, 'reveal');
  assert.equal(out.state.players.p1.cash, 4300);
  assert.ok(out.events.some((e) => e.type === 'paid' && e.auto === true));
});

test('failure to pay: $1,000 fine, same auction restarts without the winner, peeks kept', () => {
  const s = paying({ price: 4000 });
  s.players.p1.cash = 1500;
  const { state, events } = tick(s, 60000);
  assert.equal(state.players.p1.cash, 500);
  assert.equal(state.players.p0.cash, 6000);
  assert.ok(events.some((e) => e.type === 'fined' && e.by === 'p1' && e.amount === 1000));
  assert.deepEqual(state.excluded, ['p1']);
  assert.equal(state.phase, 'bidding');
  assert.equal(state.bid, null);
  assert.equal(state.winner, null);
  assert.deepEqual(state.peeks, { p2: [0] });
  assert.equal(code(() => act(state, 'bid', 'p1', { amount: 100 })), 'not-allowed');
  assert.equal(code(() => act(state, 'bid', 'p2', { amount: 100 })), null);
});

test('an unaffordable winner is failed at the next tick without waiting out the clock', () => {
  const s = paying({ price: 4000 });
  s.players.p1.cash = 1500;
  s.deadline = null;
  // the real path: SOLD sets the deadline to "now" when the winner cannot pay
  const sold = tickToSold(s);
  assert.deepEqual(sold.deadline, { kind: 'payment', at: 777 });
  assert.equal(tick(sold, 777).state.phase, 'bidding');
});

function tickToSold(s) {
  const b = createGame([{ id: 'p0', name: 'p0' }, { id: 'p1', name: 'p1' }, { id: 'p2', name: 'p2' }], 'manual', 1);
  b.auctioneerId = 'p0';
  b.buyIns = { p1: 'in', p2: 'in' };
  b.players.p1.cash = s.players.p1.cash;
  b.phase = 'bidding';
  b.bid = { amount: 4000, bidderId: 'p1' };
  b.call = 2;
  return reduce(b, { type: 'call', by: 'p0' }, 777).state;
}

test('fine edge: exactly $1,000 of assets is fined; $999 is eliminated and everything goes to the Auctioneer', () => {
  const rich = paying({ price: 4000 });
  rich.players.p1.cash = 1000;
  const a = tick(rich, 60000).state;
  assert.equal(a.players.p1.cash, 0);
  assert.equal(a.players.p1.eliminated, false);

  const poor = paying({ price: 4000 });
  poor.players.p1.cash = 999;
  poor.players.p1.items = [it('junk', -500, 'junk')];
  const { state, events } = tick(poor, 60000);
  assert.equal(state.players.p1.eliminated, true);
  assert.equal(state.players.p1.cash, 0);
  assert.equal(state.players.p1.items.length, 0);
  assert.equal(state.players.p0.cash, 5000 + 999);
  assert.ok(state.players.p0.items.some((x) => x.id === 'junk'));
  assert.ok(events.some((e) => e.type === 'eliminated' && e.by === 'p1'));
  assert.equal(state.phase, 'bidding'); // p2 is still in the auction
});

test('no other buyer left after a failure: unit discarded and the round ends', () => {
  const s = paying({ price: 4000 });
  s.buyIns = { p1: 'in', p2: 'pass', p3: 'pass' };
  s.players.p1.cash = 2000;
  const { state, events } = tick(s, 60000);
  assert.ok(events.some((e) => e.type === 'discarded'));
  assert.equal(state.roundNo, 2);
  assert.equal(state.players.p0.turnsPlayed, 1);
});

test('the last survivor ends the game', () => {
  const s = paying({ price: 4000 });
  s.players.p2.eliminated = true;
  s.players.p3.eliminated = true;
  s.players.p1.cash = 10;
  const { state } = tick(s, 60000);
  assert.equal(state.phase, 'gameover');
  assert.equal(scores(state).length, 4);
});
