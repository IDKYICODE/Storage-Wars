import test from 'node:test';
import assert from 'node:assert/strict';
import { Rooms, RoomError } from '../server/rooms.js';
import { ROOM_CODE_ALPHABET } from '../shared/cards.js';

let clock = 0;
const mk = () => { clock = 1_000_000; return new Rooms({ now: () => clock }); };
const code = (fn) => { try { fn(); } catch (e) { return e instanceof RoomError ? e.code : `other:${e.message}`; } return null; };

/** A started 3-player room: returns everything a test needs. */
function started(mode = 'auto') {
  const rooms = mk();
  const a = rooms.create('Ayush');
  const b = rooms.join(a.room.code, 'Bea');
  const c = rooms.join(a.room.code, 'Cal');
  rooms.setMode(a.token, mode);
  rooms.start(a.token);
  return { rooms, room: a.room, a, b, c };
}

test('create gives a 4-letter code from the alphabet, unique among live rooms', () => {
  const rooms = mk();
  const codes = new Set();
  for (let i = 0; i < 200; i++) {
    const { room } = rooms.create(`P${i}`);
    assert.match(room.code, /^[A-Z]{4}$/);
    assert.ok([...room.code].every((ch) => ROOM_CODE_ALPHABET.includes(ch)));
    codes.add(room.code);
  }
  assert.equal(codes.size, 200);
});

test('join: case and padding in the code are forgiven; wrong code, full and started rooms are refused', () => {
  const rooms = mk();
  const { room } = rooms.create('Host');
  assert.equal(rooms.join(` ${room.code.toLowerCase()} `, 'Bea').room, room);
  assert.equal(code(() => rooms.join('ZZZZ', 'X')), 'no-room');
  assert.equal(code(() => rooms.join('', 'X')), 'no-room');
  assert.equal(code(() => rooms.join(null, 'X')), 'no-room');
  for (let i = 0; i < 5; i++) rooms.join(room.code, `Guest${i}`); // 7 total now
  assert.equal(code(() => rooms.join(room.code, 'Eighth')), 'full');

  const s = started();
  assert.equal(code(() => s.rooms.join(s.room.code, 'Late')), 'started');
});

test('after the game starts, an offline player can take their seat back by joining with the same name', () => {
  const { rooms, room, b } = started();
  rooms.disconnect(b.token);
  const back = rooms.join(room.code.toLowerCase(), ' bea ');
  assert.equal(back.player.id, b.player.id);
  assert.notEqual(back.token, b.token);
  assert.equal(rooms.rejoin(b.token), null); // the old token is dead
  assert.equal(room.game.players[b.player.id].connected, true);
  assert.equal(room.players.length, 3);
});

test('after the game starts, nobody can take a seat that is online, and strangers still cannot join', () => {
  const { rooms, room } = started();
  assert.equal(code(() => rooms.join(room.code, 'Bea')), 'started'); // Bea is online
  assert.equal(code(() => rooms.join(room.code, 'Newcomer')), 'started');
  assert.equal(code(() => rooms.join(room.code, '')), 'started');
});

test('names: trimmed, collapsed, 1 to 16 characters, unique ignoring case, stored as plain text', () => {
  const rooms = mk();
  const { room } = rooms.create('  Ayush   K  ');
  assert.equal(room.players[0].name, 'Ayush K');
  for (const bad of ['', '   ', 'x'.repeat(17), null, undefined, 42, 'ayush k']) {
    assert.equal(code(() => rooms.join(room.code, bad)), 'bad-name', String(bad));
  }
  assert.equal(code(() => rooms.join(room.code, 'x'.repeat(16))), null);
  const html = rooms.join(room.code, '<img onerror=x>');
  assert.equal(html.player.name, '<img onerror=x>'); // kept verbatim; the client escapes it
  assert.equal(code(() => rooms.create('')), 'bad-name');
});

test('a player who dropped in the lobby is offline in the game from the first moment', () => {
  const rooms = mk();
  const a = rooms.create('Ayush');
  const b = rooms.join(a.room.code, 'Bea');
  rooms.join(a.room.code, 'Cal');
  rooms.disconnect(b.token);
  clock += 1234;
  rooms.start(a.token);
  const g = a.room.game;
  assert.equal(g.players[b.player.id].connected, false);
  assert.equal(g.players[b.player.id].offlineSince, 1_000_000);
  assert.equal(g.players[a.player.id].connected, true);
});

