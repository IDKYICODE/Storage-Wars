// Pure functions that turn card data into HTML strings. No DOM access, so they run in Node tests.
import { ITEMS } from '../../../shared/cards.js';
import { INK, esc, formatMoney } from '../art/kit.js';
import { getIcon } from '../art/icons.js';

const ART = new Map();

/** Illustration modules register their drawings here: { itemId: () => innerSvgMarkup } (viewBox 0 0 300 180). */
export function registerArt(map) {
  for (const [id, fn] of Object.entries(map)) ART.set(id, fn);
}

const PLACEHOLDER = '<rect x="40" y="30" width="220" height="120" rx="12" fill="rgba(255,255,255,.35)" stroke="#1d1a2b" stroke-width="3" stroke-dasharray="10 8"/>';

export function getArt(id) {
  const fn = ART.get(id);
  return fn ? fn() : PLACEHOLDER;
}

const TIER = {
  junk: { c: '#d8403f', t: '#d8403f', label: 'JUNK ITEM', pips: 1 },
  common: { c: '#19b8b8', t: '#0d9393', label: 'COMMON ITEM', pips: 2 },
  valuable: { c: '#ff6a3d', t: '#e0522a', label: 'VALUABLE ITEM', pips: 4 },
  unique: { c: '#e6b93a', t: '#a98300', label: 'UNIQUE ITEM', pips: 5 },
  havoc: { c: '#3f4452', t: '#3f4452', label: 'HAVOC EVENT', pips: 5 },
};
const GREEN = '#1faa55';
const RED = '#d8403f';

function priceTag(value) {
  const color = value < 0 ? RED : GREEN;
  return `<svg class="tag" viewBox="0 0 108 46"><path d="M12 6H84L102 23L84 40H12Q5 40 5 33V13Q5 6 12 6Z" fill="${color}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`
    + `<circle cx="88" cy="23" r="3.2" fill="#fff6e0" stroke="${INK}" stroke-width="2"/><path d="M90 23q10-8 14 2" stroke="#d8b36a" stroke-width="2.5" fill="none" stroke-linecap="round"/>`
    + `<text x="45" y="32" text-anchor="middle" font-size="26" fill="#fff" font-family="Bebas Neue,Impact,sans-serif" letter-spacing="1">${esc(formatMoney(value))}</text></svg>`;
}

const HAVOC_BANNER = '<svg class="tag hv" viewBox="0 0 150 46"><polygon points="14,4 136,4 148,23 136,42 14,42 2,23" fill="#14131c" stroke="#fff" stroke-width="2"/>'
  + '<text x="75" y="33" text-anchor="middle" font-size="28" fill="#fff" font-family="Bebas Neue,Impact,sans-serif" letter-spacing="3">HAVOC</text></svg>';

/** Longer names get a smaller title so every name stays on one line above the rarity label. */
function titleSize(name) {
  const n = name.length;
  if (n <= 13) return 27;
  if (n <= 16) return 22;
  if (n <= 19) return 18.5;
  return 15;
}

/** The face of an item card (230x330 design size). */
export function renderItemCard(item) {
  const T = TIER[item.tier];
  const idx = ITEMS.findIndex((i) => i.id === (item.base ?? item.id));
  const num = String(idx + 1).padStart(2, '0');
  const pips = '◆'.repeat(T.pips) + '◇'.repeat(5 - T.pips);
  const tag = item.tier === 'havoc' ? HAVOC_BANNER : priceTag(item.value);
  return `<div class="card ${item.tier}" style="--c:${T.c};--t:${T.t}">`
    + `<div class="hd"><div class="tt"><h5 style="font-size:${titleSize(item.name)}px">${esc(item.name.toUpperCase())}</h5><span>${T.label}</span></div><div class="med">${getIcon(item.tier)}</div></div>`
    + `<div class="win"><svg viewBox="0 0 300 180" preserveAspectRatio="xMidYMid slice">${getArt(item.base ?? item.id)}</svg>${tag}</div>`
    + `<p class="fv">${esc(item.flavor)}</p>`
    + `<div class="ft"><span>${num}/56</span><span class="pp">${pips}</span><span>BIDDER BATTLE</span></div></div>`;
}

const BACK_SVG = '<svg viewBox="0 0 230 330" preserveAspectRatio="none"><rect width="230" height="330" fill="#c9954f"/><rect x="0" y="0" width="230" height="165" fill="#d3a15c"/>'
  + '<path d="M0 165H230" stroke="#8a5a26" stroke-width="3"/>'
  + '<rect x="88" y="0" width="54" height="330" fill="#ecdba8" stroke="#8a5a26" stroke-width="2"/>'
  + Array.from({ length: 23 }, (_, i) => `<path d="M88 ${10 + i * 14}H142" stroke="#d5c288" stroke-width="2"/>`).join('')
  + '<g transform="rotate(-7 115 165)"><rect x="36" y="128" width="158" height="74" rx="6" fill="#fffaf0" stroke="#1d1a2b" stroke-width="4"/>'
  + '<text x="115" y="164" text-anchor="middle" font-size="30" font-family="Bebas Neue,Impact,sans-serif" fill="#1d1a2b" letter-spacing="2">BIDDER BATTLE</text>'
  + '<text x="115" y="190" text-anchor="middle" font-size="15" font-family="Bebas Neue,Impact,sans-serif" fill="#d8403f" letter-spacing="6">MYSTERY ITEM</text></g>'
  + '<text x="20" y="40" font-size="12" font-family="Bebas Neue,Impact,sans-serif" fill="#5a3716" letter-spacing="2">THIS SIDE UP</text>'
  + '<text x="210" y="312" text-anchor="end" font-size="12" font-family="Bebas Neue,Impact,sans-serif" fill="#5a3716" letter-spacing="2">HANDLE WITH CARE</text></svg>';

const PEEK_LABEL = { never: 'Never', after: 'After Buy-In', before: 'Before Buy-In' };

/** The navy clipboard card for a storage unit: photo, name, and the Items / Flip / Peek rules. */
export function renderUnitCard(unit) {
  return `<div class="unitc"><div class="clip"><i></i></div>`
    + `<div class="polaroid"><svg viewBox="0 0 300 190" preserveAspectRatio="xMidYMid slice">${getArt(`unit-${unit.id}`)}</svg></div>`
    + `<div class="plate">${esc(unit.name.toUpperCase())}</div><div class="sub">STORAGE UNIT</div>`
    + `<div class="st"><b>ITEMS</b><em>${unit.items}</em></div>`
    + `<div class="st"><b>FLIP</b><em>${unit.flip ? 'Yes' : 'No'}</em></div>`
    + `<div class="st"><b>PEEK</b><em>${PEEK_LABEL[unit.peek]}</em></div></div>`;
}

/** The taped kraft-paper crate shown for every face-down item. */
export const renderCardBack = () => `<div class="back">${BACK_SVG}</div>`;

/**
 * A card that can turn over. item null means "unknown to this viewer": the back only, never flippable.
 * `flipped` shows the face (adds class fl; toggling that class animates the 3D turn).
 */
export function renderFlipCard(item, flipped = false) {
  const face = item ? renderItemCard(item) : '';
  return `<div class="cw${item && flipped ? ' fl' : ''}"><div class="in">${renderCardBack()}${face}</div></div>`;
}
