import { ActionError, registerHandler, registerTimeout } from './registry.js';
import { TIMERS, assets, endRound } from './state.js';
import { bidders, enterBidding } from './bidding.js';

export { assets };
export const FINE = 1000;

const need = (ok, code, msg) => { if (!ok) throw new ActionError(code, msg); };

/**
 * Cash first, then the items that cover the rest with the least overpayment (fewest items on ties).
 * Returns { cash, itemIds } or null when the player cannot afford `price`.
 */
export function suggestPayment(player, price) {
  if (assets(player) < price) return null;
  if (player.cash >= price) return { cash: price, itemIds: [] };
  const needed = price - player.cash;
  const reach = new Map([[0, []]]); // reachable item-value sums -> item ids using the fewest items
  for (const it of player.items.filter((x) => x.value > 0)) {
    for (const [sum, ids] of [...reach]) {
      const next = sum + it.value;
      const cur = reach.get(next);
      if (!cur || cur.length > ids.length + 1) reach.set(next, [...ids, it.id]);
    }
  }
  const best = Math.min(...[...reach.keys()].filter((s) => s >= needed));
  return { cash: player.cash, itemIds: reach.get(best) };
}

/** Throws ActionError('invalid') unless `pay` is a legal way for `player` to cover `price`. Overpaying is fine. */
export function validatePayment(player, price, pay) {
  const bad = (m) => { throw new ActionError('invalid', m); };
  if (!pay || !Number.isInteger(pay.cash) || pay.cash < 0 || pay.cash > player.cash) bad('cash');
  if (!Array.isArray(pay.itemIds) || new Set(pay.itemIds).size !== pay.itemIds.length) bad('items');
  let sum = pay.cash;
  for (const id of pay.itemIds) {
    const item = player.items.find((x) => x.id === id);
    if (!item || item.value <= 0) bad('item');
    sum += item.value;
  }
  if (sum < price) bad('total below price');
}

function transfer(state, fromId, pay) {
  const from = state.players[fromId];
  const to = fromId === state.auctioneerId ? null : state.players[state.auctioneerId]; // an Auctioneer who pays pays the bank
  from.cash -= pay.cash;
  if (to) to.cash += pay.cash;
  else state.bank += pay.cash;
  for (const id of pay.itemIds) {
    const idx = from.items.findIndex((x) => x.id === id);
    const [item] = from.items.splice(idx, 1);
    if (to) to.items.push(item);
    else state.bank += item.value;
  }
}

/**
 * Announces a payment or fine. The public event says how much cash moved and how many items, never which:
 * held items are hidden information. Only the payer and the Auctioneer (who now holds them) get the ids.
 */
function announce(state, events, type, base, pay) {
  events.push({ type, ...base, cash: pay.cash, itemCount: pay.itemIds.length });
  if (!pay.itemIds.length) return;
  for (const to of new Set([base.by, state.auctioneerId])) events.push({ type: `${type}-items`, to, itemIds: pay.itemIds });
}

function reveal(state, now, events) {
  const winnerId = state.winner.playerId;
  const items = state.slots.map((s) => s.item);
  const havoc = items.find((i) => i.tier === 'havoc');
  state.phase = 'reveal';
  state.deadline = { kind: 'reveal', at: now + TIMERS.reveal };
  if (havoc) {
    state.voided = true;
    events.push({ type: 'revealed', winnerId, voided: true, item: havoc });
    events.push({ type: 'voided', reason: 'won', item: havoc });
  } else {
    state.players[winnerId].items.push(...items);
    events.push({ type: 'revealed', to: winnerId, items });
    events.push({ type: 'revealed', winnerId, count: items.length });
  }
}

function fail(state, now, events) {
  const id = state.winner.playerId;
  const w = state.players[id];
  const sug = suggestPayment(w, FINE);
  if (sug) {
    transfer(state, id, sug);
    announce(state, events, 'fined', { by: id, amount: FINE }, sug);
  } else {
    transfer(state, id, { cash: w.cash, itemIds: w.items.map((x) => x.id) });
    w.eliminated = true;
    events.push({ type: 'eliminated', by: id });
  }
  state.excluded.push(id);
  state.winner = null;
  if (bidders(state).length === 0) {
    events.push({ type: 'discarded' });
    endRound(state, now, events);
  } else {
    enterBidding(state, now);
  }
}

registerHandler('pay', (state, action, now, events) => {
  need(state.phase === 'payment', 'wrong-phase');
  need(action.by === state.winner.playerId, 'not-allowed');
  const pay = { cash: action.cash, itemIds: action.itemIds };
  validatePayment(state.players[action.by], state.winner.price, pay);
  transfer(state, action.by, pay);
  announce(state, events, 'paid', { by: action.by, price: state.winner.price }, pay);
  reveal(state, now, events);
});

registerTimeout('payment', (state, now, events) => {
  const { playerId, price } = state.winner;
  const sug = suggestPayment(state.players[playerId], price);
  if (!sug) return fail(state, now, events);
  transfer(state, playerId, sug);
  announce(state, events, 'paid', { by: playerId, price, auto: true }, sug);
  reveal(state, now, events);
});

registerTimeout('reveal', (state, now, events) => endRound(state, now, events));
