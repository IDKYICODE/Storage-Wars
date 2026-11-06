// The illustrated rulebook opened from the entry screen. Every picture is the real game markup (the same
// functions the table uses), fed a small made-up view, so what players read here is what they will see.
import { ITEMS, UNITS } from '../../../shared/cards.js';
import { renderFlipCard, renderUnitCard } from '../ui/card.js';
import { renderBidPanel, renderPlayers } from '../ui/table-view.js';

const item = (name) => ITEMS.find((i) => i.name === name);
const card = (name) => renderFlipCard(item(name), true);
/** Pictures must not be clickable: drop every hook the real screens attach their handlers to. */
const still = (html) => html.replace(/ (?:data-act|data-item|id)="[^"]*"/g, '');

const player = (id, name, cash, itemCount, extra = {}) => ({
  id, name, cash, itemCount, buyIn: null, eliminated: false, connected: true, ...extra,
});
const PLAYERS = [
  player('a', 'MAYA', 5600, 1),
  player('me', 'YOU', 4200, 2),
  player('c', 'RAJ', 3900, 3),
  player('d', 'TESS', 5000, 0),
];
const view = (extra = {}) => ({ you: 'me', players: PLAYERS, myItems: [], bid: null, ...extra });
const withBuyIns = (states) => PLAYERS.map((p, i) => (states[i] === undefined ? p : { ...p, buyIn: states[i] }));

const crate = (name, label = '', open = false) => `<div class="crate">${renderFlipCard(name ? item(name) : null, open)}`
  + `${label ? `<span class="label ${label.toLowerCase()}">${label}</span>` : ''}</div>`;

const pill = (cls, text) => `<span class="btn ${cls}" aria-hidden="true">${text}</span>`;

const PAGES = [
  {
    title: 'THE GOAL',
    art: () => `<div class="rb-strip">${still(renderPlayers(view({ bid: { amount: 0, bidderId: 'c' } })))}</div>`,
    text: [
      'Bid on storage units packed with mystery items, then sell your luck to the scoreboard.',
      'Everyone starts with the same cash. When the last round ends, the richest player wins: cash plus the value of every item you own.',
    ],
  },
  {
    title: 'STORAGE UNITS',
    art: () => `<div class="rb-row rb-units">${['locker', 'medium', 'jumbo'].map((id) => renderUnitCard(UNITS[id])).join('')}</div>`,
    text: [
      'The game has an automatic Auctioneer. It puts one storage unit up for auction at a time, and every player gets to bid on every unit.',
      'The clipboard shows how many items are inside, whether the Auctioneer flips one crate for everybody, and when you may peek.',
    ],
  },
  {
    title: 'FLIP AND PEEK',
    art: () => `<div class="rb-row rb-crates">${crate(null)}${crate('Dinosaur Fossil', 'FLIPPED', true)}${crate('Garden Gnomes', 'PEEKED', true)}${crate(null)}</div>`,
    text: [
      'Every item starts face down in a crate. A flip turns one crate face up for everybody.',
      'A peek is private: you look at one crate and only you see it. Use what you saw to bid smart, or to bluff.',
    ],
  },
  {
    title: 'BUY IN',
    art: () => `<div class="rb-stack"><div class="abtns">${pill('go', 'Buy in $100')}${pill('', 'Pass')}</div>`
      + `<div class="rb-strip">${still(renderPlayers(view({ players: withBuyIns([null, 'in', 'pass', 'pending']) })))}</div></div>`,
    text: [
      'Everyone decides at the same time: pay the buy-in fee to bid, or pass and watch.',
      'The fee goes to the bank (the host picks the amount, $100 by default). Players who do not decide before the clock runs out are passed.',
    ],
  },
  {
    title: 'BID',
    art: () => `<div class="rb-stack">${still(renderBidPanel(view({ phase: 'bidding', bid: { amount: 1200, bidderId: 'c' }, call: 1 })))}`
      + `<div class="quick">${pill('', '+$100')}${pill('', '+$500')}${pill('', '+$1,000')}</div></div>`,
    text: [
      'Anyone who bought in can raise at any time, in steps of $100. The highest bid leads.',
      'You can only bid cash you actually hold, so you can never bid more than you have. The Auctioneer counts going once, going twice, SOLD on its own, and every new bid restarts the count.',
    ],
  },
  {
    title: 'SOLD AND OPEN',
    art: () => `<div class="rb-stack">${still(renderBidPanel(view({ phase: 'bidding', bid: { amount: 1300, bidderId: 'me' }, call: 3 })))}`
      + `<div class="rb-strip">${still(renderPlayers(view({ players: PLAYERS.map((p) => (p.id === 'me' ? { ...p, cash: 2900 } : p)), bid: { amount: 1300, bidderId: 'me' } })))}</div></div>`,
    text: [
      'When the Auctioneer says SOLD, the winner pays the price in cash straight to the bank. No change, no loans: you cannot win something you cannot pay for.',
      'Then the unit is opened and every item inside is yours, good or bad. Items cannot be spent, they only count toward your final score.',
    ],
  },
  {
    title: 'WHAT IS INSIDE',
    art: () => `<div class="rb-row rb-cards">${card('Barrels of Mystery Sludge')}${card('Dinosaur Fossil')}${card('Black Mold')}</div>`,
    text: [
      'Junk has a negative value and eats your score. Common items are worth little, valuable and unique items pay off big.',
      'Beware of Havoc: if a Havoc card is in the unit, the whole unit is void. You paid for nothing.',
    ],
  },
  {
    title: 'THE FINISH',
    art: () => `<div class="rb-strip">${still(renderPlayers(view({ bid: { amount: 0, bidderId: 'a' } })))}</div>`,
    text: [
      'The game lasts a set number of rounds, one storage unit each. Before it starts, the host picks the number of rounds, the starting cash and the buy-in fee.',
      'When the last unit is sold, all items are shown and the richest player wins.',
    ],
  },
];

