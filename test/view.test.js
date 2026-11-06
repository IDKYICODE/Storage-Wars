import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, beginRoundPhase } from '../server/game/state.js';
import { viewFor, filterEvents } from '../server/game/view.js';
import { UNITS } from '../shared/cards.js';

const hid = (i) => ({ id: `hid-${i}`, tier: 'valuable', name: `HiddenName${i}`, value: 1000 * (i + 1) });

/** 4 players, p0 Auctioneer, a 5-crate jumbo in the buy-in phase; peeks: p0->1, p1->2, p2->4. */
function midRound() {
  const s = createGame(['p0', 'p1', 'p2', 'p3'].map((id) => ({ id, name: id })), 'manual', 1);
  const { count, ...u } = UNITS.jumbo;
  s.auctioneerId = 'p0';
  s.unit = u;
  s.slots = [0, 1, 2, 3, 4].map((i) => ({ item: hid(i), faceUp: false }));
  s.itemDeck = [{ id: 'deck-secret-1', tier: 'junk', name: 'DeckSecret1', value: -100 }];
  beginRoundPhase(s, 0);
  s.slots[0].faceUp = true; // flipped face-up: public
  s.phase = 'buyin';
  s.peeks = { p0: [1], p1: [2], p2: [4] };
  return s;
}
const text = (s, id) => JSON.stringify(viewFor(s, id));

test('a view never contains a face-down card the viewer has not peeked (or the deck)', () => {
  const s = midRound();
  const expectVisible = { p0: [0, 1], p1: [0, 2], p2: [0, 4], p3: [0] };
  for (const [viewer, visible] of Object.entries(expectVisible)) {
    const t = text(s, viewer);
    for (let i = 0; i < 5; i++) {
      const should = visible.includes(i);
      assert.equal(t.includes(`hid-${i}`), should, `${viewer} sees hid-${i}: ${should}`);
      assert.equal(t.includes(`HiddenName${i}`), should, `${viewer} sees HiddenName${i}: ${should}`);
    }
    assert.ok(!t.includes('deck-secret-1') && !t.includes('DeckSecret1'), 'deck leaked');
  }
});

test('slots report whether the viewer peeked them', () => {
  const v = viewFor(midRound(), 'p1');
  assert.deepEqual(v.slots.map((x) => [x.faceUp, x.item?.id ?? null]), [
    [true, 'hid-0'], [false, null], [false, 'hid-2'], [false, null], [false, null],
  ]);
  assert.equal(v.slots[2].peeked, true);
  assert.equal(v.slots[0].peeked, false);
});

test("other players' items are only a count, until game over", () => {
  const s = midRound();
  s.players.p0.items = [{ id: 'own-secret', tier: 'unique', name: 'OwnSecretName', value: 15000 }];
  assert.ok(!text(s, 'p1').includes('own-secret') && !text(s, 'p1').includes('OwnSecretName'));
  assert.equal(viewFor(s, 'p1').players.find((p) => p.id === 'p0').itemCount, 1);
  assert.equal(viewFor(s, 'p0').myItems[0].id, 'own-secret');
  s.phase = 'gameover';
  s.result = { scores: [], winnerIds: ['p0'] };
  assert.ok(text(s, 'p1').includes('own-secret'));
  assert.equal(viewFor(s, 'p1').gameover.allItems.p0[0].id, 'own-secret');
});

test('during the reveal only the winner sees the unit; a voided unit shows just the Havoc card', () => {
  const s = midRound();
  s.phase = 'reveal';
  s.winner = { playerId: 'p2', price: 500 };
  s.peeks = {};
  s.slots[0].faceUp = false;
  assert.ok(text(s, 'p2').includes('hid-3'));
  assert.ok(!text(s, 'p3').includes('hid-3'));
  s.voided = true;
  s.slots[3].item = { id: 'the-mold', tier: 'havoc', name: 'Black Mold', value: 0 };
  assert.ok(text(s, 'p3').includes('the-mold'));
  assert.ok(!text(s, 'p3').includes('hid-1'));
});

