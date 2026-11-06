import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../server/game/state.js';
import { viewFor } from '../server/game/view.js';
import { renderTable } from '../client/js/screens/table.js';
import { renderPayment, paymentTotal } from '../client/js/screens/payment.js';

const it = (id, name, value, tier) => ({ id, tier, name, value, flavor: 'x' });
const RADIO = it('radio', 'Radio Thing', 500, 'common');
const SWORD = it('sword', 'Sword Thing', 3000, 'valuable');
const JUNK = it('junk', 'Junk Thing', -300, 'junk');

/** p1 won at `price`; p1 holds cash and the three items above. */
function paying({ price = 1500, cash = 1000, items = [RADIO, SWORD, JUNK] } = {}) {
  const s = createGame(['p0', 'p1', 'p2'].map((id) => ({ id, name: id.toUpperCase() })), 'manual', 1);
  s.auctioneerId = 'p0';
  s.buyIns = { p1: 'in', p2: 'pass' };
  s.phase = 'payment';
  s.winner = { playerId: 'p1', price };
  s.bid = { amount: price, bidderId: 'p1' };
  s.players.p1.cash = cash;
  s.players.p1.items = items;
  s.deadline = { kind: 'payment', at: 60000 };
  return s;
}
const view = (s, id = 'p1') => viewFor(s, id);

test('the winner sees the suggested payment preselected: cash and the least-overpaying items', () => {
  const html = renderPayment(view(paying()));
  assert.match(html, /id="paycash"[^>]*value="1000"/);
  assert.match(html, /class="pchip [a-z]+ on"[^>]*data-item="radio"/);
  assert.doesNotMatch(html, /class="pchip [a-z]+ on"[^>]*data-item="sword"/);
  assert.match(html, /data-total="1500"/);
  assert.doesNotMatch(html, /data-act="pay"[^>]*disabled/);
});

test('junk items never appear as payment chips', () => {
  const html = renderPayment(view(paying()));
  assert.ok(!html.includes('data-item="junk"'));
  assert.ok(!html.includes('Junk Thing'));
});

test('deselecting below the price disables PAY and says how much is missing', () => {
  const html = renderPayment(view(paying()), { pay: { cash: 1000, ids: [] } });
  assert.match(html, /data-act="pay"[^>]*disabled/);
  assert.match(html, /data-total="1000"/);
  assert.ok(html.includes('$500 short'));
});

test('overpaying is allowed but warned: no change is given', () => {
  const html = renderPayment(view(paying()), { pay: { cash: 1000, ids: ['sword'] } });
  assert.match(html, /data-total="4000"/);
  assert.ok(html.includes('$2,500 lost'));
  assert.doesNotMatch(html, /data-act="pay"[^>]*disabled/);
});

test('paymentTotal adds cash and the chosen item values, ignoring unknown or junk ids', () => {
  const v = view(paying());
  assert.equal(paymentTotal(v, { cash: 200, ids: ['radio', 'sword'] }), 3700);
  assert.equal(paymentTotal(v, { cash: 0, ids: ['ghost', 'junk'] }), 0);
  assert.equal(paymentTotal(v, { cash: -5, ids: [] }), 0);
});

test('a non-winner just sees who is paying, with no PAY button', () => {
  const html = renderPayment(view(paying(), 'p2'));
  assert.ok(html.includes('P1 is paying'));
  assert.ok(!html.includes('data-act="pay"'));
  assert.ok(!html.includes('paycash'));
});

test('a winner who cannot cover the price sees the fine warning', () => {
  const html = renderPayment(view(paying({ price: 9000, cash: 500, items: [RADIO] })));
  assert.ok(html.includes('risk a $1,000 fine') || html.includes('fined $1,000'));
  assert.match(html, /data-act="pay"[^>]*disabled/);
});

test('the table shows the payment panel in the action bar during payment', () => {
  const html = renderTable(view(paying()));
  assert.ok(html.includes('data-act="pay"'));
  assert.ok(html.includes('paycash'));
});

test('a voided reveal stamps VOID! on the table for everyone', () => {
  const s = paying();
  s.phase = 'reveal';
  s.voided = true;
  s.slots = [{ item: { id: 'mold', tier: 'havoc', name: 'Black Mold', value: 0, flavor: 'x' }, faceUp: false }];
  for (const id of ['p0', 'p1', 'p2']) assert.ok(renderTable(view(s, id)).includes('VOID!'), id);
});
