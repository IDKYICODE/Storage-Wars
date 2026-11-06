import { ActionError, registerHandler, registerTimeout } from './registry.js';
import { TIMERS, buyInOrder, endRound } from './state.js';
import { settleSale } from './payment.js';

const need = (ok, code, msg) => { if (!ok) throw new ActionError(code, msg); };

/** Players still in this auction: paid the buy-in, not failed, not eliminated. */
export const bidders = (state) => buyInOrder(state).filter((id) => state.buyIns[id] === 'in' && !state.excluded.includes(id));

/** Opens (or reopens after a failed payment) the bidding phase. */
export function enterBidding(state, now) {
  state.phase = 'bidding';
  state.bid = null;
  state.call = 0;
  state.deadline = { kind: 'opening', at: now + TIMERS.opening };
}

/** Re-arms the clock after any bid or call. */
function rearm(state, now) {
  state.deadline = { kind: 'call', at: now + TIMERS.callStage };
}

/**
 * The automatic $100 opening bid goes to the first buyer left of the Auctioneer who can actually pay it.
 * Returns false (and ends the round) when nobody can.
 */
function autoOpen(state, now, events) {
  const first = bidders(state).find((id) => state.players[id].cash >= 100);
  if (!first) {
    events.push({ type: 'discarded' });
    endRound(state, now, events);
    return false;
  }
  state.bid = { amount: 100, bidderId: first };
  state.call = 0;
  events.push({ type: 'bid', by: first, amount: 100, auto: true });
  return true;
}

function sold(state, now, events) {
  state.winner = { playerId: state.bid.bidderId, price: state.bid.amount };
  events.push({ type: 'sold', playerId: state.winner.playerId, price: state.winner.price });
  settleSale(state, now, events); // the winner pays in cash on the spot and the unit is opened
}

registerHandler('bid', (state, action, now, events) => {
  need(state.phase !== 'reveal', 'too-late', 'the auction is over');
  need(state.phase === 'bidding', 'wrong-phase');
  need(bidders(state).includes(action.by), 'not-allowed', 'you are not in this auction');
  need(state.bid?.bidderId !== action.by, 'not-allowed', 'you already lead');
  const a = action.amount;
  need(Number.isInteger(a) && a >= 100 && a % 100 === 0 && a > (state.bid?.amount ?? 0), 'invalid', 'bad amount');
  need(a <= state.players[action.by].cash, 'invalid', 'more than the cash you have');
  state.bid = { amount: a, bidderId: action.by };
  state.call = 0;
  events.push({ type: 'bid', by: action.by, amount: a });
  rearm(state, now);
});

registerTimeout('opening', (state, now, events) => {
  if (autoOpen(state, now, events)) rearm(state, now);
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
