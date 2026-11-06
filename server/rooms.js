import crypto from 'node:crypto';
import { ROOM_CODE_ALPHABET } from '../shared/cards.js';
import { ActionError, createGame, reduce, tick, setPresence } from './game/engine.js';
import { viewFor, filterEvents } from './game/view.js';

export class RoomError extends Error {
  /** code: bad-name | no-room | full | started | not-host | bad-count | bad-mode | bad-target | no-game */
  constructor(code, message = code) {
    super(message);
    this.code = code;
  }
}

export const MAX_PLAYERS = 7;
export const MIN_PLAYERS = 3;
const HOST_OFFLINE_MS = 30_000;
const ABANDONED_MS = 30 * 60_000;
const hex = (n) => crypto.randomBytes(n).toString('hex');

/** Trim, collapse whitespace, 1 to 16 characters. Returned verbatim as text; the client escapes it. */
function cleanName(name) {
  if (typeof name !== 'string') throw new RoomError('bad-name');
  const n = name.trim().replace(/\s+/g, ' ');
  const len = [...n].length;
  if (len < 1 || len > 16) throw new RoomError('bad-name');
  return n;
}

export class Rooms {
  constructor({ now = Date.now, rng = Math.random } = {}) {
    this.now = now;
    this.rng = rng;
    this.rooms = new Map(); // code -> room
    this.tokens = new Map(); // token -> { room, player }
  }

