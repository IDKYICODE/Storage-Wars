import test from 'node:test';
import assert from 'node:assert/strict';
import { ITEMS, UNITS, UNIT_IDS, TIERS, ROOM_CODE_ALPHABET } from '../shared/cards.js';

const byTier = (t) => ITEMS.filter((i) => i.tier === t);
const values = (t) => byTier(t).map((i) => i.value).sort((a, b) => a - b);
const rep = (v, n) => Array(n).fill(v);

test('deck has 56 unique items with the right tier counts', () => {
  assert.equal(ITEMS.length, 56);
  assert.equal(new Set(ITEMS.map((i) => i.id)).size, 56);
  assert.deepEqual(TIERS.map((t) => byTier(t).length), [19, 22, 9, 2, 4]);
});

test('item values match the spec table per tier', () => {
  assert.deepEqual(values('junk'), [...rep(-500, 2), ...rep(-400, 2), ...rep(-300, 4), ...rep(-200, 5), ...rep(-100, 6)]);
  assert.deepEqual(values('common'), [...rep(0, 4), ...rep(100, 3), ...rep(200, 3), ...rep(300, 4), ...rep(500, 4), ...rep(700, 4)]);
  assert.deepEqual(values('valuable'), [2000, 2500, 3000, 3500, 4000, 5000, 6000, 8000, 9000]);
  assert.deepEqual(values('unique'), [12000, 15000]);
  assert.deepEqual(values('havoc'), [0, 0, 0, 0]);
});

test('named cards from the manual and the spec exist with the right values', () => {
  const get = (name) => ITEMS.find((i) => i.name === name);
  assert.equal(get('Vintage Pocketwatch').value, 8000);
  assert.equal(get('Antique Sword').value, 9000);
  assert.equal(get('Modern Painting').value, 15000);
  assert.equal(get('Dinosaur Fossil').value, 12000);
  for (const n of ['Black Mold', 'Water Damage', 'Fire Damage', 'Termite Nest']) {
    assert.equal(get(n).tier, 'havoc');
  }
});

test('storage units: 16 cards, 48 items, settings per type', () => {
  assert.deepEqual(UNIT_IDS, ['locker', 'small', 'medium', 'large', 'jumbo']);
  assert.equal(UNIT_IDS.reduce((n, id) => n + UNITS[id].count, 0), 16);
  assert.equal(UNIT_IDS.reduce((n, id) => n + UNITS[id].count * UNITS[id].items, 0), 48);
  const pick = ({ items, flip, peek }) => ({ items, flip, peek });
  assert.deepEqual(pick(UNITS.locker), { items: 1, flip: false, peek: 'never' });
  assert.deepEqual(pick(UNITS.small), { items: 2, flip: false, peek: 'after' });
  assert.deepEqual(pick(UNITS.medium), { items: 3, flip: false, peek: 'before' });
  assert.deepEqual(pick(UNITS.large), { items: 4, flip: true, peek: 'after' });
  assert.deepEqual(pick(UNITS.jumbo), { items: 5, flip: true, peek: 'before' });
});

test('every item has a short unique flavor line; havoc flavor is the fixed rule text', () => {
  const flavors = ITEMS.map((i) => i.flavor);
  for (const f of flavors) {
    assert.equal(typeof f, 'string');
    assert.ok(f.length > 0, 'empty flavor');
  }
  for (const i of ITEMS.filter((x) => x.tier !== 'havoc')) assert.ok(i.flavor.length <= 90, i.id);
  const nonHavoc = ITEMS.filter((x) => x.tier !== 'havoc').map((x) => x.flavor);
  assert.equal(new Set(nonHavoc).size, nonHavoc.length); // havoc cards share one rule text by design
  for (const i of byTier('havoc')) {
    assert.equal(i.flavor, 'Void the entire Storage Unit and its Items if this Havoc card is Flipped or Won.');
  }
});

test('room code alphabet has 24 letters and no O or I', () => {
  assert.equal(ROOM_CODE_ALPHABET.length, 24);
  assert.ok(!ROOM_CODE_ALPHABET.includes('O'));
  assert.ok(!ROOM_CODE_ALPHABET.includes('I'));
  assert.match(ROOM_CODE_ALPHABET, /^[A-Z]+$/);
});
