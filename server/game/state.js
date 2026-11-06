import { ITEMS, UNITS, UNIT_IDS } from '../../shared/cards.js';
import { rand, shuffle } from './rng.js';

export const START_CASH = 5000;
export const TURNS_PER_PLAYER = 2;

/** players: [{id, name}] in seat order. Returns a state already in its first round. */
export function createGame(players, mode, seed, now = 0) {
  const state = {
    seed: seed >>> 0,
    mode,
    roundNo: 1,
    order: players.map((p) => p.id),
    players: Object.fromEntries(players.map((p) => [p.id, {
      id: p.id, name: p.name, cash: START_CASH, items: [], eliminated: false,
      connected: true, offlineSince: null, turnsPlayed: 0,
    }])),
    auctioneerId: null,
    itemDeck: [],
    unitDeck: [],
    phase: null,
    unit: null,
    slots: [],
    peeks: {},
    ready: [],
    buyIns: {},
    buyInTurn: null,
    bid: null,
    call: 0,
    roundAuto: false,
    winner: null,
    excluded: [],
    deadline: null,
    voided: false,
    result: null,
  };
  state.itemDeck = shuffle(ITEMS, state);
  state.unitDeck = shuffle(UNIT_IDS.flatMap((id) => Array(UNITS[id].count).fill(id)), state);
  state.auctioneerId = state.order[Math.floor(rand(state) * state.order.length)];
  startRound(state, now);
  return state;
}

/** Draws the unit and its items for state.auctioneerId and resets all per-round fields. */
export function startRound(state, now) {
  const unitId = state.unitDeck.pop();
  if (!unitId) throw new Error('storage unit deck exhausted');
  const { count, ...unit } = UNITS[unitId];
  if (state.itemDeck.length < unit.items) throw new Error('item deck exhausted');
  state.unit = unit;
  state.slots = Array.from({ length: unit.items }, () => ({ item: state.itemDeck.pop(), faceUp: false }));
  state.peeks = {};
  state.ready = [];
  state.buyIns = {};
  state.buyInTurn = null;
  state.bid = null;
  state.call = 0;
  state.roundAuto = false;
  state.winner = null;
  state.excluded = [];
  state.voided = false;
  state.deadline = null;
  beginRoundPhase(state, now);
}

/** Auto mode, or a Manual round the server has taken over. */
export const isAuto = (state) => state.mode === 'auto' || state.roundAuto;

export const TIMERS = {
  autoFlip: 2000, flipIdle: 45000, buyIn: 25000, peekWindow: 15000,
  opening: 10000, callStage: 3000, bidIdle: 45000, payment: 60000, reveal: 4000,
};

/** First phase of a freshly drawn unit: flip (if the unit allows it) or buy-in, with its deadline. */
export function beginRoundPhase(state, now) {
  if (state.unit.flip) {
    state.phase = 'flip';
    state.deadline = state.mode === 'auto'
      ? { kind: 'auto-flip', at: now + TIMERS.autoFlip }
      : { kind: 'flip-idle', at: now + TIMERS.flipIdle };
  } else {
    openBuyIn(state, now);
  }
}

/** Seats that may still buy in, in order starting to the Auctioneer's left. */
export function buyInOrder(state) {
  const from = state.order.indexOf(state.auctioneerId);
  const out = [];
  for (let step = 1; step < state.order.length; step++) {
    const id = state.order[(from + step) % state.order.length];
    if (!state.players[id].eliminated) out.push(id);
  }
  return out;
}

export const nextBuyer = (state) => buyInOrder(state).find((id) => state.buyIns[id] === undefined) ?? null;

export function openBuyIn(state, now) {
  state.phase = 'buyin';
  state.buyInTurn = nextBuyer(state);
  state.deadline = state.buyInTurn ? { kind: 'buyin', at: now + TIMERS.buyIn } : null;
}

/** What a player can pay with: cash plus the face value of items worth more than nothing (junk never counts). */
export const assets = (player) => player.cash + player.items.reduce((n, it) => n + Math.max(0, it.value), 0);

/** advance() plus the events the table animates. */
export function endRound(state, now, events) {
  advance(state, now);
  events.push({ type: 'round-end', roundNo: state.roundNo });
  if (state.phase === 'gameover') events.push({ type: 'game-over', ...state.result });
}

/** Ends the current round: credits the Auctioneer's turn and starts the next round or the game-over. */
export function advance(state, now) {
  state.players[state.auctioneerId].turnsPlayed += 1;
  const alive = state.order.filter((id) => !state.players[id].eliminated);
  const from = state.order.indexOf(state.auctioneerId);
  let next = null;
  if (alive.length > 1) {
    for (let step = 1; step <= state.order.length; step++) {
      const id = state.order[(from + step) % state.order.length];
      const p = state.players[id];
      if (!p.eliminated && p.turnsPlayed < TURNS_PER_PLAYER) { next = id; break; }
    }
  }
  if (!next) {
    state.phase = 'gameover';
    state.deadline = null;
    state.result = { scores: scores(state), winnerIds: winnerIds(state) };
    return;
  }
  state.auctioneerId = next;
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
