import test from 'node:test';
import assert from 'node:assert/strict';
import { renderEntry, errorText, validName, cleanCode } from '../client/js/screens/entry.js';

const EMOJI = /\p{Extended_Pictographic}/u;

test('the title step is the storage unit: title and ENTER painted on the roll-up door', () => {
  const html = renderEntry({ step: 'title' });
  assert.ok(html.includes('>STORAGE<'));
  assert.ok(html.includes('>WARS<'));
  assert.ok(html.includes('>ENTER<'));
  assert.equal((html.match(/class="door-g"/g) || []).length, 1); // the door is shut
  assert.ok(html.includes('data-act="enter"'));
  assert.ok(html.includes('role="button"'));
  assert.ok(html.includes('<svg'));
  assert.ok(!EMOJI.test(html));
});

test('the code step shows the same unit with the door rolled up', () => {
  const html = renderEntry({ step: 'code' });
  assert.ok(html.includes('class="door-g open"'));
  assert.ok(!html.includes('data-act="enter"') || html.includes('door-g open'));
});

test('the code step has a name field, four code boxes, JOIN GAME and CREATE A ROOM', () => {
  const html = renderEntry({ step: 'code', name: '', code: '' });
  assert.ok(html.includes('id="name"'));
  assert.equal((html.match(/<b[ >]/g) || []).length, 4);
  assert.ok(html.includes('JOIN GAME'));
  assert.ok(html.includes('CREATE A ROOM'));
  assert.ok(html.includes('id="code"'));
});

test('JOIN needs a valid name and a 4-letter code; CREATE needs only a valid name', () => {
  const join = (name, code) => /data-act="join"[^>]*disabled/.test(renderEntry({ step: 'code', name, code }));
  const create = (name, code) => /data-act="create"[^>]*disabled/.test(renderEntry({ step: 'code', name, code }));
  assert.equal(join('Ayush', 'ABCD'), false);
  assert.equal(join('Ayush', 'ABC'), true);
  assert.equal(join('', 'ABCD'), true);
  assert.equal(join('   ', 'ABCD'), true);
  assert.equal(create('Ayush', ''), false);
  assert.equal(create('', 'ABCD'), true);
});

test('typed letters show in the boxes and the next empty box is the cursor', () => {
  const html = renderEntry({ step: 'code', name: 'A', code: 'F4' });
  assert.ok(html.includes('<b>F</b>'));
  assert.ok(html.includes('<b>4</b>'));
  assert.ok(html.includes('class="cur"'));
});

test('names and errors from outside are HTML-escaped', () => {
  const html = renderEntry({ step: 'code', name: '<img src=x onerror=alert(1)>', code: '', error: '<b>bad</b>' });
  assert.ok(!html.includes('<img src=x'));
  assert.ok(!html.includes('<b>bad</b>'));
  assert.ok(html.includes('&lt;b&gt;bad&lt;/b&gt;'));
});

test('validName and cleanCode follow the room rules', () => {
  assert.equal(validName('Ayush'), true);
  assert.equal(validName('  A  '), true);
  assert.equal(validName(''), false);
  assert.equal(validName('x'.repeat(17)), false);
  assert.equal(validName('x'.repeat(16)), true);
  assert.equal(cleanCode(' ab-c1d '), 'ABCD'); // keeps only letters from the room alphabet, up to 4
  assert.equal(cleanCode('oioi'), ''); // O and I are not in the alphabet
  assert.equal(cleanCode('abcdefg'), 'ABCD');
  assert.equal(cleanCode(null), '');
});

test('server error codes become friendly sentences', () => {
  for (const code of ['no-room', 'full', 'started', 'bad-name', 'rate', 'invalid', 'server', 'whatever']) {
    const t = errorText(code);
    assert.ok(typeof t === 'string' && t.length > 8, code);
  }
  assert.match(errorText('full'), /full/i);
  assert.match(errorText('started'), /started/i);
  assert.match(errorText('no-room'), /room/i);
});