test('start needs the host and 3 to 7 players', () => {
  const rooms = mk();
  const a = rooms.create('Ayush');
  const b = rooms.join(a.room.code, 'Bea');
  assert.equal(code(() => rooms.start(a.token)), 'bad-count');
  const c = rooms.join(a.room.code, 'Cal');
  assert.equal(code(() => rooms.start(b.token)), 'not-host');
  rooms.start(a.token);
  assert.ok(a.room.game);
  assert.equal(a.room.game.mode, 'manual');
  assert.equal(code(() => rooms.start(a.token)), 'started');
  assert.ok(c.player.id);
});

test('kick and mode: host only, lobby only', () => {
  const rooms = mk();
  const a = rooms.create('Ayush');
  const b = rooms.join(a.room.code, 'Bea');
  const c = rooms.join(a.room.code, 'Cal');
  assert.equal(code(() => rooms.kick(b.token, c.player.id)), 'not-host');
  assert.equal(code(() => rooms.setMode(b.token, 'auto')), 'not-host');
  assert.equal(code(() => rooms.setMode(a.token, 'weird')), 'bad-mode');
  rooms.setMode(a.token, 'auto');
  assert.equal(a.room.mode, 'auto');
  rooms.kick(a.token, c.player.id);
  assert.deepEqual(a.room.players.map((p) => p.name), ['Ayush', 'Bea']);
  assert.equal(rooms.rejoin(c.token), null); // kicked token is dead
  rooms.join(a.room.code, 'Dee');
  rooms.start(a.token);
  assert.equal(code(() => rooms.kick(a.token, b.player.id)), 'started');
  assert.equal(code(() => rooms.setMode(a.token, 'manual')), 'started');
});

test('settings: host only, lobby only, validated, and they reach the game', () => {
  const rooms = mk();
  const a = rooms.create('Ayush');
  const b = rooms.join(a.room.code, 'Bea');
  rooms.join(a.room.code, 'Cal');
  assert.deepEqual(rooms.snapshot(a.room, a.player.id).lobby.settings, { turns: 2, startCash: 5000, buyIn: 100 });
  assert.equal(rooms.snapshot(a.room, a.player.id).lobby.maxTurns, 4);
  assert.equal(code(() => rooms.setSettings(b.token, { turns: 1 })), 'not-host');
  for (const bad of [{ turns: 0 }, { turns: 5 }, { turns: 1.5 }, { startCash: 500 }, { startCash: 25000 }, { startCash: 1500 },
    { buyIn: 0 }, { buyIn: 1100 }, { buyIn: 150 }, { nope: 1 }, { turns: '2' }, null]) {
    assert.equal(code(() => rooms.setSettings(a.token, bad)), 'bad-setting', JSON.stringify(bad));
  }
  assert.deepEqual(a.room.settings, { turns: 2, startCash: 5000, buyIn: 100 }); // nothing half-applied
  rooms.setSettings(a.token, { turns: 3, startCash: 8000, buyIn: 300 });
  rooms.start(a.token);
  assert.deepEqual(a.room.game.config, { turns: 3, startCash: 8000, buyIn: 300 });
  assert.equal(a.room.game.players[b.player.id].cash, 8000);
  assert.equal(code(() => rooms.setSettings(a.token, { turns: 1 })), 'started');
});

test('rounds each are capped by the player count at start, even if set while the room was smaller', () => {
  const rooms = mk();
  const a = rooms.create('Ayush');
  rooms.join(a.room.code, 'Bea');
  rooms.join(a.room.code, 'Cal');
  rooms.setSettings(a.token, { turns: 4 });
  for (const n of ['D', 'E', 'F', 'G']) rooms.join(a.room.code, `Dee${n}`); // 7 players: 14 / 7 = 2 each
  assert.equal(rooms.snapshot(a.room, a.player.id).lobby.maxTurns, 2);
  rooms.start(a.token);
  assert.equal(a.room.game.config.turns, 2);
});

