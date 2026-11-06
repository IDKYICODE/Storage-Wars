import { ITEMS, UNITS, UNIT_IDS } from '../../shared/cards.js';
import { shuffle } from './rng.js';

export const DEFAULT_CONFIG = { startCash: 5000, rounds: 8, buyIn: 100 };

export const MAX_ROUNDS = 99;

const isStep = (v, lo, hi, step) => Number.isInteger(v) && v >= lo && v <= hi && v % step === 0;
/** True if `patch` only holds legal values (used when the host edits settings in the lobby). */
export function settingProblem(key, value) {
  if (key === 'startCash') return isStep(value, 1000, 20000, 1000) ? null : 'startCash must be a whole thousand from $1,000 to $20,000';
  if (key === 'buyIn') return isStep(value, 100, 1000, 100) ? null : 'buyIn must be a multiple of $100 up to $1,000';
  if (key === 'rounds') return isStep(value, 1, MAX_ROUNDS, 1) ? null : `rounds must be 1 to ${MAX_ROUNDS}`;
  return `unknown setting ${key}`;
}

/** Fills defaults for anything missing or illegal. Never throws. */
export function normalizeConfig(cfg = {}) {
  const pick = (key) => (cfg[key] !== undefined && !settingProblem(key, cfg[key]) ? cfg[key] : DEFAULT_CONFIG[key]);
  return { startCash: pick('startCash'), buyIn: pick('buyIn'), rounds: pick('rounds') };
}

/** players: [{id, name}] in seat order. Returns a state already in its first round. */
export function createGame(players, seed, now = 0, config = {}) {
  const cfg = normalizeConfig(config);
  const state = {
    seed: seed >>> 0,
    config: cfg,
    roundNo: 1,
    order: players.map((p) => p.id),
    players: Object.fromEntries(players.map((p) => [p.id, {
      id: p.id, name: p.name, cash: cfg.startCash, items: [], eliminated: false,
      connected: true, offlineSince: null,
    }])),
    itemDeck: [],
    unitDeck: [],
    phase: null,
    unit: null,
    slots: [],
    peeks: {},
    ready: [],
    buyIns: {},
    bid: null,
    call: 0,
    bank: 0,
    winner: null,
    excluded: [],
    deadline: null,
    voided: false,
    result: null,
  };
  state.itemDeck = shuffle(ITEMS, state);
  state.unitDeck = shuffle(UNIT_IDS.flatMap((id) => Array(UNITS[id].count).fill(id)), state);
  startRound(state, now);
  return state;
}

/**
 * Long games outlast the 56 cards: when the item deck cannot cover a unit, a fresh shuffled set is added underneath
 * what is left. A card already in someone's hand or in the deck comes back as a copy with a new id (`base` keeps its art),
 * so ids stay unique.
 */
function refillItems(state, needed) {
  if (state.itemDeck.length >= needed) return;
  const taken = new Set([...state.itemDeck, ...Object.values(state.players).flatMap((p) => p.items)].map((it) => it.id));
  const fresh = ITEMS.map((it) => {
    if (!taken.has(it.id)) return it;
    state.copyNo = (state.copyNo ?? 0) + 1;
    return { ...it, id: `${it.id}~${state.copyNo}`, base: it.id };
  });
  state.itemDeck = [...shuffle(fresh, state), ...state.itemDeck];
}

/** Draws the next unit and its items and resets all per-round fields. */
export function startRound(state, now) {
  if (!state.unitDeck.length) state.unitDeck = shuffle(UNIT_IDS.flatMap((id) => Array(UNITS[id].count).fill(id)), state);
  const unitId = state.unitDeck.pop();
  const { count, ...unit } = UNITS[unitId];
  refillItems(state, unit.items);
  state.unit = unit;
  state.slots = Array.from({ length: unit.items }, () => ({ item: state.itemDeck.pop(), faceUp: false }));
  state.peeks = {};
  state.ready = [];
  state.buyIns = {};
  state.bid = null;
  state.call = 0;
  state.winner = null;
  state.excluded = [];
  state.voided = false;
  state.deadline = null;
  beginRoundPhase(state, now);
}

export const TIMERS = {
  autoFlip: 2000, buyIn: 25000, peekWindow: 15000,
  opening: 10000, callStage: 3000, reveal: 4000,
};

/** First phase of a freshly drawn unit: flip (if the unit allows it) or buy-in, with its deadline. */
export function beginRoundPhase(state, now) {
  if (state.unit.flip) {
    state.phase = 'flip';
    state.deadline = { kind: 'auto-flip', at: now + TIMERS.autoFlip };
  } else {
    openBuyIn(state, now);
  }
}

/** Every player still in, in seat order starting one seat further each round (so the free opening bid rotates). */
export function buyInOrder(state) {
  const from = state.roundNo - 1;
  const out = [];
  for (let step = 0; step < state.order.length; step++) {
    const id = state.order[(from + step) % state.order.length];
    if (!state.players[id].eliminated) out.push(id);
  }
  return out;
}

/** Players who have not yet chosen buy in or pass. Everyone decides at the same time. */
export const undecidedBuyers = (state) => buyInOrder(state).filter((id) => state.buyIns[id] === undefined);

/** One shared clock for the whole buy-in phase; whoever has not chosen when it runs out passes. */
export function openBuyIn(state, now) {
  state.phase = 'buyin';
  state.deadline = { kind: 'buyin', at: now + TIMERS.buyIn };
}

/** advance() plus the events the table animates. */
export function endRound(state, now, events) {
  advance(state, now);
  events.push({ type: 'round-end', roundNo: state.roundNo });
  if (state.phase === 'gameover') events.push({ type: 'game-over', ...state.result });
}

/** Ends the current round and starts the next one, or ends the game after the last round. */
export function advance(state, now) {
  const alive = state.order.filter((id) => !state.players[id].eliminated);
  if (alive.length <= 1 || state.roundNo >= state.config.rounds) {
    state.phase = 'gameover';
    state.deadline = null;
    state.result = { scores: scores(state), winnerIds: winnerIds(state) };
    return;
  }
  state.roundNo += 1;
  startRound(state, now);
}

/** Every player's final tally, best first (ties keep seat order). */
export function scores(state) {
  return state.order
    .map((id) => {
      const p = state.players[id];
      const itemValue = p.items.reduce((n, it) => n + it.value, 0);
      return { id, name: p.name, cash: p.cash, itemValue, total: p.cash + itemValue };
    })
    .sort((a, b) => b.total - a.total);
}

export function winnerIds(state) {
  const sc = scores(state);
  return sc.filter((s) => s.total === sc[0].total).map((s) => s.id);
}
