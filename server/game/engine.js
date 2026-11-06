import { ActionError, getHandler, getTimeout } from './registry.js';
import { autoPass } from './round.js';
import './bidding.js';
import './payment.js';
import { undecidedBuyers } from './state.js';

export { ActionError } from './registry.js';
export { createGame } from './state.js';

/**
 * Applies one player action. Never mutates `state`; returns { state, events }.
 * Throws ActionError for anything illegal (the caller keeps its old state).
 */
export function reduce(state, action, now) {
  const handler = getHandler(action?.type);
  if (!handler) throw new ActionError('invalid', `unknown action ${action?.type}`);
  const actor = state.players[action.by];
  if (!actor || actor.eliminated) throw new ActionError('not-allowed', 'unknown or eliminated player');
  const next = structuredClone(state);
  const events = [];
  handler(next, action, now, events);
  return { state: next, events };
}

export const OFFLINE_PASS_MS = 8000;

/** Marks a player connected or offline (the server calls this on socket connect/disconnect). */
export function setPresence(state, playerId, connected, now) {
  const next = structuredClone(state);
  const p = next.players[playerId];
  p.connected = connected;
  p.offlineSince = connected ? null : now;
  return { state: next, events: [] };
}

/** Presence rules: a player who is offline and has not decided passes for themselves. */
function presenceStep(state, now) {
  const events = [];
  let next = null;
  const edit = () => (next ??= structuredClone(state));

  // Buy-in is simultaneous: anyone still undecided who has been offline for a few seconds passes for themselves.
  // (A short grace lets a refreshed page get back in before it loses the decision.)
  if (state.phase === 'buyin') {
    for (const id of undecidedBuyers(state)) {
      const p = state.players[id];
      if (p.connected || p.offlineSince === null || now - p.offlineSince <= OFFLINE_PASS_MS) continue;
      autoPass(edit(), id, now, events);
      if (next.phase !== 'buyin') break;
    }
  }

  return { state: next ?? state, events };
}

/**
 * Applies presence rules, then fires the current deadline's handler if it has passed.
 * Returns the same state object when nothing happens.
 */
export function tick(state, now) {
  const pre = presenceStep(state, now);
  const events = [...pre.events];
  let cur = pre.state;
  const d = cur.deadline;
  if (d && now >= d.at) {
    const fn = getTimeout(d.kind);
    if (!fn) throw new Error(`no timeout handler for ${d.kind}`);
    const next = structuredClone(cur);
    next.deadline = null;
    fn(next, now, events);
    cur = next;
  }
  return { state: cur, events };
}
