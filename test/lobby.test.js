import test from 'node:test';
import assert from 'node:assert/strict';
import { renderLobby } from '../client/js/screens/lobby.js';

const mk = (n, extra = {}) => ({
  code: 'KQTZ',
  hostId: 'p0',
  settings: { rounds: 8, startCash: 5000, buyIn: 100 },
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

test('a non-host has no START and no kick buttons', () => {
  const html = renderLobby(mk(4, { you: 'p2' }));
  assert.equal(startBtn(html), null);
  assert.ok(html.includes('Waiting for the host'));
  assert.ok(!html.includes('data-act="kick"'));
});

test('the host can kick everyone except themselves', () => {
  const html = renderLobby(mk(4));
  assert.equal((html.match(/data-act="kick"/g) || []).length, 3);
  assert.ok(!html.includes('data-kick="p0"'));
});

test('there is no Auctioneer or mode choice: the game runs the auction itself', () => {
  const html = renderLobby(mk(3));
  assert.ok(!html.includes('data-act="mode"') && !/MANUAL/.test(html));
  assert.ok(html.includes('Everyone bids on every unit'));
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

test('rounds: quick picks plus a stepper from 1 to 99, with the count spelled out', () => {
  const html = renderLobby(mk(4));
  for (const t of [4, 8, 12, 16, 20]) assert.ok(setBtn(html, 'rounds', t), `quick pick ${t}`);
  assert.match(setBtn(html, 'rounds', 8), /class="seg on"/);
  assert.ok(setBtn(html, 'rounds', 7) && setBtn(html, 'rounds', 9)); // stepper - / +
  assert.ok(html.includes('8 storage units go up for auction'));
  const one = renderLobby(mk(4, { settings: { rounds: 1, startCash: 5000, buyIn: 100 } }));
  assert.ok(one.includes('1 storage unit goes up'));
  assert.match(setBtn(one, 'rounds', 0), /disabled/);
  const top = renderLobby(mk(4, { settings: { rounds: 99, startCash: 5000, buyIn: 100 } }));
  assert.match(setBtn(top, 'rounds', 100), /disabled/);
});

test('starting cash and buy-in are steppers that stop at their limits', () => {
  const html = renderLobby(mk(3));
  assert.match(html, /\$5,000/);
  assert.ok(setBtn(html, 'startCash', 4000) && setBtn(html, 'startCash', 6000));
  assert.ok(setBtn(html, 'buyIn', 200));
  assert.match(setBtn(html, 'buyIn', 0), /disabled/); // already at the $100 minimum, nothing below
  const top = renderLobby(mk(3, { settings: { rounds: 8, startCash: 20000, buyIn: 1000 } }));
  assert.match(setBtn(top, 'startCash', 21000), /disabled/);
  assert.match(setBtn(top, 'buyIn', 1100), /disabled/);
});

test('a non-host sees the settings but cannot change them', () => {
  const html = renderLobby(mk(4, { you: 'p2' }));
  assert.ok(!html.includes('data-act="set"'));
  assert.ok(html.includes('$5,000') && html.includes('8 storage units'));
});
