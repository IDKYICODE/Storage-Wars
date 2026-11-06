import { registerTimeout } from './registry.js';
import { TIMERS, endRound } from './state.js';

/**
 * A sold unit is paid for at once, in cash: bids can never exceed the cash a player holds, and nobody's cash changes
 * during bidding, so the winner always has it. The money goes to the bank (the automatic Auctioneer keeps nothing).
 * Then the unit is opened: the winner sees what was inside, everyone else only sees that it happened.
 */
export function settleSale(state, now, events) {
  const winnerId = state.winner.playerId;
  const price = state.winner.price;
  const winner = state.players[winnerId];
  winner.cash -= price;
  state.bank += price;
  events.push({ type: 'paid', by: winnerId, price, cash: price });

  const items = state.slots.map((s) => s.item);
  const havoc = items.find((i) => i.tier === 'havoc');
  state.phase = 'reveal';
  state.deadline = { kind: 'reveal', at: now + TIMERS.reveal };
  if (havoc) {
    state.voided = true;
    events.push({ type: 'revealed', winnerId, voided: true, item: havoc });
    events.push({ type: 'voided', reason: 'won', item: havoc });
  } else {
    winner.items.push(...items);
    events.push({ type: 'revealed', to: winnerId, items });
    events.push({ type: 'revealed', winnerId, count: items.length });
  }
}

registerTimeout('reveal', (state, now, events) => endRound(state, now, events));
