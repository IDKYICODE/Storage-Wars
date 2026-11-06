import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { io as connectClient } from 'socket.io-client';
import { startServer } from '../server/index.js';

const T0 = Date.now();
const fastClock = () => T0 + (Date.now() - T0) * 40; // game seconds pass 40x faster, so a game takes seconds

const opened = [];
// a failing test must not leave auto-reconnecting sockets that keep the process alive
afterEach(() => opened.splice(0).forEach((c) => c.close()));

function client(port) {
  const s = connectClient(`http://localhost:${port}`, { transports: ['websocket'], forceNew: true });
  opened.push(s);
  s.log = [];
  s.states = [];
  s.onAny((ev, ...args) => s.log.push(JSON.stringify([ev, args])));
  s.on('state', (m) => s.states.push(m));
  s.ask = (ev, payload) => new Promise((resolve) => s.emit(ev, payload, resolve));
  s.ready = new Promise((resolve) => s.on('connect', resolve));
  return s;
}
const until = async (fn, ms = 5000) => {
  const end = Date.now() + ms;
  while (Date.now() < end) { const v = fn(); if (v) return v; await new Promise((r) => setTimeout(r, 10)); }
  throw new Error('timed out waiting');
};

async function lobby(srv, n = 3, mode = 'auto') {
  const cs = Array.from({ length: n }, () => client(srv.port));
  await Promise.all(cs.map((c) => c.ready));
  const made = await cs[0].ask('room:create', { name: 'Ayush' });
  assert.equal(made.ok, true);
  cs[0].token = made.token;
  for (let i = 1; i < n; i++) {
    const j = await cs[i].ask('room:join', { code: made.code.toLowerCase(), name: `Guest${i}` });
    assert.equal(j.ok, true);
    cs[i].token = j.token;
  }
  await cs[0].ask('room:mode', { mode });
  return { cs, code: made.code };
}

/** A scripted player: acts only when view.can says it may. Resolves when the game is over. */
function autoplay(c, bidsPerRound = 2) {
  const bids = {};
  c.over = new Promise((resolve) => {
    c.on('state', ({ view }) => {
      if (view.gameover) return resolve(view.gameover);
      const act = (type, extra = {}) => c.emit('game:act', { type, ...extra }, () => {});
      const { can } = view;
      if (can.buyin) act('buyin');
      else if (can.pass) act('pass');
      if (can.peek) act('peek', { index: view.slots.findIndex((s) => !s.faceUp) });
      if (can.ready) act('ready');
      if (can.bid && (bids[view.roundNo] ?? 0) < bidsPerRound) {
        bids[view.roundNo] = (bids[view.roundNo] ?? 0) + 1;
        act('bid', { amount: (view.bid?.amount ?? 0) + 100 });
      }
      if (can.pay && view.payment.suggested) act('pay', view.payment.suggested);
      if (can.flip) act('flip', { index: view.slots.findIndex((s) => !s.faceUp) });
      if (can.call) act('call');
    });
  });
}

test('three clients play a whole Auto game and agree on the winner', { timeout: 90000 }, async () => {
  const srv = await startServer({ port: 0, tickMs: 20, now: fastClock });
  try {
    const { cs } = await lobby(srv, 3, 'auto');
    cs.forEach((c) => autoplay(c));
    assert.equal((await cs[0].ask('room:start', {})).ok, true);
    const results = await Promise.all(cs.map((c) => c.over));
    assert.deepEqual(results[1].winnerIds, results[0].winnerIds);
    assert.deepEqual(results[2].scores, results[0].scores);
    assert.ok(results[0].winnerIds.length >= 1);
    cs.forEach((c) => c.close());
  } finally {
    await srv.close();
  }
});

test('manual mode: the Auctioneer client drives flip and the calls', { timeout: 90000 }, async () => {
  const srv = await startServer({ port: 0, tickMs: 20, now: fastClock });
  try {
    const { cs } = await lobby(srv, 3, 'manual');
    cs.forEach((c) => autoplay(c));
    await cs[0].ask('room:start', {});
    const results = await Promise.all(cs.map((c) => c.over));
    assert.ok(results[0].winnerIds.length >= 1);
    cs.forEach((c) => c.close());
  } finally {
    await srv.close();
  }
});

test('no message ever carries a hidden card, the deck, or anyone else\'s token', async () => {
  const srv = await startServer({ port: 0, tickMs: 1000000, now: () => T0 });
  try {
    const { cs, code } = await lobby(srv, 3, 'manual');
    await cs[0].ask('room:start', {});
    const room = srv.rooms.rooms.get(code);
    const g = room.game;
    const [a, b, c] = room.players;
    // a fixed, recognizable round: a Locker-free jumbo with five uniquely named crates
    g.auctioneerId = a.id;
    g.unit = { id: 'jumbo', name: 'Jumbo', items: 5, flip: true, peek: 'before' };
    g.slots = [0, 1, 2, 3, 4].map((i) => ({ item: { id: `SECRET-${i}`, tier: 'valuable', name: `SecretName${i}`, value: 1000 }, faceUp: false }));
    g.itemDeck = [{ id: 'DECK-SECRET', tier: 'junk', name: 'DeckSecretName', value: -100 }];
    g.phase = 'flip';
    cs[1].log.length = 0;
    cs[2].log.length = 0;

    // Ayush flips crate 0 (public), then Bea peeks crate 3 (private)
    assert.equal((await cs[0].ask('game:act', { type: 'flip', index: 0 })).ok, true);
    assert.equal((await cs[1].ask('game:act', { type: 'peek', index: 3 })).ok, true);
    await until(() => cs[2].states.length > 0 && cs[1].states.some((m) => m.view.slots[3]?.item));

    const beaText = cs[1].log.join('\n');
    const calText = cs[2].log.join('\n');
    assert.ok(beaText.includes('SECRET-3'), 'Bea should see her own peek');
    assert.ok(beaText.includes('SECRET-0'), 'the flipped crate is public');
    for (const hidden of ['SECRET-1', 'SECRET-2', 'SECRET-4', 'DECK-SECRET', 'DeckSecretName']) {
      assert.ok(!beaText.includes(hidden), `Bea was sent ${hidden}`);
    }
    for (const hidden of ['SECRET-1', 'SECRET-2', 'SECRET-3', 'SECRET-4', 'DECK-SECRET', 'SecretName3']) {
      assert.ok(!calText.includes(hidden), `Cal was sent ${hidden}`);
    }
    for (const log of [beaText, calText]) {
      for (const p of room.players) assert.ok(!log.includes(p.token), 'a token leaked');
    }
    cs.forEach((x) => x.close());
  } finally {
    await srv.close();
  }
});

