import test from 'node:test';
import assert from 'node:assert/strict';
import { ITEMS } from '../shared/cards.js';
import { commonArt } from '../client/js/art/common.js';
import { getArt } from '../client/js/ui/card.js';
import { assertArtSet } from './helpers/svg.js';

const ids = ITEMS.filter((i) => i.tier === 'common').map((i) => i.id);

test('all 22 common items have their own illustration in the approved style', () => {
  assert.equal(ids.length, 22);
  assertArtSet(commonArt, ids);
});

test('importing the module registers the art with the card renderer', () => {
  for (const id of ids) assert.equal(getArt(id), commonArt[id]());
});
