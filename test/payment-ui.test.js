import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../server/game/state.js';
import { viewFor } from '../server/game/view.js';
import { renderTable } from '../client/js/screens/table.js';

function revealing() {
  const s = createGame(['p0', 'p1', 'p2'].map((id) => ({ id, name: id.toUpperCase() })), 1);
  s.buyIns = { p0: 'pass', p1: 'in', p2: 'pass' };
  s.phase = 'reveal';
  s.winner = { playerId: 'p1', price: 1500 };
  s.bid = { amount: 1500, bidderId: 'p1' };
  return s;
}
const view = (s, id = 'p1') => viewFor(s, id);

test('the headline says who paid what and opens the unit; there is no payment panel', () => {
  const html = renderTable(view(revealing(), 'p2'));
  assert.ok(html.includes('P1 paid $1,500 and opens the unit'));
  assert.ok(!html.includes('paypanel') && !html.includes('data-act="pay"') && !html.includes('paycash'));
});

test('a voided reveal stamps VOID! on the table for everyone', () => {
  const s = revealing();
  s.voided = true;
  s.slots = [{ item: { id: 'mold', tier: 'havoc', name: 'Black Mold', value: 0, flavor: 'x' }, faceUp: false }];
  for (const id of ['p0', 'p1', 'p2']) assert.ok(renderTable(view(s, id)).includes('VOID!'), id);
});
