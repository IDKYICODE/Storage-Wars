import test from 'node:test';
import assert from 'node:assert/strict';
import { ITEMS } from '../shared/cards.js';
import { junkArt } from '../client/js/art/junk.js';
import { getArt } from '../client/js/ui/card.js';
import { assertArtSet, assertWellFormed } from './helpers/svg.js';

const ids = ITEMS.filter((i) => i.tier === 'junk').map((i) => i.id);

test('all 19 junk items have their own illustration in the approved style', () => {
  assert.equal(ids.length, 19);
  assertArtSet(junkArt, ids);
});

test('importing the module registers the art with the card renderer', () => {
  for (const id of ids) assert.equal(getArt(id), junkArt[id]());
});

test('the well-formedness check really catches broken markup', () => {
  assert.throws(() => assertWellFormed('<g><rect/>', 'x'));
  assert.throws(() => assertWellFormed('<g></path>', 'x'));
  assert.doesNotThrow(() => assertWellFormed('<g><rect width="1"/></g>', 'x'));
});
