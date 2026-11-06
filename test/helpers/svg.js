import assert from 'node:assert/strict';

const EMOJI = /\p{Extended_Pictographic}/u;

/** Throws unless every opened tag is closed in order (browsers silently drop broken SVG). */
export function assertWellFormed(markup, label) {
  const stack = [];
  const re = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)([^>]*?)(\/?)>/g;
  let m;
  while ((m = re.exec(markup))) {
    const [, closing, name, , selfClosing] = m;
    if (selfClosing) continue;
    if (closing) assert.equal(stack.pop(), name, `${label}: unbalanced </${name}>`);
    else stack.push(name);
  }
  assert.deepEqual(stack, [], `${label}: unclosed tags ${stack.join(',')}`);
}

/** The shared checks every illustration must pass. */
export function assertArtSet(artMap, expectedIds, { minLength = 400 } = {}) {
  assert.deepEqual(Object.keys(artMap).sort(), [...expectedIds].sort(), 'art ids must match the cards exactly');
  const seen = new Map();
  for (const id of expectedIds) {
    const s = artMap[id]();
    assert.equal(typeof s, 'string', id);
    assert.ok(s.length >= minLength, `${id} looks like a placeholder (${s.length} chars)`);
    assert.ok(!/Gradient/i.test(s), `${id} uses a gradient`);
    assert.ok(!EMOJI.test(s), `${id} contains an emoji`);
    assert.ok(!/<text[^>]*>[^<]*\p{Extended_Pictographic}/u.test(s), `${id} text has emoji`);
    assertWellFormed(s, id);
    assert.ok(!seen.has(s), `${id} is identical to ${seen.get(s)}`);
    seen.set(s, id);
  }
}