test('a dropped client rejoins with its token and gets its seat and a current state back', async () => {
  const srv = await startServer({ port: 0, tickMs: 1000000, now: () => T0 });
  try {
    const { cs, code } = await lobby(srv, 3, 'auto');
    await cs[0].ask('room:start', {});
    const room = srv.rooms.rooms.get(code);
    const cal = room.players[2];
    cs[2].close();
    await until(() => room.players[2].connected === false);
    assert.equal(room.game.players[cal.id].connected, false);

    const back = client(srv.port);
    await back.ready;
    const res = await back.ask('room:rejoin', { token: cs[2].token });
    assert.deepEqual(res, { ok: true, code });
    const msg = await until(() => back.states[0]);
    assert.equal(msg.view.you, cal.id);
    assert.equal(room.game.players[cal.id].connected, true);
    cs.slice(0, 2).forEach((x) => x.close());
    back.close();
  } finally {
    await srv.close();
  }
});

test('opening the same seat in a second tab closes the first tab instead of letting them fight', async () => {
  const srv = await startServer({ port: 0, tickMs: 1000000, now: () => T0 });
  try {
    const { cs, code } = await lobby(srv, 3, 'auto');
    await cs[0].ask('room:start', {});
    const first = client(srv.port);
    await first.ready;
    assert.equal((await first.ask('room:rejoin', { token: cs[1].token })).ok, true);
    const closed = [];
    first.on('closed', (m) => closed.push(m));
    const second = client(srv.port);
    await second.ready;
    assert.equal((await second.ask('room:rejoin', { token: cs[1].token })).ok, true);
    await until(() => closed.length > 0);
    assert.deepEqual(closed[0], { reason: 'other-tab' });
    // the stale tab can no longer act as that player
    assert.equal((await first.ask('game:act', { type: 'pass' })).ok, false);
    assert.ok(srv.rooms.rooms.get(code));
  } finally {
    await srv.close();
  }
});

test('after a server restart an old token is refused cleanly', async () => {
  const first = await startServer({ port: 0, tickMs: 1000000 });
  const c = client(first.port);
  await c.ready;
  const made = await c.ask('room:create', { name: 'Ayush' });
  c.close();
  await first.close();

  const second = await startServer({ port: 0, tickMs: 1000000 });
  try {
    const d = client(second.port);
    await d.ready;
    assert.deepEqual(await d.ask('room:rejoin', { token: made.token }), { ok: false, code: 'no-room', message: 'no-room' });
    d.close();
  } finally {
    await second.close();
  }
});

test('garbage input is refused without hurting the server', async () => {
  const srv = await startServer({ port: 0, tickMs: 1000000, now: () => T0 });
  try {
    const { cs } = await lobby(srv, 3, 'auto');
    assert.equal((await cs[0].ask('game:act', { type: 'bid', amount: 100 })).code, 'no-game');
    await cs[0].ask('room:start', {});
    assert.equal((await cs[1].ask('game:act', { type: 'bid', amount: 'abc' })).ok, false);
    assert.equal((await cs[1].ask('game:act', 'junk')).code, 'invalid');
    assert.equal((await cs[1].ask('room:join', 12345)).ok, false);
    assert.equal((await cs[1].ask('room:create', null)).ok, false);
    const health = await fetch(`http://localhost:${srv.port}/healthz`);
    assert.equal(await health.text(), 'ok');

    // flooding game:act trips the per-second limit
    const replies = await Promise.all(Array.from({ length: 60 }, () => cs[2].ask('game:act', { type: 'pass' })));
    assert.ok(replies.some((r) => r.code === 'rate'));
    cs.forEach((x) => x.close());
  } finally {
    await srv.close();
  }
});

test('only the host can start, and a lobby change reaches everyone', async () => {
  const srv = await startServer({ port: 0, tickMs: 1000000 });
  try {
    const { cs } = await lobby(srv, 3, 'manual');
    assert.equal((await cs[1].ask('room:start', {})).code, 'not-host');
    const seen = [];
    cs[2].on('lobby', (l) => seen.push(l));
    await cs[0].ask('room:mode', { mode: 'auto' });
    await until(() => seen.some((l) => l.mode === 'auto'));
    cs.forEach((x) => x.close());
  } finally {
    await srv.close();
  }
});
