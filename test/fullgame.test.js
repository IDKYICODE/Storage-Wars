import test from 'node:test';
import assert from 'node:assert/strict';
import { reduce, tick } from '../server/game/engine.js';
import { createGame } from '../server/game/state.js';
import { suggestPayment } from '../server/game/payment.js';

const value = (s) => Object.values(s.players).reduce(
  (n, p) => n + p.cash + p.items.reduce((m, it) => m + it.value, 0), 0);

/** Scripted players with a little randomness; returns the finished state and what the units were worth. */
function play(seed, n, mode, config = {}) {
  const ids = Array.from({ length: n }, (_, i) => `p${i}`);
  let s = createGame(ids.map((id) => ({ id, name: id })), mode, seed, 0, config);
  const r = { seed: seed * 13 + 5 };
  const rnd = () => { r.seed = (r.seed * 1664525 + 1013904223) >>> 0; return r.seed / 4294967296; };
  let now = 0;
  let collected = 0;
  const seen = new Set();
  const apply = (action) => {
    try {
      const out = reduce(s, action, now);
      s = out.state;
      collected += tally(out.events);
      out.events.forEach((e) => seen.add(e.type));
    } catch (e) {
      if (!e.code) throw e; // only ActionErrors are fine to swallow
    }
  };
  const tally = (events) => events.filter((e) => e.type === 'revealed' && e.items)
    .reduce((m, e) => m + e.items.reduce((k, it) => k + it.value, 0), 0);

  for (let steps = 0; s.phase !== 'gameover'; steps++) {
    assert.ok(steps < 5000, `seed ${seed} n ${n} did not finish`);
    if (s.phase === 'buyin') {
      for (const id of ids) apply({ type: rnd() < 0.6 ? 'buyin' : 'pass', by: id }); // everyone decides at once
    } else if (s.phase === 'bidding') {
      const who = ids[Math.floor(rnd() * ids.length)];
      const reckless = rnd() < 0.08; // tries to bid far beyond what they can pay: the server must refuse it
      if (rnd() < 0.4) apply({ type: 'bid', by: who, amount: (s.bid?.amount ?? 0) + (reckless ? 9000 : 100 * (1 + Math.floor(rnd() * 3))) });
      if (mode === 'manual' && rnd() < 0.5) apply({ type: 'call', by: s.auctioneerId });
    } else if (s.phase === 'payment') {
      const sug = suggestPayment(s.players[s.winner.playerId], s.winner.price);
      if (sug && rnd() < 0.7) apply({ type: 'pay', by: s.winner.playerId, ...sug });
    } else if (s.phase === 'flip' && mode === 'manual') {
      apply({ type: 'flip', by: s.auctioneerId, index: 0 });
    }
    now = s.deadline ? Math.max(now + 1, s.deadline.at) : now + 1000;
    const out = tick(s, now);
    s = out.state;
    collected += tally(out.events);
    out.events.forEach((e) => seen.add(e.type));
  }
  return { s, collected, n, seen };
}

for (const mode of ['auto', 'manual']) {
  test(`scripted ${mode} games always finish and conserve money`, () => {
    const everSeen = new Set();
    for (const n of [3, 5, 7]) {
      for (let seed = 1; seed <= 40; seed++) {
        const { s, collected, seen } = play(seed, n, mode);
        seen.forEach((t) => everSeen.add(t));
        const alive = Object.values(s.players).filter((p) => !p.eliminated);
        if (alive.length > 1) assert.ok(alive.every((p) => p.turnsPlayed === 2), `seed ${seed} n ${n}`);
        assert.ok(Object.values(s.players).every((p) => p.cash >= 0), 'negative cash');
        assert.equal(value(s) + s.bank, 5000 * n + collected, `value leaked, seed ${seed} n ${n}`);
        const totals = s.result.scores.map((x) => x.total);
        assert.deepEqual(totals, [...totals].sort((a, b) => b - a));
        assert.ok(s.result.winnerIds.length >= 1);
      }
    }
    // the scripts must actually reach the interesting paths, or this test proves little
    // (no 'fined': bids above what a player can pay are rejected now, so fines cannot happen in play)
    for (const t of ['sold', 'paid', 'voided', 'discarded', 'round-end', 'game-over']) {
      assert.ok(everSeen.has(t), `no game ever produced a '${t}' event`);
    }
  });
}

test('a long game (10 turns each, 5 players = 50 rounds) runs to the end and still conserves money', () => {
  for (const mode of ['auto', 'manual']) {
    const { s, collected } = play(3, 5, mode, { turns: 10 });
    assert.equal(s.phase, 'gameover');
    assert.equal(value(s) + s.bank, 5000 * 5 + collected);
    assert.ok(Object.values(s.players).every((p) => p.cash >= 0));
  }
});
