import test from 'node:test';
import assert from 'node:assert/strict';
import { tick, setPresence, reduce } from '../server/game/engine.js';
import { createGame, beginRoundPhase } from '../server/game/state.js';
import { UNITS } from '../shared/cards.js';

function setup(unit) {
  const s = createGame(['p0', 'p1', 'p2', 'p3'].map((id) => ({ id, name: id })), 'manual', 1);
  const { count, ...u } = UNITS[unit];
  s.auctioneerId = 'p0';
  s.unit = u;
  s.slots = Array.from({ length: u.items }, (_, i) => ({ item: { id: `t${i}`, tier: 'common', name: 't', value: 100 }, faceUp: false }));
  beginRoundPhase(s, 0);
  return s;
}

const reduceBuy = (s, by) => reduce(s, { type: 'buyin', by }, 0).state;

test('setPresence records who is offline and since when', () => {
  const s = setup('locker');
  const off = setPresence(s, 'p2', false, 500).state;
  assert.equal(off.players.p2.connected, false);
  assert.equal(off.players.p2.offlineSince, 500);
  const on = setPresence(off, 'p2', true, 900).state;
  assert.equal(on.players.p2.connected, true);
  assert.equal(on.players.p2.offlineSince, null);
  assert.equal(s.players.p2.connected, true); // input untouched
});

test('offline players still undecided pass for themselves after a short grace; online players are left alone', () => {
  let s = setup('locker');
  s = setPresence(s, 'p1', false, 0).state;
  s = setPresence(s, 'p2', false, 0).state;
  const early = tick(s, 7000); // inside the 8 s grace: a refreshed page can still get back in
  assert.equal(early.state, s);
  const out = tick(s, 9000);
  assert.equal(out.state.buyIns.p1, 'pass');
  assert.equal(out.state.buyIns.p2, 'pass');
  assert.equal(out.state.buyIns.p3, undefined); // p3 is online and still deciding
  assert.equal(out.state.phase, 'buyin');
  assert.deepEqual(out.events.filter((e) => e.type === 'pass').map((e) => e.by), ['p1', 'p2']);
});

test('a player who already bought in is not passed just because they went offline', () => {
  let s = setup('locker');
  s = reduceBuy(s, 'p1');
  s = setPresence(s, 'p1', false, 0).state;
  const out = tick(s, 30000);
  assert.equal(out.state.buyIns.p1, 'in');
});

test('a Manual Auctioneer offline 19 s stays manual; at 21 s the server takes over', () => {
  let s = setup('jumbo');
  assert.equal(s.phase, 'flip');
  s = setPresence(s, 'p0', false, 1000).state;
  const early = tick(s, 20000);
  assert.equal(early.state.roundAuto, false);
  assert.equal(early.state, s);
  const late = tick(s, 22000);
  assert.equal(late.state.roundAuto, true);
  assert.ok(late.events.some((e) => e.type === 'auto-takeover'));
  assert.deepEqual(late.state.deadline, { kind: 'auto-flip', at: 24000 });
  assert.equal(tick(late.state, 24000).state.phase, 'buyin');
});

test('the takeover also re-arms an open auction with the auto closing sequence', () => {
  let s = setup('locker');
  s.phase = 'bidding';
  s.buyIns = { p1: 'in', p2: 'pass', p3: 'pass' };
  s.bid = { amount: 100, bidderId: 'p1' };
  s.deadline = { kind: 'bid-idle', at: 45000 };
  s = setPresence(s, 'p0', false, 0).state;
  const out = tick(s, 21000);
  assert.equal(out.state.roundAuto, true);
  assert.deepEqual(out.state.deadline, { kind: 'call', at: 24000 });
});

test('coming back online before the takeover cancels it', () => {
  let s = setup('jumbo');
  s = setPresence(s, 'p0', false, 0).state;
  s = setPresence(s, 'p0', true, 15000).state;
  assert.equal(tick(s, 40000).state.roundAuto, false);
});
