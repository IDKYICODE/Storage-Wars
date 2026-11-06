import { renderTable, renderActions, parseAmount } from '../ui/table-view.js';
import { feedbackFor } from '../ui/feedback.js';

export { renderTable };

const REVEAL_SOUND = { junk: 'revealJunk', common: 'revealCommon', valuable: 'revealValuable', unique: 'revealUnique', havoc: 'revealHavoc' };

export function mount(root, ctx) {
  const { net, sounds, fx, voice } = ctx;
  let view = net.last.state?.view;
  let prev = null;
  const ui = { pick: null };
  let busy = false;

  /** Crates scale so 3 (phone) or 5 (wide screens) fit in a row. */
  const applyScale = () => {
    const table = root.querySelector('.table');
    if (!table) return;
    const w = root.clientWidth || window.innerWidth;
    const perRow = w < 560 ? 3 : 5;
    const cz = Math.max(0.36, Math.min(0.9, (w - 32 - (perRow - 1) * 8) / (perRow * 232)));
    table.style.setProperty('--cz', cz.toFixed(3));
    table.style.setProperty('--uz', Math.min(0.75, cz * 1.15).toFixed(3));
  };

  const updateClock = () => {
    root.querySelectorAll('.clock').forEach((el) => {
      const left = Math.max(0, Math.ceil((Number(el.dataset.at) - net.now()) / 1000));
      el.textContent = `${left}s`;
      el.classList.toggle('low', left <= 5);
    });
  };

  /** Crates that just turned face-up for this player get the flip animation and a sound. */
  const animateFlips = (events) => {
    if (!prev || prev.roundNo !== view.roundNo) return;
    view.slots.forEach((slot, i) => {
      if (!slot.item || prev.slots[i]?.item) return;
      const cw = root.querySelector(`.crate[data-crate="${i}"] .cw`);
      if (!cw) return;
      cw.classList.remove('fl');
      cw.classList.add('lift');
      void cw.offsetWidth;
      setTimeout(() => {
        cw.classList.remove('lift');
        cw.classList.add('fl');
        const tier = slot.item.tier;
        const mine = events.some((e) => e.type === 'peeked' && e.index === i);
        sounds.play(mine ? 'flip' : REVEAL_SOUND[tier]);
        if (!mine) fx.playReveal(cw, tier, root.querySelector('.table'));
      }, 260 + i * 380); // crates open one after another
    });
  };

  let toastTimer = null;
  const toast = (msg) => {
    const el = root.querySelector('.toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 4000);
  };

  const nameOf = (id) => view.players.find((p) => p.id === id)?.name ?? 'Someone';

  /** A big sticker that slams onto the screen for a moment (SOLD, FINED, VOID, ELIMINATED). */
  const banner = (text, kind) => {
    const el = document.createElement('div');
    el.className = `banner ${kind}`;
    el.textContent = text;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2300);
  };

  const playEvents = (events) => {
    for (const f of feedbackFor(events, { you: view.you, nameOf })) {
      if (f.sound) sounds.play(f.sound);
      if (f.speak) voice?.say(f.speak);
      if (f.banner) banner(f.banner.text, f.banner.kind);
      if (f.toast) toast(f.toast);
      if (f.shake) fx.shake(root.querySelector('.table'));
      if (f.flash) fx.flash(f.flash);
      if (f.slam) root.querySelector('.bidpanel')?.classList.add('slam');
    }
  };

  const paint = (events = []) => {
    if (!view) return;
    if (ui.pick && !view.can.peek) ui.pick = null;
    root.innerHTML = renderTable(view, ui);
    busy = false;
    applyScale();
    updateClock();
    animateFlips(events);
    playEvents(events);
  };

  const off = net.on('state', (m) => { prev = view; view = m.view; paint(m.events); });
  const tickClock = setInterval(updateClock, 250);
  const onResize = () => applyScale();
  window.addEventListener('resize', onResize);

  const send = async (type, payload) => {
    if (busy) return;
    busy = true;
    const res = await net.act(type, payload);
    if (!res?.ok) busy = false;
  };

  const onClick = (e) => {
    const pick = e.target.closest('[data-pick]')?.dataset.pick;
    if (pick) { ui.pick = ui.pick === pick ? null : pick; paint(); return; }
    const crate = e.target.closest('.crate.tap');
    if (crate && ui.pick) {
      const index = Number(crate.dataset.crate);
      const type = ui.pick;
      ui.pick = null;
      send(type, { index });
      return;
    }
    const btn = e.target.closest('[data-act]');
    const act = btn?.dataset.act;
    if (act === 'buyin' || act === 'pass' || act === 'ready') send(act);
    else if (act === 'bid') send('bid', { amount: Number(btn.dataset.amount) });
    else if (act === 'bidcustom') bidCustom();
  };

  const bidCustom = () => {
    const amount = parseAmount(ui.custom);
    if (amount === null) return;
    ui.custom = '';
    send('bid', { amount });
  };

  /** Re-renders only the action bar (so typing never loses focus) and puts the caret back in `focusId`. */
  const refreshActions = (focusId) => {
    root.querySelector('.actions').outerHTML = renderActions(view, ui);
    const input = focusId && root.querySelector(`#${focusId}`);
    if (input) {
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    }
  };

  const onInput = (e) => {
    if (e.target.id === 'custom') {
      ui.custom = e.target.value;
      refreshActions('custom');
    }
  };
  const onKey = (e) => { if (e.key === 'Enter' && e.target.id === 'custom') bidCustom(); };
  root.addEventListener('click', onClick);
  root.addEventListener('input', onInput);
  root.addEventListener('keydown', onKey);
  paint();

  return () => {
    off();
    clearInterval(tickClock);
    window.removeEventListener('resize', onResize);
    root.removeEventListener('click', onClick);
    root.removeEventListener('input', onInput);
    root.removeEventListener('keydown', onKey);
    clearTimeout(toastTimer);
  };
}