export const PAGE_COUNT = PAGES.length;

/** One page of the rulebook as a full dialog. Out-of-range or non-numeric pages are clamped. */
export function renderRulebook(page = 0) {
  const n = Number.isFinite(page) ? Math.min(PAGE_COUNT - 1, Math.max(0, Math.trunc(page))) : 0;
  const p = PAGES[n];
  const last = n === PAGE_COUNT - 1;
  return `<div class="rb-back" data-rb="close"></div>`
    + `<div class="rb" role="dialog" aria-modal="true" aria-labelledby="rb-title">`
    + `<button class="rb-x btn small" data-rb="close" aria-label="Close the rulebook">X</button>`
    + `<p class="rb-count">${n + 1} / ${PAGE_COUNT}</p>`
    + `<h2 id="rb-title" class="rb-title display">${p.title}</h2>`
    + `<div class="rb-art">${p.art()}</div>`
    + `<div class="rb-words">${p.text.map((t) => `<p class="rb-line">${t}</p>`).join('')}</div>`
    + `<div class="rb-nav">${n > 0 ? '<button class="btn" data-rb="back">BACK</button>' : '<span></span>'}`
    + `${last ? '<button class="btn go" data-rb="close">GOT IT</button>' : '<button class="btn go" data-rb="next">NEXT</button>'}</div></div>`;
}

/** Opens the rulebook over whatever is on screen. Returns a function that closes it. */
export function openRules(doc = document) {
  const host = doc.createElement('div');
  host.className = 'rules';
  let page = 0;
  const paint = () => { host.innerHTML = renderRulebook(page); host.querySelector('[data-rb="next"], [data-rb="close"].go')?.focus(); };
  const close = () => { doc.removeEventListener('keydown', onKey); host.remove(); };
  const onKey = (e) => {
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowRight' && page < PAGE_COUNT - 1) { page++; paint(); }
    else if (e.key === 'ArrowLeft' && page > 0) { page--; paint(); }
  };
  host.addEventListener('click', (e) => {
    const act = e.target.closest('[data-rb]')?.dataset.rb;
    if (act === 'close') close();
    else if (act === 'next' && page < PAGE_COUNT - 1) { page++; paint(); }
    else if (act === 'back' && page > 0) { page--; paint(); }
  });
  doc.addEventListener('keydown', onKey);
  doc.body.appendChild(host);
  paint();
  return close;
}
