import { esc, formatMoney } from '../art/kit.js';
import { renderItemCard } from '../ui/card.js';

/** Pure markup for the game-over screen: winner sign, ranked scoreboard, everyone's revealed items. */
export function renderEnd(view) {
  const { scores, winnerIds, allItems } = view.gameover;
  const nameOf = (id) => view.players.find((p) => p.id === id)?.name ?? '?';
  const many = winnerIds.length > 1;
  const sign = `<div class="hang"><div class="roomsign winsign"><p class="winlabel">${many ? 'WINNERS' : 'WINNER'}</p>`
    + `<h1 class="winname display">${winnerIds.map((id) => esc(nameOf(id))).join(' & ')}</h1></div></div>`;

  const rows = scores.map((s, i) => {
    const won = winnerIds.includes(s.id);
    const items = allItems[s.id] ?? [];
    const cards = items.length
      ? `<div class="mini">${items.map((it) => `<div class="minicard">${renderItemCard(it)}</div>`).join('')}</div>`
      : '<p class="none">No items.</p>';
    return `<li class="row${won ? ' winner' : ''}"${s.id === view.you ? ' data-me' : ''}>`
      + `<div class="rowhead"><span class="rank">${i + 1}</span><span class="rname">${esc(s.name)}</span><span class="rtotal">${formatMoney(s.total)}</span></div>`
      + `<div class="rsplit"><span>Cash <b>${formatMoney(s.cash)}</b></span><span>Items <b>${formatMoney(s.itemValue)}</b></span></div>${cards}</li>`;
  }).join('');

  return `<div class="end">${sign}<div class="lobby-card"><div class="clip"><i></i></div><div class="paper">`
    + `<ol class="board-list">${rows}</ol>`
    + `<button class="btn go big" data-act="leave">BACK TO ENTRY</button></div></div></div>`;
}

export function mount(root, ctx) {
  const { net, sounds, fx } = ctx;
  const view = net.last.state?.view;
  if (!view?.gameover) return () => {};
  root.innerHTML = renderEnd(view);
  sounds.play('victory');
  const sign = root.querySelector('.roomsign');
  if (sign) {
    fx.playReveal(sign, 'unique', document.body);
    setTimeout(() => fx.playReveal(sign, 'unique', document.body), 900);
  }
  const onClick = async (e) => {
    if (e.target.closest('[data-act="leave"]')) {
      await net.leave();
      ctx.route();
    }
  };
  root.addEventListener('click', onClick);
  return () => root.removeEventListener('click', onClick);
}
