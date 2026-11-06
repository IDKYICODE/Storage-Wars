import http from 'node:http';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import express from 'express';
import { Server as IOServer } from 'socket.io';
import { Rooms, RoomError } from './rooms.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const ACT_LIMIT_PER_SECOND = 20;

const isPlain = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);
const fail = (code, message = code) => ({ ok: false, code, message });

/**
 * tickMs: how often timers are checked. now: the game clock (tests speed it up).
 * Resolves to { port, io, rooms, close } (rooms is exposed for in-process tests only; nothing serves it).
 */
export function startServer({ port = Number(process.env.PORT) || 3000, tickMs = 500, now = Date.now } = {}) {
  const app = express();
  app.get('/healthz', (_req, res) => res.type('text/plain').send('ok'));
  app.use('/shared', express.static(path.join(root, 'shared')));
  app.use(express.static(path.join(root, 'client')));

  const httpServer = http.createServer(app);
  const io = new IOServer(httpServer);
  const rooms = new Rooms({ now });
  const sockets = new Map(); // player token -> socket

  /** Sends every connected player of the room their own view (and their own events). */
  function push(room, eventsByPlayer = {}) {
    for (const p of room.players) {
      const sock = sockets.get(p.token);
      if (!sock) continue;
      const snap = rooms.snapshot(room, p.id);
      if (snap.kind === 'lobby') sock.emit('lobby', snap.lobby);
      else sock.emit('state', { view: snap.view, events: eventsByPlayer[p.id] ?? [], serverNow: now() });
    }
  }

  io.on('connection', (socket) => {
    let token = null;
    let windowStart = 0;
    let count = 0;
    // One live connection per seat. If the same seat is opened somewhere else (a second tab, a duplicated tab),
    // the older connection is told to stand down instead of both silently acting as the same player.
    const bind = (t) => {
      const old = sockets.get(t);
      if (old && old !== socket) old.emit('closed', { reason: 'other-tab' });
      token = t;
      sockets.set(t, socket);
    };

    /** Wraps a handler: payload must be a plain object, RoomError becomes an ack, nothing throws into the socket. */
    const on = (event, handler) => socket.on(event, (payload, ack) => {
      const reply = typeof ack === 'function' ? ack : () => {};
      try {
        if (!isPlain(payload) && payload !== undefined) return reply(fail('invalid'));
        reply(handler(payload ?? {}) ?? { ok: true });
      } catch (e) {
        if (e instanceof RoomError) reply(fail(e.code, e.message));
        else { console.error(e); reply(fail('server', 'something went wrong')); }
      }
    });

    on('room:create', ({ name }) => {
      const out = rooms.create(name);
      bind(out.token);
      push(out.room);
      return { ok: true, token: out.token, code: out.room.code };
    });

    on('room:join', ({ code, name }) => {
      const out = rooms.join(code, name);
      bind(out.token);
      push(out.room);
      return { ok: true, token: out.token, code: out.room.code };
    });

    on('room:rejoin', ({ token: t }) => {
      const hit = rooms.rejoin(t);
      if (!hit) return fail('no-room');
      bind(t);
      push(hit.room);
      return { ok: true, code: hit.room.code };
    });

    on('room:leave', () => {
      if (!token) return fail('no-room');
      const room = rooms.leave(token);
      sockets.delete(token);
      token = null;
      if (room && rooms.rooms.has(room.code)) push(room);
      return { ok: true };
    });

    on('room:kick', ({ playerId }) => {
      const room = rooms.roomOf(token);
      if (!room) return fail('no-room');
      const targetToken = room.players.find((p) => p.id === playerId)?.token;
      rooms.kick(token, playerId);
      const kicked = sockets.get(targetToken);
      if (kicked) { kicked.emit('closed', { reason: 'kicked' }); sockets.delete(targetToken); }
      push(room);
      return { ok: true };
    });

    on('room:mode', ({ mode }) => {
      const room = rooms.setMode(token, mode);
      push(room);
      return { ok: true };
    });

    on('room:start', () => {
      const room = rooms.start(token);
      push(room);
      return { ok: true };
    });

    on('game:act', (action) => {
      const t = Date.now();
      if (t - windowStart > 1000) { windowStart = t; count = 0; }
      if (++count > ACT_LIMIT_PER_SECOND) return fail('rate', 'slow down');
      if (typeof action.type !== 'string') return fail('invalid');
      if (!token || sockets.get(token) !== socket) return fail('no-room', 'this seat is open in another tab');
      const r = rooms.act(token, action);
      if (r.error) return { ok: false, ...r.error };
      push(rooms.roomOf(token), r.events);
      return { ok: true };
    });

    socket.on('disconnect', () => {
      if (!token || sockets.get(token) !== socket) return;
      sockets.delete(token);
      const room = rooms.disconnect(token);
      if (room && rooms.rooms.has(room.code)) push(room);
    });
  });

  const timer = setInterval(() => {
    for (const { room, events } of rooms.tick(now())) push(room, events);
  }, tickMs);
  timer.unref();

  return new Promise((resolve) => {
    httpServer.listen(port, () => {
      resolve({
        port: httpServer.address().port,
        io,
        rooms,
        close: () => new Promise((done) => {
          clearInterval(timer);
          io.close(() => done());
        }),
      });
    });
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  startServer().then((s) => console.log(`STORAGE WARS listening on ${s.port}`));
}
