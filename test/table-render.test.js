import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, beginRoundPhase } from '../server/game/state.js';
import { viewFor } from '../server/game/view.js';
import { renderTable } from '../client/js/screens/table.js';
import { UNITS } from '../shared/cards.js';

const item = (i, tier = 'valuable') => ({ id: `sentinel-${i}`, tier, name: `Sentinel Name ${i}`, value: 1000 * (i + 1), flavor: `Flavor ${i}` });

/** Four players, p0 Auctioneer, a jumbo with five distinctly named crates. */
function setup({ unit = 'jumbo', mode = 'manual', phase } = {}) {
  const s = createGame(['p0', 'p1', 'p2', 'p3'].map((id) => ({ id, name: id.toUpperCase() })), mode, 1);
  const { count, ...u } = UNITS[unit];
  s.auctioneerId = 'p0';
  s.unit = u;
  s.slots = Array.from({ length: u.items }, (_, i) => ({ item: item(i), faceUp: false }));
  s.peeks = {};
  beginRoundPhase(s, 0);
  if (phase) s.phase = phase;
  return s;
}
const html = (s, id, ui) => renderTable(viewFor(s, id), ui);

test('buy-in: every player, the Auctioneer included, is offered Buy in and Pass at the same time', () => {
  const s = setup({ unit: 'locker' }); // locker: no flip, goes straight to buy-in
  for (const bidder of ['p0', 'p1', 'p2', 'p3']) {
    assert.ok(html(s, bidder).includes('Buy in $100'), bidder);
    assert.ok(html(s, bidder).includes('>Pass<'), bidder);
  }
});

test('once you have decided you are not offered the buttons again', () => {
  const s = setup({ unit: 'locker' });
  s.buyIns = { p2: 'in' };
  assert.ok(!html(s, 'p2').includes('Buy in $100'));
  assert.ok(html(s, 'p1').includes('Buy in $100'));
});

test('the buy-in button shows the room\'s fee', () => {
  const s = setup({ unit: 'locker' });
  s.config.buyIn = 500;
  assert.ok(html(s, 'p1').includes('Buy in $500'));
});

test('a broke player cannot buy in', () => {
  const s = setup({ unit: 'locker' });
  s.players.p1.cash = 50;
  assert.match(html(s, 'p1'), /data-act="buyin"[^>]*disabled/);
});

test('face-down crates show the card back and never an item name to people who have not peeked', () => {
  const s = setup({ unit: 'medium' });
  s.phase = 'buyin';
  s.peeks = { p1: [1] };
  const p2 = html(s, 'p2');
  assert.equal((p2.match(/class="back"/g) || []).length, 3);
  assert.ok(!/sentinel name/i.test(p2)); // card titles are upper-case, so match any case
  const p1 = html(s, 'p1');
  assert.match(p1, /sentinel name 1/i);
  assert.ok(!/sentinel name 0/i.test(p1) && !/sentinel name 2/i.test(p1));
  assert.ok(p1.includes('PEEKED'));
});

test('a flipped crate is shown face-up to everyone with a FLIPPED label', () => {
  const s = setup({ unit: 'jumbo' });
  s.slots[2].faceUp = true;
  s.phase = 'buyin';
  for (const id of ['p0', 'p1', 'p3']) {
    const h = html(s, id);
    assert.match(h, /sentinel name 2/i, id);
    assert.ok(h.includes('FLIPPED'), id);
  }
});

test('flip phase (manual): the Auctioneer can tap crates to flip, others see who is choosing', () => {
  const s = setup({ unit: 'jumbo', mode: 'manual' });
  assert.equal(s.phase, 'flip');
  const a = html(s, 'p0', { pick: 'flip' });
  assert.equal((a.match(/class="crate tap"/g) || []).length, 5);
  assert.ok(a.includes('data-pick="flip"'));
  const other = html(s, 'p2');
  assert.ok(!/class="crate tap"/.test(other));
  assert.ok(other.includes('P0 is choosing'));
});

test('flip phase (auto): nobody can flip and the badge says AUTO', () => {
  const s = setup({ unit: 'jumbo', mode: 'auto' });
  const a = html(s, 'p0');
  assert.ok(!a.includes('data-pick="flip"'));
  assert.ok(a.includes('AUTO'));
});

test('peek: a peek button appears when allowed, and tapping mode makes crates tappable', () => {
  const s = setup({ unit: 'medium' });
  s.phase = 'buyin';
  const without = html(s, 'p2');
  assert.ok(without.includes('data-pick="peek"'));
  assert.ok(!/class="crate tap"/.test(without));
  const picking = html(s, 'p2', { pick: 'peek' });
  assert.equal((picking.match(/class="crate tap"/g) || []).length, 3);
  const locker = setup({ unit: 'locker' });
  assert.ok(!html(locker, 'p2').includes('data-pick="peek"'));
});

test('peek window: buyers see Ready; others do not', () => {
  const s = setup({ unit: 'small' });
  s.phase = 'peekwin';
  s.buyIns = { p1: 'in', p2: 'pass', p3: 'in' };
  assert.ok(html(s, 'p1').includes('data-act="ready"'));
  assert.ok(!html(s, 'p2').includes('data-act="ready"'));
});

test('the player strip shows every player with cash and an item count, never item names', () => {
  const s = setup({ unit: 'locker' });
  s.players.p2.items = [{ id: 'own-1', tier: 'unique', name: 'Secret Holding', value: 9000, flavor: 'x' }];
  const h = html(s, 'p1');
  for (const id of ['P0', 'P1', 'P2', 'P3']) assert.ok(h.includes(`>${id}<`), id);
  assert.ok(h.includes('$5,000'));
  assert.ok(!h.includes('Secret Holding'));
  assert.ok(html(s, 'p2').includes('Secret Holding')); // owner sees their own
});

test('the headline shows the round number and the countdown carries its deadline', () => {
  const s = setup({ unit: 'locker' });
  s.roundNo = 3;
  s.deadline = { kind: 'buyin', at: 123456 };
  const h = html(s, 'p1');
  assert.ok(h.includes('Round 3 of 8'));
  assert.ok(h.includes('data-at="123456"'));
});

test('names are escaped everywhere in the table', () => {
  const s = setup({ unit: 'locker' });
  s.players.p2.name = '<img src=x onerror=alert(1)>';
  const h = html(s, 'p1');
  assert.ok(!h.includes('<img src=x'));
  assert.ok(h.includes('&lt;img'));
});

test('eliminated players are marked in the strip', () => {
  const s = setup({ unit: 'locker' });
  s.players.p3.eliminated = true;
  assert.ok(/class="chip[^"]*out/.test(html(s, 'p1')));
});

test('the Auctioneer is told how their seat differs: they collect fees, can bid, and pay the bank', () => {
  const s = setup({ unit: 'locker' });
  const note = 'You are the Auctioneer';
  assert.ok(html(s, 'p0').includes(note));
  assert.ok(!html(s, 'p1').includes(note));
  s.phase = 'bidding';
  s.buyIns = { p1: 'in', p2: 'in' };
  assert.ok(html(s, 'p0').includes(note));
  assert.ok(html(s, 'p0').includes('can bid too'));
  assert.ok(html(s, 'p0').includes('go to the bank'));
});
