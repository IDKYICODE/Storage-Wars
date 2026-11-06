import { isAuto } from './state.js';
import { bidders } from './bidding.js';
import { suggestPayment, assets } from './payment.js';

/**
 * Everything player `me` is allowed to know about the game. The only place state is turned into
 * something a client sees: nothing hidden may leave this function.
 */
export function viewFor(state, me) {
  const mine = state.players[me];
  const isAuctioneer = me === state.auctioneerId;
  const winnerId = state.winner?.playerId ?? null;
  const over = state.phase === 'gameover';

  const slots = state.slots.map((slot, index) => {
    const peeked = (state.peeks[me] || []).includes(index);
    let show = slot.faceUp || peeked || over;
    if (state.phase === 'reveal' && winnerId) {
      if (state.voided) show = show || slot.item.tier === 'havoc';
      else show = show || winnerId === me;
    }
    return { index, faceUp: slot.faceUp, peeked, item: show ? slot.item : null };
  });

  const players = state.order.map((id) => {
    const p = state.players[id];
    let buyIn = state.buyIns[id] ?? null;
    if (state.phase === 'buyin' && id !== state.auctioneerId && !p.eliminated && buyIn === null) buyIn = 'pending';
    return {
      id, name: p.name, cash: p.cash, itemCount: p.items.length, eliminated: p.eliminated,
      connected: p.connected, isAuctioneer: id === state.auctioneerId, turnsPlayed: p.turnsPlayed,
      buyIn, peeked: (state.peeks[id] || []).length > 0, failed: state.excluded.includes(id),
    };
  });

  const alive = !mine.eliminated;
  const hasPeeked = (state.peeks[me] || []).length > 0;
  const anyDown = state.slots.some((s) => !s.faceUp);
  let canPeek = false;
  if (alive && !hasPeeked && anyDown && state.unit) {
    if (isAuctioneer) canPeek = ['flip', 'buyin', 'peekwin'].includes(state.phase);
    else canPeek = ['buyin', 'peekwin'].includes(state.phase) && state.unit.peek !== 'never'
      && (state.unit.peek === 'before' || state.buyIns[me] === 'in');
  }
  const myTurnToDecide = state.phase === 'buyin' && state.buyInTurn === me;
  const can = {
    flip: alive && state.phase === 'flip' && isAuctioneer && !isAuto(state),
    peek: canPeek,
    ready: alive && state.phase === 'peekwin' && state.buyIns[me] === 'in' && !state.ready.includes(me) && !hasPeeked,
    buyin: alive && myTurnToDecide && mine.cash >= 100,
    pass: alive && myTurnToDecide,
    bid: alive && state.phase === 'bidding' && bidders(state).includes(me) && state.bid?.bidderId !== me,
    call: alive && state.phase === 'bidding' && isAuctioneer && !isAuto(state),
    pay: alive && state.phase === 'payment' && winnerId === me,
  };

  return {
    you: me,
    phase: state.phase,
    roundNo: state.roundNo,
    totalRounds: 2 * state.order.length,
    mode: state.mode,
    roundAuto: state.roundAuto,
    auctioneerId: state.auctioneerId,
    unit: state.unit,
    slots,
    players,
    myItems: mine.items,
    bid: state.bid,
    call: state.call,
    buyInTurn: state.buyInTurn,
    can,
    winner: state.winner,
    payment: can.pay
      ? { price: state.winner.price, assets: assets(mine), suggested: suggestPayment(mine, state.winner.price) }
      : null,
    deadline: state.deadline,
    voided: state.voided,
    gameover: over
      ? {
        scores: state.result.scores,
        winnerIds: state.result.winnerIds,
        allItems: Object.fromEntries(state.order.map((id) => [id, state.players[id].items])),
      }
      : null,
  };
}

/** Events this player may see: public ones, plus private ones addressed to them. Reveals never carry items. */
export function filterEvents(events, me) {
  return events
    .filter((e) => !e.to || e.to === me)
    .map((e) => {
      if (e.type !== 'revealed' || e.to) return e;
      const { items, item, ...rest } = e; // eslint-disable-line no-unused-vars
      return item?.tier === 'havoc' ? { ...rest, item } : rest;
    });
}