test('leaving the lobby frees the seat and passes the host crown; an empty room is deleted', () => {
  const rooms = mk();
  const a = rooms.create('Ayush');
  const b = rooms.join(a.room.code, 'Bea');
  rooms.leave(a.token);
  assert.equal(a.room.hostId, b.player.id);
  assert.equal(rooms.rejoin(a.token), null);
  rooms.leave(b.token);
  assert.equal(code(() => rooms.join(a.room.code, 'X')), 'no-room');
});

test('rejoin restores the same seat after a drop and the engine sees the presence', () => {
  const { rooms, room, b } = started();
  rooms.disconnect(b.token);
  assert.equal(room.game.players[b.player.id].connected, false);
  assert.equal(room.players.find((p) => p.id === b.player.id).connected, false);
  const back = rooms.rejoin(b.token);
  assert.equal(back.player.id, b.player.id);
  assert.equal(room.game.players[b.player.id].connected, true);
  assert.equal(rooms.rejoin('not-a-token'), null);
  assert.equal(rooms.rejoin(undefined), null);
});

test('host offline 29 s keeps the crown, 31 s passes it to the next connected seat', () => {
  const rooms = mk();
  const a = rooms.create('Ayush');
  const b = rooms.join(a.room.code, 'Bea');
  rooms.disconnect(a.token);
  clock += 29_000;
  rooms.tick(clock);
  assert.equal(a.room.hostId, a.player.id);
  clock += 2_000;
  const changed = rooms.tick(clock);
  assert.equal(a.room.hostId, b.player.id);
  assert.ok(changed.some((c) => c.room === a.room));
});

test('act ignores any claimed actor and turns illegal actions into an error result', () => {
  const { rooms, room, a, b } = started('manual');
  const g = room.game;
  const decider = b.player.id;
  g.phase = 'buyin';
  g.auctioneerId = a.player.id;
  g.buyIns = {};
  g.deadline = { kind: 'buyin', at: clock + 25_000 };
  // Ayush pretends to be Bea
  const spoof = rooms.act(a.token, { type: 'pass', by: decider });
  assert.equal(spoof.error.code, 'not-allowed');
  assert.equal(room.game.buyIns[decider], undefined);
  const real = rooms.act(b.token, { type: 'pass', by: 'whoever' });
  assert.equal(real.changed, true);
  assert.equal(room.game.buyIns[decider], 'pass');
  assert.deepEqual(Object.keys(real.events).sort(), room.players.map((p) => p.id).sort());
  assert.equal(rooms.act(a.token, { type: 'nope' }).error.code, 'invalid');
});

test('act before the game starts reports no-game; tick drives timers and returns per-player events', () => {
  const rooms = mk();
  const a = rooms.create('Ayush');
  assert.equal(rooms.act(a.token, { type: 'pass' }).error.code, 'no-game');
  const s = started('auto');
  s.room.game.phase = 'buyin';
  s.room.game.buyIns = {};
  s.room.game.auctioneerId = s.a.player.id;
  s.room.game.deadline = { kind: 'buyin', at: clock + 100 };
  const changed = s.rooms.tick(clock + 200);
  assert.equal(changed.length, 1);
  assert.ok(changed[0].events[s.a.player.id].some((e) => e.type === 'pass'));
});

test('snapshot gives the lobby before the game and a private view after', () => {
  const rooms = mk();
  const a = rooms.create('Ayush');
  const lobby = rooms.snapshot(a.room, a.player.id);
  assert.equal(lobby.kind, 'lobby');
  assert.equal(lobby.lobby.code, a.room.code);
  assert.equal(lobby.lobby.you, a.player.id);
  assert.ok(!JSON.stringify(lobby).includes(a.token));
  const s = started();
  const snap = s.rooms.snapshot(s.room, s.b.player.id);
  assert.equal(snap.kind, 'state');
  assert.equal(snap.view.you, s.b.player.id);
});

test('abandoned rooms are removed after 30 minutes with nobody connected', () => {
  const rooms = mk();
  const a = rooms.create('Ayush');
  rooms.disconnect(a.token);
  clock += 29 * 60_000;
  rooms.tick(clock);
  assert.ok(rooms.rejoin(a.token));
  rooms.disconnect(a.token);
  clock += 31 * 60_000;
  rooms.tick(clock);
  assert.equal(rooms.rejoin(a.token), null);
});
