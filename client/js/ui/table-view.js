// Pure markup for the game table: every function takes the player's private `view` (see server/game/view.js)
// and returns an HTML string. No DOM access, so it is tested in Node.
import { esc, formatMoney } from '../art/kit.js';
import { renderFlipCard, renderUnitCard } from './card.js';
import { renderPayment } from '../screens/payment.js';

const nameOf = (view, id) => esc(view.players.find((p) => p.id === id)?.name ?? '?');

const BOX = '<svg class="ibox" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 8l9-5 9 5v9l-9 5-9-5z" fill="#d8a05a" stroke="#1d1a2b" stroke-width="2" stroke-linejoin="round"/><path d="M3 8l9 5 9-5M12 13v9" fill="none" stroke="#1d1a2b" stroke-width="2"/></svg>';
const GAVEL = '<svg class="gavel" viewBox="0 0 24 24" aria-label="Auctioneer"><path d="M4 20l8-8" stroke="#1d1a2b" stroke-width="3.4" stroke-linecap="round"/><rect x="9" y="3" width="10" height="6" rx="1.5" transform="rotate(45 14 6)" fill="#ffd23f" stroke="#1d1a2b" stroke-width="2"/></svg>';

export function headline(view) {
  switch (view.phase) {
    case 'flip':
      return 'The Auctioneer is flipping a crate';
    case 'buyin': {
      if (view.can.pass) return `Buy in for ${formatMoney(view.config.buyIn)}, or pass?`;
      const waiting = view.players.filter((p) => p.buyIn === 'pending').length;
      return waiting ? `Waiting for ${waiting} ${waiting === 1 ? 'player' : 'players'} to decide…` : 'Buy-in is closing…';
    }
    case 'peekwin':
      return 'Peek window: bidders may look at one crate';
    case 'bidding':
      return view.bid ? `${nameOf(view, view.bid.bidderId)} leads at ${formatMoney(view.bid.amount)}` : 'Bidding is open: opening bid $100';
    case 'payment':
      return `${nameOf(view, view.winner.playerId)} is paying ${formatMoney(view.winner.price)}`;
    case 'reveal':
      return view.voided ? 'VOID! A Havoc card wiped the unit' : `${nameOf(view, view.winner.playerId)} opens the unit`;
    default:
      return '';
  }
}

export function renderTopbar(view) {
  const clock = view.deadline ? `<span class="clock" data-at="${view.deadline.at}" data-kind="${esc(view.deadline.kind)}"></span>` : '';
  return `<header class="topbar"><div class="tl"><span class="round">Round ${view.roundNo} of ${view.totalRounds}</span>`
    + `<span class="auct">${GAVEL}<span>AUCTIONEER</span><span class="badge auto">AUTO</span></span></div>`
    + `<div class="headline" role="status">${headline(view)}${clock}</div></header>`;
}

export function renderPlayers(view) {
  const chips = view.players.map((p) => {
    const cls = ['chip'];
    if (p.buyIn === 'pending') cls.push('turn');
    if (view.bid?.bidderId === p.id) cls.push('lead');
    if (p.eliminated) cls.push('out');
    if (p.id === view.you) cls.push('me');
    if (!p.connected) cls.push('offline');
    const status = p.eliminated ? '<span class="stat s-out">OUT</span>'
      : p.buyIn === 'in' ? '<span class="stat s-in">IN</span>'
        : p.buyIn === 'pass' ? '<span class="stat s-pass">PASS</span>'
          : p.buyIn === 'pending' ? '<span class="stat s-wait">…</span>' : '';
    return `<div class="${cls.join(' ')}"><span class="cn">${esc(p.name)}</span>`
      + `<span class="cc">${formatMoney(p.cash)}</span><span class="ci">${BOX}${p.itemCount}</span>${status}</div>`;
  });
  return `<div class="players">${chips.join('')}</div>`;
}

function crateLabel(slot) {
  if (slot.faceUp) return 'FLIPPED';
  if (slot.peeked) return 'PEEKED';
  if (slot.item) return 'OPENED';
  return '';
}

export function renderStage(view, ui = {}) {
  const pickable = ui.pick === 'peek' && view.can.peek;
  const crates = view.slots.map((slot) => {
    const tap = pickable && !slot.faceUp && !slot.peeked;
    const label = crateLabel(slot);
    return `<div class="crate${tap ? ' tap' : ''}" data-crate="${slot.index}">${renderFlipCard(slot.item, Boolean(slot.item))}`
      + `${label ? `<span class="label ${label.toLowerCase()}">${label}</span>` : ''}</div>`;
  }).join('');
  return `<section class="stage"><div class="unitwrap">${renderUnitCard(view.unit)}</div><div class="crates">${crates}</div></section>`;
}

export function renderHoldings(view) {
  const total = view.myItems.reduce((n, it) => n + it.value, 0);
  const me = view.players.find((p) => p.id === view.you);
  const chips = view.myItems.map((it) => `<li class="ichip ${it.tier}"><span>${esc(it.name)}</span><b>${formatMoney(it.value)}</b></li>`).join('');
  return `<section class="mine"><div class="mhead"><span>YOUR CASH <b>${formatMoney(me.cash)}</b></span><span>YOUR ITEMS <b>${formatMoney(total)}</b></span></div>`
    + `<ul class="ilist">${chips || '<li class="none">Nothing yet. Win an auction!</li>'}</ul></section>`;
}

