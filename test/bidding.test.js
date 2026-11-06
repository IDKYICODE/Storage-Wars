import test from 'node:test';
import assert from 'node:assert/strict';
import { reduce, tick } from '../server/game/engine.js';
import { createGame } from '../server/game/state.js';
import { enterBidding } from '../server/game/bidding.js';

/** p1 and p2 bought in, p0 and p3 passed; bidding just opened at t=0 (round 1). */
function bidding() {
  const s = createGame(['p0', 'p1', 'p2', 'p3'].map((id) => ({ id, name: id })), 1);
  s.buyIns = { p0: 'pass', p1: 'in', p2: 'in', p3: 'pass' };
  enterBidding(s, 0);
  return s;
}
const act = (s, type, by, extra = {}, now = 0) => reduce(s, { type, by, ...extra }, now);
const code = (fn) => { try { fn(); } catch (e) { return e.code; } return null; };

test('nobody can bid more than they can pay: cash plus the value of their items', () => {
  const s = bidding();
  s.players.p1.cash = 700;
  s.players.p1.items = [{ id: 'rug', tier: 'valuable', name: 'Rug', value: 1500, flavor: 'x' }, { id: 'jnk', tier: 'junk', name: 'Junk', value: -400, flavor: 'x' }];
  // p1 can pay 700 + 1500 = 2200 (junk never counts)
  assert.equal(code(() => act(s, 'bid', 'p1', { amount: 2300 })), 'invalid');
  assert.equal(code(() => act(s, 'bid', 'p1', { amount: 1e12 })), 'invalid');
  assert.equal(code(() => act(s, 'bid', 'p1', { amount: 2200 })), null);
  // p2 is richer and can still outbid p1's best
  assert.equal(code(() => act(act(s, 'bid', 'p1', { amount: 2200 }).state, 'bid', 'p2', { amount: 2300 })), null);
});

test('bad bid amounts are rejected', () => {
  const s = bidding();
  for (const amount of [150, 0, -100, NaN, '200', 99, undefined, 100.5]) {
    assert.equal(code(() => act(s, 'bid', 'p1', { amount })), 'invalid', String(amount));
  }
  const withBid = act(s, 'bid', 'p1', { amount: 300 }).state;
  assert.equal(code(() => act(withBid, 'bid', 'p2', { amount: 300 })), 'invalid');
  assert.equal(code(() => act(withBid, 'bid', 'p2', { amount: 200 })), 'invalid');
  assert.deepEqual(act(withBid, 'bid', 'p2', { amount: 400 }).state.bid, { amount: 400, bidderId: 'p2' });
});

test('only buy-in players bid; a player who passed and the current leader cannot', () => {
  const s = bidding();
  assert.equal(code(() => act(s, 'bid', 'p0', { amount: 100 })), 'not-allowed');
  assert.equal(code(() => act(s, 'bid', 'p3', { amount: 100 })), 'not-allowed');
  const led = act(s, 'bid', 'p1', { amount: 100 }).state;
  assert.equal(code(() => act(led, 'bid', 'p1', { amount: 200 })), 'not-allowed');
});

test('a bid after SOLD is too late', () => {
  const s = bidding();
  let st = act(s, 'bid', 'p1', { amount: 100 }).state;
  st = tick(tick(tick(st, 3000).state, 6000).state, 9000).state;
  assert.equal(st.phase, 'payment');
  assert.equal(code(() => act(st, 'bid', 'p2', { amount: 200 }, 9001)), 'too-late');
});

test('auto: once at 3s, twice at 6s, SOLD at 9s; a new bid restarts the count', () => {
  let s = bidding();
  assert.deepEqual(s.deadline, { kind: 'opening', at: 10000 });
  s = act(s, 'bid', 'p1', { amount: 100 }, 0).state;
  assert.deepEqual(s.deadline, { kind: 'call', at: 3000 });
  let out = tick(s, 3000);
  assert.equal(out.state.call, 1);
  assert.deepEqual(out.events, [{ type: 'call', n: 1 }]);
  out = tick(out.state, 6000);
  assert.equal(out.state.call, 2);
  // a late bid at 7s resets everything
  const reset = act(out.state, 'bid', 'p2', { amount: 200 }, 7000).state;
  assert.equal(reset.call, 0);
  assert.deepEqual(reset.deadline, { kind: 'call', at: 10000 });
  let end = tick(tick(tick(reset, 10000).state, 13000).state, 16000);
  assert.equal(end.state.phase, 'payment');
  assert.deepEqual(end.state.winner, { playerId: 'p2', price: 200 });
  assert.ok(end.events.some((e) => e.type === 'sold' && e.playerId === 'p2' && e.price === 200));
  assert.deepEqual(end.state.deadline, { kind: 'payment', at: 16000 + 60000 });
});

test('auto: no opening bid by 10s assigns $100 to the first buyer in seat order for this round', () => {
  const out = tick(bidding(), 10000);
  assert.deepEqual(out.state.bid, { amount: 100, bidderId: 'p1' });
  assert.deepEqual(out.state.deadline, { kind: 'call', at: 13000 });
  assert.ok(out.events.some((e) => e.type === 'bid' && e.auto === true && e.by === 'p1'));
});

test('there is no human call action: the Auctioneer is the game itself', () => {
  assert.equal(code(() => act(bidding(), 'call', 'p0')), 'invalid');
  assert.equal(code(() => act(bidding(), 'flip', 'p0', { index: 0 })), 'invalid');
});

test('the free opening bid rotates with the round, so it is not always the same seat', () => {
  const s = bidding();
  s.roundNo = 2; // seat order now starts at p1... p1 is first, so give p2 the lead by making p1 pass
  s.buyIns = { p0: 'pass', p1: 'pass', p2: 'in', p3: 'in' };
  assert.equal(tick(s, 10000).state.bid.bidderId, 'p2');
  s.roundNo = 4;
  s.buyIns = { p0: 'in', p1: 'in', p2: 'in', p3: 'in' };
  assert.equal(tick(s, 10000).state.bid.bidderId, 'p3');
});
