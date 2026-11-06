import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../server/game/state.js';
import { enterBidding } from '../server/game/bidding.js';
import { viewFor } from '../server/game/view.js';
import { renderTable } from '../client/js/screens/table.js';
import { parseAmount } from '../client/js/ui/table-view.js';

/** p1 and p2 bought in; p0 and p3 passed. Bidding is open. */
function bidding({ bid = null, call = 0 } = {}) {
  const s = createGame(['p0', 'p1', 'p2', 'p3'].map((id) => ({ id, name: id.toUpperCase() })), 1);
  s.buyIns = { p0: 'pass', p1: 'in', p2: 'in', p3: 'pass' };
  enterBidding(s, 0);
  s.bid = bid;
  s.call = call;
  return s;
}
const html = (s, id, ui) => renderTable(viewFor(s, id), ui);

test('a buy-in player who is not leading sees bid buttons relative to the current bid', () => {
  const s = bidding({ bid: { amount: 300, bidderId: 'p1' } });
  const h = html(s, 'p2');
  assert.match(h, /data-act="bid" data-amount="400"/);
  assert.match(h, /data-act="bid" data-amount="800"/);
  assert.match(h, /data-act="bid" data-amount="1300"/);
});

test('the opening bid buttons start from $100', () => {
  const h = html(bidding(), 'p1');
  assert.match(h, /data-act="bid" data-amount="100"/);
  assert.match(h, /data-act="bid" data-amount="500"/);
  assert.match(h, /data-act="bid" data-amount="1000"/);
});

test('the leader sees "You\'re winning" and no bid buttons', () => {
  const h = html(bidding({ bid: { amount: 300, bidderId: 'p1' } }), 'p1');
  assert.ok(h.includes("You're winning"));
  assert.ok(!h.includes('data-act="bid"'));
});

test('players who passed never see bid buttons', () => {
  const s = bidding({ bid: { amount: 300, bidderId: 'p1' } });
  assert.ok(!html(s, 'p0').includes('data-act="bid"'));
  assert.ok(html(s, 'p0').includes('You are watching this auction'));
  assert.ok(!html(s, 'p3').includes('data-act="bid"'));
  assert.ok(html(s, 'p3').includes('You are watching this auction'));
});

test('there is no call button for anyone; everyone sees the automatic call banner', () => {
  const s = bidding({ bid: { amount: 300, bidderId: 'p1' }, call: 1 });
  for (const id of ['p0', 'p1', 'p2', 'p3']) {
    const h = html(s, id);
    assert.ok(!h.includes('data-act="call"'), id);
    assert.ok(h.includes('GOING ONCE…'), id);
  }
  assert.ok(html(bidding({ bid: { amount: 300, bidderId: 'p1' }, call: 2 }), 'p3').includes('GOING TWICE…'));
});

test('a custom bid above your cash is blocked with a clear message', () => {
  const s = bidding({ bid: { amount: 300, bidderId: 'p1' } });
  const over = html(s, 'p2', { custom: '9000' });
  assert.ok(over.includes('more than the cash you have'));
  assert.ok(over.includes('$5,000'));
  assert.match(over, /data-act="bidcustom"[^>]*disabled/);
  const fine = html(s, 'p2', { custom: '600' });
  assert.ok(!fine.includes('more than the cash you have'));
  assert.doesNotMatch(fine, /data-act="bidcustom"[^>]*disabled/);
});

test('quick-bid buttons that would exceed your cash are switched off', () => {
  const s = bidding({ bid: { amount: 4800, bidderId: 'p1' } }); // +1000 = 5800 > $5,000
  const h = html(s, 'p2');
  assert.match(h, /data-amount="5800"[^>]*disabled/);
  assert.doesNotMatch(h, /data-amount="4900"[^>]*disabled/);
});

test('custom amounts must be multiples of 100, above the current bid, and numeric', () => {
  const s = bidding({ bid: { amount: 300, bidderId: 'p1' } });
  const disabled = (custom) => /data-act="bidcustom"[^>]*disabled/.test(html(s, 'p2', { custom }));
  for (const bad of ['', 'abc', '350', '300', '200', '-400', '1e3', '12.5', ' ']) assert.equal(disabled(bad), true, JSON.stringify(bad));
  for (const good of ['400', '5000']) assert.equal(disabled(good), false, good);
  assert.equal(disabled('90000'), true); // above what p2 can pay
});

test('parseAmount accepts only whole multiples of 100 of at least 100', () => {
  assert.equal(parseAmount('400'), 400);
  assert.equal(parseAmount(' 1200 '), 1200);
  for (const bad of ['', 'x', '50', '150', '0', '-100', '1.5', '1e3', null, undefined]) assert.equal(parseAmount(bad), null, String(bad));
});

test('the bid panel shows the current bid and the leader', () => {
  const h = html(bidding({ bid: { amount: 1200, bidderId: 'p2' } }), 'p3');
  assert.ok(h.includes('$1,200'));
  assert.ok(h.includes('P2'));
  assert.ok(html(bidding(), 'p3').includes('No bids yet'));
});
