import test from 'node:test';
import assert from 'node:assert/strict';
import { tick, setPresence, reduce } from '../server/game/engine.js';
import { createGame, beginRoundPhase } from '../server/game/state.js';
import { UNITS } from '../shared/cards.js';

function setup(unit) {
  const s = createGame(['p0', 'p1', 'p2', 'p3'].map((id) => ({ id, name: id })), 1);
  const { count, ...u } = UNITS[unit];
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
  assert.equal(out.state.buyIns.p0, undefined); // so is p0
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

test('an offline player never stalls the auction: the game keeps its own clocks', () => {
  let s = setup('jumbo');
  s = setPresence(s, 'p0', false, 0).state;
  assert.equal(s.phase, 'flip');
  const out = tick(s, 2000); // the automatic flip fires on time whoever is offline
  assert.equal(out.state.phase, 'buyin');
  assert.ok(out.events.some((e) => e.type === 'flipped'));
});
