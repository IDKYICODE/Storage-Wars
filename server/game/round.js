import { ActionError, registerHandler, registerTimeout } from './registry.js';
import { rand } from './rng.js';
import { TIMERS, endRound, openBuyIn, undecidedBuyers, isAuto } from './state.js';
import { enterBidding } from './bidding.js';

const need = (ok, code, msg) => { if (!ok) throw new ActionError(code, msg); };
const validIndex = (state, i) => Number.isInteger(i) && i >= 0 && i < state.slots.length && !state.slots[i].faceUp;

function doFlip(state, index, now, events) {
  const slot = state.slots[index];
  slot.faceUp = true;
  events.push({ type: 'flipped', index, item: slot.item });
  if (slot.item.tier === 'havoc') {
    state.voided = true;
    events.push({ type: 'voided', reason: 'flip', item: slot.item });
    endRound(state, now, events);
    return;
  }
  openBuyIn(state, now);
}

function flipRandom(state, now, events) {
  const down = state.slots.map((s, i) => (s.faceUp ? -1 : i)).filter((i) => i >= 0);
  doFlip(state, down[Math.floor(rand(state) * down.length)], now, events);
}

function maybeEndPeekWindow(state, now) {
  const buyers = state.order.filter((id) => state.buyIns[id] === 'in');
  if (buyers.every((id) => state.ready.includes(id) || (state.peeks[id] || []).length > 0)) enterBidding(state, now);
}

function afterBuyInDecision(state, now, events) {
  if (undecidedBuyers(state).length) return; // everyone decides at the same time; the shared clock keeps running
  state.deadline = null;
  const buyers = state.order.filter((id) => state.buyIns[id] === 'in');
  if (!buyers.length) {
    events.push({ type: 'discarded' });
    endRound(state, now, events);
  } else if (state.unit.peek === 'never') {
    enterBidding(state, now);
  } else {
    state.phase = 'peekwin';
    state.ready = [];
    state.deadline = { kind: 'peekwin', at: now + TIMERS.peekWindow };
    maybeEndPeekWindow(state, now);
  }
}

registerHandler('flip', (state, action, now, events) => {
  need(state.phase === 'flip', 'wrong-phase');
  need(action.by === state.auctioneerId && !isAuto(state), 'not-allowed');
  need(validIndex(state, action.index), 'invalid', 'bad crate');
  doFlip(state, action.index, now, events);
});

registerHandler('peek', (state, action, now, events) => {
  const by = action.by;
  if (by === state.auctioneerId) {
    need(['flip', 'buyin', 'peekwin'].includes(state.phase), 'wrong-phase');
  } else {
    need(['buyin', 'peekwin'].includes(state.phase), 'wrong-phase');
    need(state.unit.peek !== 'never', 'not-allowed', 'this unit cannot be peeked');
    need(state.unit.peek === 'before' || state.buyIns[by] === 'in', 'not-allowed', 'buy in first');
  }
  need((state.peeks[by] || []).length === 0, 'invalid', 'already peeked');
  need(validIndex(state, action.index), 'invalid', 'bad crate');
  state.peeks[by] = [action.index];
  events.push({ type: 'peeked', to: by, index: action.index, item: state.slots[action.index].item });
  events.push({ type: 'peek-used', by });
  if (state.phase === 'peekwin') maybeEndPeekWindow(state, now);
});

registerHandler('ready', (state, action, now) => {
  need(state.phase === 'peekwin', 'wrong-phase');
  need(state.buyIns[action.by] === 'in', 'not-allowed');
  if (!state.ready.includes(action.by)) state.ready.push(action.by);
  maybeEndPeekWindow(state, now);
});

function decide(state, by, choice, now, events, auto = false) {
  need(state.phase === 'buyin', 'wrong-phase');
  need(undecidedBuyers(state).includes(by), 'not-allowed', 'you have already decided, or you cannot buy in');
  if (choice === 'in') {
    const fee = state.config.buyIn;
    need(state.players[by].cash >= fee, 'invalid', 'not enough cash');
    state.players[by].cash -= fee;
    state.players[state.auctioneerId].cash += fee;
    state.buyIns[by] = 'in';
    events.push({ type: 'buyin', by });
  } else {
    state.buyIns[by] = 'pass';
    events.push({ type: 'pass', by, auto });
  }
  afterBuyInDecision(state, now, events);
}

/** Passes for a player who is not deciding (clock ran out, or they are offline). */
export function autoPass(state, by, now, events) {
  decide(state, by, 'pass', now, events, true);
}

registerHandler('buyin', (state, action, now, events) => decide(state, action.by, 'in', now, events));
registerHandler('pass', (state, action, now, events) => decide(state, action.by, 'pass', now, events));

registerTimeout('auto-flip', (state, now, events) => flipRandom(state, now, events));
registerTimeout('flip-idle', (state, now, events) => {
  state.roundAuto = true;
  events.push({ type: 'auto-takeover' });
  flipRandom(state, now, events);
});
registerTimeout('buyin', (state, now, events) => {
  for (const id of undecidedBuyers(state)) autoPass(state, id, now, events);
});
registerTimeout('peekwin', (state, now) => enterBidding(state, now));
