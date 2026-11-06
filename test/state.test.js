import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, advance, startRound, scores, winnerIds } from '../server/game/state.js';
import { shuffle, rand } from '../server/game/rng.js';
import { UNITS, UNIT_IDS } from '../shared/cards.js';

const names = ['Ayush', 'Bea', 'Cal', 'Dev', 'Eli', 'Fay', 'Gus'];
const mk = (n) => names.slice(0, n).map((name, i) => ({ id: `p${i}`, name }));

test('createGame deals $5,000 each and a full deck minus the first round', () => {
  const s = createGame(mk(3), 1);
  for (const p of Object.values(s.players)) assert.equal(p.cash, 5000);
  assert.equal(s.itemDeck.length + s.slots.length, 56);
  assert.equal(s.unitDeck.length, 15);
  assert.equal(s.config.rounds, 8);
  assert.equal(s.bank, 0);
  assert.equal('auctioneerId' in s, false); // the game itself is the Auctioneer
  assert.ok(['flip', 'buyin'].includes(s.phase));
  assert.equal(s.slots.length, s.unit.items);
  assert.ok(s.slots.every((sl) => sl.faceUp === false));
});

test('same seed gives an identical game, different seed differs', () => {
  assert.deepEqual(createGame(mk(4), 7), createGame(mk(4), 7));
  assert.notDeepEqual(createGame(mk(4), 7).itemDeck, createGame(mk(4), 8).itemDeck);
});

test('shuffle is a deterministic permutation', () => {
  const a = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const s1 = { seed: 99 };
  const s2 = { seed: 99 };
  const r1 = shuffle(a, s1);
  assert.deepEqual(r1, shuffle(a, s2));
  assert.deepEqual([...r1].sort((x, y) => x - y), a);
  assert.ok(rand({ seed: 5 }) >= 0 && rand({ seed: 5 }) < 1);
});

test('advance steps through the configured number of rounds, then ends the game', () => {
  const s = createGame(mk(3), 3, 0, { rounds: 3 });
  assert.equal(s.roundNo, 1);
  advance(s, 0);
  advance(s, 0);
  assert.equal(s.roundNo, 3);
  assert.notEqual(s.phase, 'gameover');
  advance(s, 0);
  assert.equal(s.phase, 'gameover');
  assert.ok(s.result.winnerIds.length >= 1);
});

test('advance ends the game early when only one player is left', () => {
  const s = createGame(mk(3), 4);
  s.players.p1.eliminated = true;
  advance(s, 0);
  assert.notEqual(s.phase, 'gameover');
  s.players.p2.eliminated = true;
  advance(s, 0);
  assert.equal(s.phase, 'gameover');
});

test('scores sum cash and item values (junk subtracts); ties share the win', () => {
  const s = createGame(mk(3), 5);
  s.players.p0.cash = 5000;
  s.players.p0.items = [{ value: -100 }, { value: 9000 }];
  s.players.p1.cash = 13900;
  s.players.p1.items = [];
  s.players.p2.cash = 100;
  const sc = scores(s);
  assert.equal(sc.find((x) => x.id === 'p0').total, 13900);
  assert.equal(sc.find((x) => x.id === 'p0').itemValue, 8900);
  assert.equal(sc[sc.length - 1].id, 'p2');
  assert.deepEqual(winnerIds(s).sort(), ['p0', 'p1']);
});

test('a long game never runs out of units or items, even with the biggest units first', () => {
  const s = createGame(mk(7), 11, 0, { rounds: 60 });
  s.unitDeck = UNIT_IDS.flatMap((id) => Array(UNITS[id].count).fill(id)).sort((a, b) => UNITS[a].items - UNITS[b].items);
  let rounds = 1;
  while (s.phase !== 'gameover') {
    advance(s, 0);
    if (s.phase !== 'gameover') rounds++;
    assert.ok(rounds <= 60);
  }
  assert.equal(rounds, 60);
});

test('the decks refill when they run dry, so a game can last any number of rounds with unique card ids', () => {
  const s = createGame(mk(3), 7);
  const seen = [];
  for (let i = 0; i < 120; i++) {
    startRound(s, 0);
    assert.equal(s.slots.length, s.unit.items);
    const held = s.slots.map((sl) => sl.item.id);
    assert.equal(new Set(held).size, held.length, `round ${i}: duplicate id on the table`);
    // pretend the winner keeps everything; held items must stay unique across the whole game
    s.players.p0.items.push(...s.slots.map((sl) => sl.item));
    seen.push(...held);
  }
  assert.equal(new Set(seen).size, seen.length, 'an item id was handed out twice');
  assert.ok(s.players.p0.items.some((it) => it.base), 'copies point back to their original card art');
  assert.ok(s.players.p0.items.every((it) => it.base === undefined || !it.base.includes('~')));
});
