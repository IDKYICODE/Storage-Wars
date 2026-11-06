import test from 'node:test';
import assert from 'node:assert/strict';
import { ITEMS } from '../shared/cards.js';
import { formatMoney, esc } from '../client/js/art/kit.js';
import { renderItemCard, renderCardBack, renderFlipCard, registerArt, getArt } from '../client/js/ui/card.js';

const get = (name) => ITEMS.find((i) => i.name === name);
const EMOJI = /\p{Extended_Pictographic}/u;

test('formatMoney', () => {
  assert.equal(formatMoney(9000), '$9,000');
  assert.equal(formatMoney(-100), '-$100');
  assert.equal(formatMoney(0), '$0');
  assert.equal(formatMoney(15000), '$15,000');
});

test('esc escapes the five HTML-significant characters', () => {
  assert.equal(esc(`<a href="x">&'`), '&lt;a href=&quot;x&quot;&gt;&amp;&#39;');
});

test('an item card shows name, rarity, price, flavor and its card number', () => {
  const sword = get('Antique Sword');
  const html = renderItemCard(sword);
  assert.ok(html.includes('ANTIQUE SWORD'));
  assert.ok(html.includes('VALUABLE ITEM'));
  assert.ok(html.includes('$9,000'));
  assert.ok(html.includes(sword.flavor));
  const n = String(ITEMS.indexOf(sword) + 1).padStart(2, '0');
  assert.ok(html.includes(`${n}/56`));
  assert.ok(html.includes('class="card valuable"'));
});

test('junk shows a red negative price tag; common shows a green tag', () => {
  const tires = renderItemCard(get('Worn Tires'));
  assert.ok(tires.includes('-$100'));
  assert.ok(tires.includes('#d8403f"'));
  assert.ok(tires.includes('JUNK ITEM'));
  const radio = renderItemCard(get('Vintage Radio'));
  assert.ok(radio.includes('$500'));
  assert.ok(radio.includes('#1faa55'));
});

test('a Havoc card has the HAVOC banner and no dollar price', () => {
  const html = renderItemCard(get('Black Mold'));
  assert.ok(html.includes('HAVOC'));
  assert.ok(html.includes('HAVOC EVENT'));
  assert.ok(!html.includes('$'));
});

test('text from items is HTML-escaped', () => {
  const html = renderItemCard({ id: 'x-1', tier: 'junk', name: '<script>alert(1)</script> & co', value: -100, flavor: '"quoted" <b>bold</b>' });
  assert.ok(!html.includes('<script>'));
  assert.ok(html.includes('&lt;SCRIPT&gt;') || html.includes('&lt;script&gt;'));
  assert.ok(!html.includes('<b>bold</b>'));
  assert.ok(html.includes('&quot;quoted&quot;'));
});

test('markup never uses gradients, shine, foil or emoji (owner rejected those)', () => {
  const all = [...ITEMS.map(renderItemCard), renderCardBack()].join('\n');
  assert.ok(!/Gradient/i.test(all));
  assert.ok(!/shine|sheen|foil|holo/i.test(all));
  assert.ok(!EMOJI.test(all));
});

test('the card back and the flip wrapper', () => {
  const back = renderCardBack();
  assert.ok(back.includes('BIDDER BATTLE'));
  assert.ok(back.includes('MYSTERY ITEM'));
  const hidden = renderFlipCard(null, false);
  assert.ok(hidden.includes('class="cw"'));
  assert.ok(!hidden.includes('class="card'));
  const shown = renderFlipCard(get('Antique Sword'), true);
  assert.ok(shown.includes('class="cw fl"'));
  assert.ok(shown.includes('ANTIQUE SWORD'));
});

test('art registry: registered art is used, unregistered ids get a plain labeled placeholder', () => {
  registerArt({ 'test-art-1': () => '<circle r="5"/>' });
  assert.equal(getArt('test-art-1'), '<circle r="5"/>');
  const ph = getArt('does-not-exist');
  assert.ok(ph.includes('<rect'));
  assert.ok(!/Gradient/i.test(ph));
});
