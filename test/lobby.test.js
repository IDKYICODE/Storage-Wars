import test from 'node:test';
import assert from 'node:assert/strict';
import { renderLobby } from '../client/js/screens/lobby.js';

const mk = (n, extra = {}) => ({
  code: 'KQTZ',
  hostId: 'p0',
  mode: 'manual',
  settings: { turns: 2, startCash: 5000, buyIn: 100 },
  maxTurns: Math.max(1, Math.min(4, Math.floor(14 / n))),
  you: 'p0',
  players: Array.from({ length: n }, (_, i) => ({ id: `p${i}`, name: `Player${i}`, connected: true })),
  ...extra,
});
const startBtn = (html) => html.match(/<button[^>]*data-act="start"[^>]*>/)?.[0] ?? null;

test('the host sees START, disabled below 3 players and enabled from 3 to 7', () => {
  assert.match(startBtn(renderLobby(mk(2))), /disabled/);
  assert.doesNotMatch(startBtn(renderLobby(mk(3))), /disabled/);
  assert.doesNotMatch(startBtn(renderLobby(mk(7))), /disabled/);
});

test('a non-host has no START, no kick buttons, and a read-only mode', () => {
  const html = renderLobby(mk(4, { you: 'p2' }));
  assert.equal(startBtn(html), null);
  assert.ok(html.includes('Waiting for the host'));
  assert.ok(!html.includes('data-act="kick"'));
  assert.ok(!html.includes('data-act="mode"'));
  assert.match(html, /class="seg on"[^>]*disabled[^>]*>MANUAL/); // still shown, just not editable
});

test('the host can kick everyone except themselves and can switch the mode', () => {
  const html = renderLobby(mk(4));
  assert.equal((html.match(/data-act="kick"/g) || []).length, 3);
  assert.ok(!html.includes('data-kick="p0"'));
  assert.equal((html.match(/data-act="mode"/g) || []).length, 2);
  assert.match(html, /data-act="mode" data-mode="auto"/);
});

test('the active mode is marked and each mode explains itself', () => {
  const manual = renderLobby(mk(3));
  assert.match(manual, /class="seg on"[^>]*data-mode="manual"/);
  const auto = renderLobby(mk(3, { mode: 'auto' }));
  assert.match(auto, /class="seg on"[^>]*data-mode="auto"/);
  assert.match(auto, /computer/i);
  assert.match(manual, /real player/i);
});

test('the room code, the share link and the player count are shown', () => {
  const html = renderLobby(mk(3));
  assert.ok(html.includes('KQTZ'));
  assert.ok(html.includes('data-act="copy"'));
  assert.ok(html.includes('3 / 7'));
});

test('only the host wears the crown; offline players show as offline; names are escaped', () => {
  const lobby = mk(3);
  lobby.players[1].connected = false;
  lobby.players[2].name = '<script>alert(1)</script>';
  const html = renderLobby(lobby);
  assert.equal((html.match(/class="crown"/g) || []).length, 1);
  assert.equal((html.match(/class="dot off"/g) || []).length, 1);
  assert.ok(!html.includes('<script>alert'));
  assert.ok(html.includes('&lt;script&gt;'));
});

test('you are marked as "you" in the list, and everyone gets a Leave button', () => {
  const html = renderLobby(mk(3, { you: 'p1' }));
  assert.equal((html.match(/class="you"/g) || []).length, 1);
  assert.ok(html.includes('data-act="leave"'));
});

const setBtn = (html, key, value) => html.match(new RegExp(`<button[^>]*data-key="${key}"[^>]*data-value="${value}"[^>]*>`))?.[0] ?? null;

test('the host sees rounds each as buttons up to the player-count cap, with the total rounds spelled out', () => {
  const html = renderLobby(mk(4));
  for (const t of [1, 2, 3]) assert.ok(setBtn(html, 'turns', t), `turns ${t}`);
  assert.equal(setBtn(html, 'turns', 4), null); // 4 players x 4 turns would be 16 rounds, over the 14 cap
  assert.ok(renderLobby(mk(3)).includes('data-value="4"'));
  assert.match(setBtn(html, 'turns', 2), /class="seg on"/);
  assert.ok(html.includes('8 rounds in total'));
  const seven = renderLobby(mk(7));
  assert.ok(setBtn(seven, 'turns', 2));
  assert.equal(setBtn(seven, 'turns', 3), null);
  assert.ok(seven.includes('14 rounds in total'));
});

test('starting cash and buy-in are steppers that stop at their limits', () => {
  const html = renderLobby(mk(3));
  assert.match(html, /\$5,000/);
  assert.ok(setBtn(html, 'startCash', 4000) && setBtn(html, 'startCash', 6000));
  assert.ok(setBtn(html, 'buyIn', 200));
  assert.match(setBtn(html, 'buyIn', 0), /disabled/); // already at the $100 minimum, nothing below
  const top = renderLobby(mk(3, { settings: { turns: 2, startCash: 20000, buyIn: 1000 } }));
  assert.match(setBtn(top, 'startCash', 21000), /disabled/);
  assert.match(setBtn(top, 'buyIn', 1100), /disabled/);
});

test('a non-host sees the settings but cannot change them', () => {
  const html = renderLobby(mk(4, { you: 'p2' }));
  assert.ok(!html.includes('data-act="set"'));
  assert.ok(html.includes('$5,000') && html.includes('8 rounds in total'));
});