/** A bid typed by hand: whole dollars, a multiple of 100, at least 100. Anything else is null. */
export function parseAmount(raw) {
  if (typeof raw !== 'string' || !/^\s*\d+\s*$/.test(raw)) return null;
  const n = Number(raw.trim());
  return n >= 100 && n % 100 === 0 && Number.isSafeInteger(n) ? n : null;
}

const myAssets = (view) => {
  const me = view.players.find((p) => p.id === view.you);
  return me.cash + view.myItems.reduce((n, it) => n + Math.max(0, it.value), 0);
};

const CALL_LABEL = ['GOING ONCE', 'GOING TWICE', 'SOLD!'];

/** "$1,200" as flip-board tiles, one per character (commas become thin separators). */
const tiles = (text) => [...text].map((ch) => `<span class="tile${ch === ',' ? ' sep' : ''}" aria-hidden="true">${esc(ch)}</span>`).join('');

/** Current bid, the leader, and the auctioneer's "going once / twice" banner. */
export function renderBidPanel(view) {
  if (view.phase !== 'bidding') return '';
  const banner = view.call > 0 ? `<div class="callbanner c${view.call}">${CALL_LABEL[view.call - 1]}…</div>` : '';
  return `<section class="bidpanel"><div class="bignum" aria-label="${view.bid ? formatMoney(view.bid.amount) : '$0'}">${tiles(view.bid ? formatMoney(view.bid.amount) : '$0')}</div>`
    + `<div class="leader">${view.bid ? nameOf(view, view.bid.bidderId) : 'No bids yet'}</div>${banner}</section>`;
}

function renderBidControls(view, ui) {
  const { can } = view;
  const parts = [];
  const high = view.bid?.amount ?? 0;
  const assets = myAssets(view);
  if (can.bid) {
    // you can only bid what you can pay (cash plus the value of your items), so bigger steps are switched off
    const quick = [100, 500, 1000].map((add) => {
      const amount = high + add;
      return `<button class="btn" data-act="bid" data-amount="${amount}"${amount > assets ? ' disabled' : ''}>+${formatMoney(add)}</button>`;
    }).join('');
    const custom = parseAmount(ui.custom);
    const ok = custom !== null && custom > high && custom <= assets;
    const tooMuch = custom !== null && custom > assets;
    parts.push(`<div class="quick">${quick}</div>`
      + `<div class="custom"><input id="custom" inputmode="numeric" placeholder="Custom amount" aria-label="Custom bid" value="${esc(ui.custom ?? '')}">`
      + `<button class="btn small go" data-act="bidcustom"${ok ? '' : ' disabled'}>BID</button></div>`
      + `<p class="hint">You can bid up to ${formatMoney(assets)}</p>`
      + `${tooMuch ? `<p class="risk">That is more than you can pay. The most you can bid is ${formatMoney(assets)}.</p>` : ''}`);
  } else if (view.bid?.bidderId === view.you) {
    parts.push("<p class=\"youwin\">You're winning</p>");
  } else if (view.players.find((p) => p.id === view.you)?.buyIn === 'in') {
    parts.push(`<p class="hint">You cannot afford to outbid ${formatMoney(high)}. You can bid up to ${formatMoney(assets)}.</p>`);
  } else {
    parts.push('<p class="hint">You are watching this auction.</p>');
  }
  return parts.join('');
}

export function renderActions(view, ui = {}) {
  const { can } = view;
  const parts = [];
  if (view.players.find((p) => p.id === view.you)?.eliminated) {
    return '<div class="actions"><p class="hint">You were eliminated. You can keep watching.</p></div>';
  }
  if (view.phase === 'bidding') parts.push(renderBidControls(view, ui));
  if (view.phase === 'payment') parts.push(renderPayment(view, ui));
  if (can.peek) parts.push(`<button class="btn${ui.pick === 'peek' ? ' on' : ''}" data-pick="peek">PEEK AT A CRATE</button>`);
  if (can.pass) {
    parts.push(`<button class="btn go" data-act="buyin"${can.buyin ? '' : ' disabled'}>Buy in ${formatMoney(view.config.buyIn)}</button>`);
    parts.push('<button class="btn" data-act="pass">Pass</button>');
  }
  if (can.ready) parts.push('<button class="btn go" data-act="ready">Ready</button>');
  const hint = ui.pick ? `<p class="hint">Tap a crate to ${ui.pick}.</p>` : '';
  return `<div class="actions">${hint}<div class="abtns">${parts.join('')}</div></div>`;
}

/** The whole table. `ui` is local screen state: { pick: null | 'flip' | 'peek' }. */
export function renderTable(view, ui = {}) {
  return `<div class="table phase-${view.phase}" data-phase="${view.phase}">`
    // the bid panel sits under the headline so the number to beat is always on screen; the action bar is sticky
    + `${renderTopbar(view)}${renderBidPanel(view)}${renderPlayers(view)}${renderStage(view, ui)}${renderHoldings(view)}${renderActions(view, ui)}${view.phase === 'reveal' && view.voided ? '<div class="voidstamp" role="status">VOID!</div>' : ''}<div class="toast" role="status"></div></div>`;
}
