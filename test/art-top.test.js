import test from 'node:test';
import assert from 'node:assert/strict';
import { ITEMS } from '../shared/cards.js';
import { topArt } from '../client/js/art/top.js';
import { getArt } from '../client/js/ui/card.js';
import { assertArtSet } from './helpers/svg.js';

const ids = ITEMS.filter((i) => ['valuable', 'unique', 'havoc'].includes(i.tier)).map((i) => i.id);

test('all 15 valuable, unique and havoc items have their own illustration in the approved style', () => {
  assert.equal(ids.length, 15);
  assertArtSet(topArt, ids);
});

test('the showpiece cards are richer than the junk tier (at least 800 characters of drawing)', () => {
  for (const id of ids) assert.ok(topArt[id]().length >= 800, `${id} is too thin`);
});

test('importing the module registers the art with the card renderer', () => {
  for (const id of ids) assert.equal(getArt(id), topArt[id]());
});
