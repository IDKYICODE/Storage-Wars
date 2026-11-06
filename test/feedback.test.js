import test from 'node:test';
import assert from 'node:assert/strict';
import { feedbackFor } from '../client/js/ui/feedback.js';

const ctx = { you: 'p1', nameOf: (id) => ({ p0: 'Ayush', p1: 'Bea', p2: 'Cal' })[id] ?? 'Someone' };
const all = (events) => feedbackFor(events, ctx);
const find = (list, key) => list.find((f) => f[key]);

test('a Havoc found by a flip voids the round with a stamp, a shake and the Havoc sound', () => {
  const list = all([
    { type: 'flipped', index: 2, item: { id: 'havoc-black-mold', tier: 'havoc' } },
    { type: 'voided', reason: 'flip', item: { id: 'havoc-black-mold', tier: 'havoc' } },
    { type: 'round-end', roundNo: 3 },
  ]);
  assert.deepEqual(find(list, 'banner').banner, { text: 'VOID!', kind: 'void' });
  assert.equal(find(list, 'sound').sound, 'revealHavoc');
  assert.ok(list.some((f) => f.shake));
});

test('winning a Havoc unit also stamps VOID! (once)', () => {
  const list = all([{ type: 'voided', reason: 'won', item: { tier: 'havoc' } }]);
  assert.equal(list.filter((f) => f.banner?.text === 'VOID!').length, 1);
});

test('an auction nobody bought into says so', () => {
  const list = all([{ type: 'discarded' }]);
  assert.match(find(list, 'toast').toast, /nobody bought in/i);
});

test('SOLD, fines, eliminations and takeovers keep their feedback', () => {
  const sold = all([{ type: 'sold', playerId: 'p2', price: 1200 }]);
  assert.equal(find(sold, 'banner').banner.text, 'SOLD!');
  assert.ok(sold.some((f) => f.slam));
  assert.match(find(sold, 'toast').toast, /Cal wins it for \$1,200/);
  const fined = all([{ type: 'fined', by: 'p0', amount: 1000 }]);
  assert.equal(find(fined, 'banner').banner.text, 'FINED $1,000');
  assert.equal(find(fined, 'sound').sound, 'fine');
  const outMe = all([{ type: 'eliminated', by: 'p1' }]);
  assert.equal(find(outMe, 'banner').banner.text, 'YOU ARE OUT');
  const outOther = all([{ type: 'eliminated', by: 'p2' }]);
  assert.equal(find(outOther, 'banner').banner.text, 'ELIMINATED');
});

test('calls and bids map to sounds; unknown events do nothing', () => {
  assert.equal(find(all([{ type: 'call', n: 1 }]), 'sound').sound, 'gavel1');
  assert.equal(find(all([{ type: 'call', n: 2 }]), 'sound').sound, 'gavel2');
  assert.equal(find(all([{ type: 'bid', by: 'p0', amount: 100 }]), 'sound').sound, 'bid');
  assert.equal(find(all([{ type: 'buyin', by: 'p0' }]), 'sound').sound, 'buyin');
  assert.deepEqual(all([{ type: 'mystery' }, { type: 'pass', by: 'p0' }]), []);
});
