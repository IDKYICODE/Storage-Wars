// The winner's payment picker (cash plus items, no change given) and what everyone else sees meanwhile.
import { esc, formatMoney } from '../art/kit.js';

/** What the player would hand over: cash plus the chosen items. Unknown ids and junk count for nothing. */
export function paymentTotal(view, sel) {
  const cash = Number.isInteger(sel.cash) && sel.cash > 0 ? sel.cash : 0;
  const items = view.myItems.filter((it) => it.value > 0 && sel.ids.includes(it.id));
  return cash + items.reduce((n, it) => n + it.value, 0);
}

/** The server's least-overpaying suggestion, or nothing selected when the player cannot afford the price. */
export function defaultSelection(view) {
  const s = view.payment?.suggested;
  return s ? { cash: s.cash, ids: [...s.itemIds] } : { cash: 0, ids: [] };
}

/** `ui.pay` is the local selection { cash, ids }; absent means "use the suggestion". */
export function renderPayment(view, ui = {}) {
  if (view.phase !== 'payment' || !view.winner) return '';
  const winner = view.players.find((p) => p.id === view.winner.playerId);
  if (!view.can.pay) return `<p class="hint">${esc(winner.name)} is paying ${formatMoney(view.winner.price)}…</p>`;

  const price = view.payment.price;
  const sel = ui.pay ?? defaultSelection(view);
  const total = paymentTotal(view, sel);
  const ok = total >= price;
  const me = view.players.find((p) => p.id === view.you);
  const chips = view.myItems.filter((it) => it.value > 0).map((it) => {
    const on = sel.ids.includes(it.id);
    return `<li><button class="pchip ${it.tier}${on ? ' on' : ''}" data-item="${esc(it.id)}" aria-pressed="${on}"><span>${esc(it.name)}</span><b>${formatMoney(it.value)}</b></button></li>`;
  }).join('');
  const status = ok ? (total > price ? `${formatMoney(total - price)} lost` : 'Exact change') : `${formatMoney(price - total)} short`;
  const cannot = view.payment.suggested === null
    ? '<p class="risk">You cannot cover this. You will be fined $1,000 and the auction restarts without you.</p>' : '';
  return `<div class="paypanel"><h3 class="display">PAY ${formatMoney(price)}</h3>`
    + `<p class="hint">No change is given. Anything above the price is lost.</p>`
    + `<label class="paycash"><span>Cash (you have ${formatMoney(me.cash)})</span><input id="paycash" type="number" inputmode="numeric" min="0" max="${me.cash}" step="100" value="${sel.cash}"></label>`
    + `${chips ? `<ul class="pchips">${chips}</ul>` : ''}`
    + `<p class="total ${ok ? 'ok' : 'short'}" data-total="${total}">Paying <b>${formatMoney(total)}</b> <span>${status}</span></p>${cannot}`
    + `<button class="btn go big" data-act="pay"${ok ? '' : ' disabled'}>PAY</button></div>`;
}