test('can-flags follow the phase, the role and the mode', () => {
  const s = midRound();
  const can = (id) => viewFor(s, id).can;
  for (const id of ['p1', 'p2', 'p3']) assert.deepEqual([can(id).buyin, can(id).pass], [true, true], id); // all at once
  s.buyIns = { p2: 'pass' };
  assert.deepEqual([can('p2').buyin, can('p2').pass], [false, false]); // decided already
  s.buyIns = {};
  assert.equal(can('p0').buyin, false);
  assert.equal(can('p0').flip, false);
  assert.equal(can('p3').flip, false);
  assert.equal(can('p0').peek, false); // already peeked
  assert.equal(can('p3').peek, true); // jumbo allows peeks before buy-in
  s.players.p1.cash = 50;
  assert.equal(viewFor(s, 'p1').can.buyin, false);

  s.phase = 'bidding';
  s.buyIns = { p1: 'in', p2: 'in', p3: 'pass' };
  s.bid = { amount: 300, bidderId: 'p1' };
  assert.equal(can('p0').bid, false);
  assert.equal(can('p1').bid, false); // leader
  assert.equal(can('p2').bid, true);
  assert.equal(can('p3').bid, false);
  assert.equal(can('p0').call, true);
  assert.equal(can('p2').call, false);
  s.mode = 'auto';
  assert.equal(viewFor(s, 'p0').can.call, false);

  s.phase = 'payment';
  s.winner = { playerId: 'p1', price: 300 };
  s.players.p1.cash = 5000; // (earlier in this test p1 was made broke)
  assert.equal(can('p1').pay, true);
  assert.equal(can('p2').pay, false);
  assert.equal(viewFor(s, 'p1').payment.price, 300);
  assert.equal(viewFor(s, 'p2').payment, null);
  assert.ok(viewFor(s, 'p1').payment.suggested);
});

test('buy-in status: pending for undecided buyers, none for the Auctioneer', () => {
  const s = midRound();
  s.buyIns = { p1: 'in' };
  const st = Object.fromEntries(viewFor(s, 'p2').players.map((p) => [p.id, p.buyIn]));
  assert.deepEqual(st, { p0: null, p1: 'in', p2: 'pending', p3: 'pending' });
});

test('filterEvents drops other players private events and never leaks items in public reveals', () => {
  const events = [
    { type: 'peeked', to: 'a', index: 1, item: { id: 'x' } },
    { type: 'peek-used', by: 'a' },
    { type: 'revealed', winnerId: 'a', count: 3, items: [{ id: 'leak' }], item: { id: 'leak2', tier: 'common' } },
    { type: 'revealed', winnerId: 'a', voided: true, item: { id: 'mold', tier: 'havoc' } },
    { type: 'revealed', to: 'a', items: [{ id: 'mine' }] },
    { type: 'flipped', index: 0, item: { id: 'faceup' } },
  ];
  const forA = filterEvents(events, 'a');
  const forB = filterEvents(events, 'b');
  assert.equal(forA.filter((e) => e.type === 'peeked').length, 1);
  assert.equal(forB.filter((e) => e.type === 'peeked').length, 0);
  assert.ok(JSON.stringify(forB).includes('mold'));
  assert.ok(JSON.stringify(forB).includes('faceup'));
  assert.ok(!JSON.stringify(forB).includes('leak'));
  assert.ok(!JSON.stringify(forB).includes('mine'));
  assert.ok(JSON.stringify(forA).includes('mine'));
});

test('a view comes straight out of a fresh real game without throwing', () => {
  const s = createGame(['p0', 'p1', 'p2'].map((id) => ({ id, name: id })), 'auto', 3);
  for (const id of s.order) assert.doesNotThrow(() => viewFor(s, id));
  assert.equal(viewFor(s, 'p0').totalRounds, 6);
});