  #newCode() {
    for (;;) {
      const code = Array.from({ length: 4 }, () => ROOM_CODE_ALPHABET[Math.floor(this.rng() * ROOM_CODE_ALPHABET.length)]).join('');
      if (!this.rooms.has(code)) return code;
    }
  }

  #addPlayer(room, name) {
    const clean = cleanName(name);
    if (room.players.some((p) => p.name.toLowerCase() === clean.toLowerCase())) throw new RoomError('bad-name', 'name taken');
    const player = { id: `p_${hex(4)}`, name: clean, token: hex(12), connected: true, offlineSince: null };
    room.players.push(player);
    this.tokens.set(player.token, { room, player });
    return { room, player, token: player.token };
  }

  #lookup(token) {
    return typeof token === 'string' ? this.tokens.get(token) ?? null : null;
  }

  create(name) {
    cleanName(name);
    const room = { code: this.#newCode(), hostId: null, mode: 'manual', players: [], game: null };
    const out = this.#addPlayer(room, name);
    room.hostId = out.player.id;
    this.rooms.set(room.code, room);
    return out;
  }

  join(code, name) {
    const room = this.rooms.get(String(code ?? '').trim().toUpperCase());
    if (!room) throw new RoomError('no-room');
    if (room.game) return this.#reclaim(room, name);
    if (room.players.length >= MAX_PLAYERS) throw new RoomError('full');
    return this.#addPlayer(room, name);
  }

  /**
   * A started game only admits people already in it: joining with the name of an OFFLINE player (closed tab,
   * dead phone) hands that seat to the newcomer with a fresh token and kills the old one. Anyone else is refused.
   */
  #reclaim(room, name) {
    let clean;
    try { clean = cleanName(name); } catch { throw new RoomError('started'); }
    const player = room.players.find((p) => p.name.toLowerCase() === clean.toLowerCase());
    if (!player || player.connected) throw new RoomError('started');
    this.tokens.delete(player.token);
    player.token = hex(12);
    this.tokens.set(player.token, { room, player });
    this.#setConnected({ room, player }, true);
    return { room, player, token: player.token };
  }

  /** The room a token belongs to, or null. */
  roomOf(token) {
    return this.#lookup(token)?.room ?? null;
  }

  rejoin(token) {
    const hit = this.#lookup(token);
    if (!hit) return null;
    this.#setConnected(hit, true);
    return { room: hit.room, player: hit.player };
  }

  #setConnected({ room, player }, connected) {
    player.connected = connected;
    player.offlineSince = connected ? null : this.now();
    if (room.game) room.game = setPresence(room.game, player.id, connected, this.now()).state;
  }

  disconnect(token) {
    const hit = this.#lookup(token);
    if (hit) this.#setConnected(hit, false);
    return hit?.room ?? null;
  }

  reconnect(token) {
    return this.rejoin(token)?.room ?? null;
  }

  #hostOnly(token) {
    const hit = this.#lookup(token);
    if (!hit || hit.room.hostId !== hit.player.id) throw new RoomError('not-host');
    return hit;
  }

  #remove(room, player) {
    room.players = room.players.filter((p) => p.id !== player.id);
    this.tokens.delete(player.token);
    if (room.players.length === 0) {
      this.rooms.delete(room.code);
    } else if (room.hostId === player.id) {
      room.hostId = room.players[0].id;
    }
  }

  leave(token) {
    const hit = this.#lookup(token);
    if (!hit) return null;
    if (hit.room.game) this.#setConnected(hit, false); // seat is held once the game has started
    else this.#remove(hit.room, hit.player);
    return hit.room;
  }

  kick(token, targetId) {
    const { room, player } = this.#hostOnly(token);
    if (room.game) throw new RoomError('started');
    const target = room.players.find((p) => p.id === targetId);
    if (!target || target.id === player.id) throw new RoomError('bad-target');
    this.#remove(room, target);
    return room;
  }

  setMode(token, mode) {
    const { room } = this.#hostOnly(token);
    if (room.game) throw new RoomError('started');
    if (mode !== 'manual' && mode !== 'auto') throw new RoomError('bad-mode');
    room.mode = mode;
    return room;
  }

  start(token) {
    const { room } = this.#hostOnly(token);
    if (room.game) throw new RoomError('started');
    if (room.players.length < MIN_PLAYERS || room.players.length > MAX_PLAYERS) throw new RoomError('bad-count');
    const seed = Math.floor(this.rng() * 2 ** 32);
    room.game = createGame(room.players.map((p) => ({ id: p.id, name: p.name })), room.mode, seed, this.now());
    // createGame starts everyone online; carry over anyone who dropped in the lobby so their timers behave at once
    for (const p of room.players) {
      if (!p.connected) room.game = setPresence(room.game, p.id, false, p.offlineSince ?? this.now()).state;
    }
    return room;
  }

  #perPlayer(room, events) {
    return Object.fromEntries(room.players.map((p) => [p.id, filterEvents(events, p.id)]));
  }

  /** Runs one player action. The actor is always the token's owner; any `by` in the payload is ignored. */
  act(token, action) {
    const hit = this.#lookup(token);
    if (!hit) return { error: { code: 'no-room', message: 'unknown token' } };
    const { room, player } = hit;
    if (!room.game) return { error: { code: 'no-game', message: 'the game has not started' } };
    try {
      const out = reduce(room.game, { ...action, by: player.id }, this.now());
      room.game = out.state;
      return { changed: true, events: this.#perPlayer(room, out.events) };
    } catch (e) {
      if (e instanceof ActionError) return { error: { code: e.code, message: e.message } };
      throw e;
    }
  }

  /** Drives timers and housekeeping. Returns [{ room, events }] for rooms that changed. */
  tick(now) {
    const changed = [];
    for (const room of [...this.rooms.values()]) {
      let touched = false;
      let events = {};
      if (room.game) {
        const out = tick(room.game, now);
        if (out.state !== room.game || out.events.length) {
          room.game = out.state;
          events = this.#perPlayer(room, out.events);
          touched = true;
        }
      }
      const host = room.players.find((p) => p.id === room.hostId);
      if (host && !host.connected && now - host.offlineSince > HOST_OFFLINE_MS) {
        const next = room.players.find((p) => p.connected);
        if (next) { room.hostId = next.id; touched = true; }
      }
      if (room.players.every((p) => !p.connected)
        && now - Math.max(...room.players.map((p) => p.offlineSince ?? 0)) > ABANDONED_MS) {
        room.players.forEach((p) => this.tokens.delete(p.token));
        this.rooms.delete(room.code);
        continue;
      }
      if (touched) changed.push({ room, events });
    }
    return changed;
  }

  /** What one player should be shown right now: the lobby, or their private game view. Never includes tokens. */
  snapshot(room, playerId) {
    if (room.game) return { kind: 'state', view: viewFor(room.game, playerId) };
    return {
      kind: 'lobby',
      lobby: {
        code: room.code,
        hostId: room.hostId,
        mode: room.mode,
        players: room.players.map((p) => ({ id: p.id, name: p.name, connected: p.connected })),
        you: playerId,
      },
    };
  }
}
