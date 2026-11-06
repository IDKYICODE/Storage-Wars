import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, scores, winnerIds } from '../server/game/state.js';
import { viewFor } from '../server/game/view.js';
import { renderEnd } from '../client/js/screens/end.js';

const it = (id, name, value, tier = 'common') => ({ id, tier, name, value, flavor: 'x' });

function finished({ cash = [5000, 9000, 1000], items = [[], [it('s', 'Sword Thing', 3000, 'valuable')], [it('j', 'Junk Thing', -300, 'junk')]] } = {}) {
  const s = createGame(['p0', 'p1', 'p2'].map((id) => ({ id, name: id.toUpperCase() })), 'manual', 1);
  s.order.forEach((id, i) => { s.players[id].cash = cash[i]; s.players[id].items = items[i]; });
  s.phase = 'gameover';
  s.result = { scores: scores(s), winnerIds: winnerIds(s) };
  return s;
}
const html = (s, id = 'p0') => renderEnd(viewFor(s, id));

test('the scoreboard is ranked by total, best first, with cash, items and total shown', () => {
  const h = html(finished());
  assert.ok(h.indexOf('P1') < h.indexOf('P0') && h.indexOf('P0') < h.indexOf('P2'));
  assert.ok(h.includes('$12,000')); // P1: 9000 + 3000
  assert.ok(h.includes('$5,000'));
  assert.ok(h.includes('$700')); // P2: 1000 - 300
});

test('the winner gets the victory banner', () => {
  const h = html(finished());
  assert.ok(h.includes('WINNER'));
  assert.equal((h.match(/class="row winner"/g) || []).length, 1);
});

test('tied winners are both flagged', () => {
  const h = html(finished({ cash: [5000, 5000, 100], items: [[], [], []] }));
  assert.equal((h.match(/class="row winner"/g) || []).length, 2);
  assert.ok(h.includes('WINNERS'));
});

test('every player\'s items are revealed, junk included', () => {
  const h = html(finished(), 'p2');
  assert.match(h, /sword thing/i);
  assert.match(h, /junk thing/i);
});

test('you can leave back to the entry screen; names are escaped', () => {
  const s = finished();
  s.players.p1.name = '<b>Hacker</b>';
  const h = html(s);
  assert.ok(h.includes('data-act="leave"'));
  assert.ok(!h.includes('<b>Hacker</b>'));
  assert.ok(h.includes('&lt;b&gt;Hacker'));
});
