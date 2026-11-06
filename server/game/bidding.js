import { ActionError, registerHandler, registerTimeout } from './registry.js';
import { TIMERS, assets, buyInOrder, isAuto } from './state.js';

const need = (ok, code, msg) => { if (!ok) throw new ActionError(code, msg); };

/** Players still in this auction: paid the buy-in, not failed, not eliminated. */
export const bidders = (state) => buyInOrder(state).filter((id) => state.buyIns[id] === 'in' && !state.excluded.includes(id));

/** Opens (or reopens after a failed payment) the bidding phase. */
export function enterBidding(state, now) {
  state.phase = 'bidding';
  state.bid = null;
  state.call = 0;
  state.deadline = isAuto(state)
    ? { kind: 'opening', at: now + TIMERS.opening }
    : { kind: 'bid-idle', at: now + TIMERS.bidIdle };
}

/** Re-arms the clock after any bid or call. */
function rearm(state, now) {
  state.deadline = isAuto(state)
    ? { kind: 'call', at: now + TIMERS.callStage }
    : { kind: 'bid-idle', at: now + TIMERS.bidIdle };
}

function autoOpen(state, now, events) {
  const first = bidders(state)[0];
  state.bid = { amount: 100, bidderId: first };
  state.call = 0;
  events.push({ type: 'bid', by: first, amount: 100, auto: true });
}

function sold(state, now, events) {
  state.winner = { playerId: state.bid.bidderId, price: state.bid.amount };
  state.phase = 'payment';
  // a winner who cannot possibly pay is failed on the next tick instead of waiting out the clock
  const unaffordable = assets(state.players[state.winner.playerId]) < state.winner.price;
  state.deadline = { kind: 'payment', at: now + (unaffordable ? 0 : TIMERS.payment) };
  events.push({ type: 'sold', playerId: state.winner.playerId, price: state.winner.price });
}

registerHandler('bid', (state, action, now, events) => {
  need(state.phase !== 'payment' && state.phase !== 'reveal', 'too-late', 'the auction is over');
  need(state.phase === 'bidding', 'wrong-phase');
  need(bidders(state).includes(action.by), 'not-allowed', 'you are not in this auction');
  need(state.bid?.bidderId !== action.by, 'not-allowed', 'you already lead');
  const a = action.amount;
  need(Number.isInteger(a) && a >= 100 && a % 100 === 0 && a > (state.bid?.amount ?? 0), 'invalid', 'bad amount');
  state.bid = { amount: a, bidderId: action.by };
  state.call = 0;
  events.push({ type: 'bid', by: action.by, amount: a });
  rearm(state, now);
});

registerHandler('call', (state, action, now, events) => {
  need(state.phase === 'bidding', 'wrong-phase');
  need(action.by === state.auctioneerId && !isAuto(state), 'not-allowed');
  if (!state.bid) {
    autoOpen(state, now, events);
  } else if (state.call < 2) {
    state.call += 1;
    events.push({ type: 'call', n: state.call });
  } else {
    sold(state, now, events);
    return;
  }
  rearm(state, now);
});

registerTimeout('opening', (state, now, events) => {
  autoOpen(state, now, events);
  rearm(state, now);
});

registerTimeout('call', (state, now, events) => {
  if (state.call < 2) {
    state.call += 1;
    events.push({ type: 'call', n: state.call });
    rearm(state, now);
  } else {
    sold(state, now, events);
  }
});

registerTimeout('bid-idle', (state, now, events) => {
  state.roundAuto = true;
  events.push({ type: 'auto-takeover' });
  if (!state.bid) autoOpen(state, now, events);
  rearm(state, now);
});
