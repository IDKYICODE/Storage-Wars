import test from 'node:test';
import assert from 'node:assert/strict';
import { renderRulebook, PAGE_COUNT } from '../client/js/screens/rules.js';
import { renderEntry } from '../client/js/screens/entry.js';

const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/u;
const pages = Array.from({ length: PAGE_COUNT }, (_, i) => renderRulebook(i));

test('the rulebook has a handful of pages, each with a title, a picture and words', () => {
  assert.ok(PAGE_COUNT >= 6 && PAGE_COUNT <= 10);
  pages.forEach((h, i) => {
    assert.match(h, /<h2[^>]*class="[^"]*rb-title/, `page ${i} title`);
    assert.ok(h.includes('class="rb-art"'), `page ${i} art`);
    assert.ok(/<p class="rb-line"/.test(h), `page ${i} text`);
    assert.ok(!EMOJI.test(h), `page ${i} has an emoji`);
    assert.ok(h.includes(`${i + 1} / ${PAGE_COUNT}`), `page ${i} counter`);
  });
});

test('the pictures are the real game pieces', () => {
  const all = pages.join('');
  assert.ok(all.includes('class="unitc"'), 'storage unit card');
  assert.ok(all.includes('class="back"'), 'crate back');
  assert.ok(all.includes('PEEKED') && all.includes('FLIPPED'), 'peek and flip labels');
  assert.ok(all.includes('data-act="buyin"') === false, 'illustrations are not live buttons');
  assert.ok(all.includes('Buy in') && all.includes('Pass'));
  assert.ok(all.includes('class="tile"'), 'flip-board bid tiles');
  assert.ok(all.includes('GOING ONCE'));
  assert.ok(all.includes('SOLD!'), 'sold banner');
  assert.ok(all.includes('class="card havoc"'), 'havoc card');
  assert.ok(all.includes('class="card junk"') && all.includes('class="card unique"'));
  assert.ok(all.includes('class="chip'), 'scoreboard');
});

test('the rules in the words match the real rules', () => {
  const all = pages.join(' ');
  for (const phrase of ['at the same time', 'cash you actually hold', 'steps of $100', 'No change', 'Havoc', 'richest']) {
    assert.ok(all.includes(phrase), phrase);
  }
});

test('first page has no Back, last page has GOT IT instead of Next; page numbers are clamped', () => {
  assert.ok(!pages[0].includes('data-rb="back"'));
  assert.ok(pages[0].includes('data-rb="next"'));
  const last = pages[PAGE_COUNT - 1];
  assert.ok(last.includes('data-rb="back"'));
  assert.ok(!last.includes('data-rb="next"'));
  assert.ok(last.includes('data-rb="close"') && last.includes('GOT IT'));
  assert.equal(renderRulebook(-5), pages[0]);
  assert.equal(renderRulebook(999), last);
  assert.equal(renderRulebook(NaN), pages[0]);
});

test('every page has a close button and is a labelled dialog', () => {
  for (const h of pages) {
    assert.ok(h.includes('role="dialog"') && h.includes('aria-modal="true"'));
    assert.ok(h.includes('data-rb="close"'));
  }
});

test('the entry screen offers HOW TO PLAY on both steps', () => {
  assert.ok(renderEntry({ step: 'title' }).includes('data-act="rules"'));
  assert.ok(renderEntry({ step: 'code' }).includes('data-act="rules"'));
  assert.ok(renderEntry({ step: 'title' }).includes('HOW TO PLAY'));
});
