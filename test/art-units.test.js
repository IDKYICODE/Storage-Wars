import test from 'node:test';
import assert from 'node:assert/strict';
import { UNITS, UNIT_IDS, TIERS } from '../shared/cards.js';
import { unitArt } from '../client/js/art/units.js';
import { getIcon } from '../client/js/art/icons.js';
import { renderUnitCard, getArt } from '../client/js/ui/card.js';
import { assertArtSet } from './helpers/svg.js';

test('all 5 storage unit scenes exist, differ, and follow the style rules', () => {
  assertArtSet(unitArt, UNIT_IDS.map((id) => `unit-${id}`), { minLength: 600 });
  for (const id of UNIT_IDS) assert.equal(getArt(`unit-${id}`), unitArt[`unit-${id}`]());
});

test('every tier has a medallion icon', () => {
  for (const t of TIERS) {
    const svg = getIcon(t);
    assert.ok(svg.startsWith('<svg') && svg.length > 120, t);
  }
});

test('the unit card shows the name and the Items / Flip / Peek rules', () => {
  const jumbo = renderUnitCard(UNITS.jumbo);
  for (const want of ['JUMBO', 'STORAGE UNIT', 'ITEMS', '5', 'FLIP', 'Yes', 'PEEK', 'Before Buy-In']) {
    assert.ok(jumbo.includes(want), `jumbo card missing ${want}`);
  }
  const locker = renderUnitCard(UNITS.locker);
  assert.ok(locker.includes('LOCKER'));
  assert.ok(locker.includes('>No<'));
  assert.ok(locker.includes('Never'));
  assert.ok(renderUnitCard(UNITS.small).includes('After Buy-In'));
  assert.ok(renderUnitCard(UNITS.large).includes('>Yes<'));
});
