import { ROOM_CODE_ALPHABET } from '../../../shared/cards.js';
import { esc } from '../art/kit.js';
import { renderStorageFront } from '../art/scenes.js';

const NAME_KEY = 'storage-wars-name';

const MESSAGES = {
  'no-room': 'No room with that code. Check the letters and try again.',
  full: 'That room is full (7 players max).',
  started: 'That game has already started. To get back into your own seat, join with the exact name you used before.',
  'bad-name': 'Pick a name of 1 to 16 characters that nobody in the room has taken.',
  rate: 'Slow down a little, then try again.',
  invalid: 'Something looked wrong with that. Try again.',
  server: 'The server hit a snag. Try again in a moment.',
};
export const errorText = (code) => MESSAGES[code] ?? 'Could not do that right now. Try again.';

export const validName = (name) => {
  const n = String(name ?? '').trim().replace(/\s+/g, ' ');
  const len = [...n].length;
  return len >= 1 && len <= 16;
};

/** Uppercases and keeps only letters that can appear in a room code, at most 4. */
export const cleanCode = (raw) => [...String(raw ?? '').toUpperCase()].filter((c) => ROOM_CODE_ALPHABET.includes(c)).slice(0, 4).join('');

function codeBoxes(code) {
  return Array.from({ length: 4 }, (_, i) => (i === code.length ? '<b class="cur"></b>' : `<b>${esc(code[i] ?? '')}</b>`)).join('');
}

/**
 * Pure markup for both steps. Title: the storage unit with its door shut; the door carries the title and ENTER.
 * Code: the same unit with the door rolled up and the registration clipboard in front of the doorway.
 */
export function renderEntry({ step = 'title', error = '', name = '', code = '' } = {}) {
  const notice = error ? `<p class="notice" role="alert">${esc(error)}</p>` : '';
  if (step === 'title') {
    return `<div class="entry title">${renderStorageFront()}${notice}</div>`;
  }
  const nameOk = validName(name);
  const joinOk = nameOk && code.length === 4;
  return `<div class="entry code-step">${renderStorageFront({ open: true })}`
    + `<div class="board"><div class="clip"><i></i></div><div class="paper">`
    + `<h2 class="display">BIDDER REGISTRATION</h2>`
    + `<label class="field-wrap"><span>NAME</span><input id="name" class="field" maxlength="16" placeholder="Your name" autocomplete="nickname" value="${esc(name)}"></label>`
    + `<div class="field-wrap"><span>ROOM CODE</span><div class="code" data-act="focus-code">${codeBoxes(code)}`
    + `<input id="code" aria-label="Room code" maxlength="8" autocapitalize="characters" autocomplete="off" spellcheck="false" value="${esc(code)}"></div></div>`
    + `<button class="btn go" data-act="join"${joinOk ? '' : ' disabled'}>JOIN GAME</button>`
    + `<span class="or">no code? start your own</span>`
    + `<button class="btn warn" data-act="create"${nameOk ? '' : ' disabled'}>CREATE A ROOM</button>`
    + `<p class="notice dark" role="alert">${esc(error)}</p>`
    + `<button class="link" data-act="back">Back</button></div></div></div>`;
}

const load = () => { try { return window.localStorage.getItem(NAME_KEY) ?? ''; } catch { return ''; } };
const save = (n) => { try { window.localStorage.setItem(NAME_KEY, n); } catch { /* ignore */ } };

export function mount(root, ctx) {
  const fromLink = cleanCode(new URLSearchParams(window.location.search).get('room'));
  const state = { step: fromLink ? 'code' : 'title', error: ctx.notice ?? '', name: load(), code: fromLink };
  ctx.notice = null;
  let busy = false;
  let rolling = null;

  const paint = () => {
    root.innerHTML = renderEntry(state);
    if (state.step === 'code') root.querySelector(state.name ? '#code' : '#name')?.focus();
  };

  /** Updates boxes, buttons and the error line in place so typing never loses focus. */
  const sync = () => {
    const codeEl = root.querySelector('.code');
    codeEl.querySelectorAll('b').forEach((b) => b.remove());
    codeEl.insertAdjacentHTML('afterbegin', codeBoxes(state.code));
    const nameOk = validName(state.name);
    root.querySelector('[data-act="join"]').disabled = busy || !(nameOk && state.code.length === 4);
    root.querySelector('[data-act="create"]').disabled = busy || !nameOk;
    root.querySelector('.notice.dark').textContent = state.error;
  };

  const go = async (call) => {
    busy = true;
    state.error = '';
    sync();
    const res = await call();
    busy = false;
    if (res?.ok) { save(state.name.trim()); return; } // the server's lobby message switches the screen
    state.error = errorText(res?.code);
    sync();
  };

  /** ENTER: the door rolls up, then the registration clipboard takes over. */
  const enter = () => {
    const door = root.querySelector('.door-g');
    if (!door || rolling) return;
    door.classList.add('rolling');
    rolling = setTimeout(() => { rolling = null; state.step = 'code'; state.error = ''; paint(); }, 800);
  };

  const onClick = (e) => {
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (act === 'enter') enter();
    else if (act === 'back') { state.step = 'title'; state.error = ''; paint(); }
    else if (act === 'focus-code') root.querySelector('#code')?.focus();
    else if (act === 'join' && !busy) go(() => ctx.net.join(state.code, state.name));
    else if (act === 'create' && !busy) go(() => ctx.net.create(state.name));
  };
  const onInput = (e) => {
    if (e.target.id === 'name') state.name = e.target.value;
    else if (e.target.id === 'code') { state.code = cleanCode(e.target.value); e.target.value = state.code; }
    else return;
    sync();
  };
  const onKey = (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.closest?.('[data-act="enter"]')) { e.preventDefault(); enter(); return; }
    if (e.key !== 'Enter' || state.step !== 'code' || busy) return;
    if (validName(state.name) && state.code.length === 4) go(() => ctx.net.join(state.code, state.name));
    else if (validName(state.name) && !state.code) go(() => ctx.net.create(state.name));
  };

  // The entry screen can already be showing when a reload finds the saved room gone; main.js sets ctx.notice
  // first, then this listener repaints so the player is told why they are back here.
  const offClosed = ctx.net.on('closed', () => {
    if (!ctx.notice) return;
    state.error = ctx.notice;
    ctx.notice = null;
    state.step = 'title';
    paint();
  });

  root.addEventListener('click', onClick);
  root.addEventListener('input', onInput);
  root.addEventListener('keydown', onKey);
  paint();
  return () => {
    offClosed();
    clearTimeout(rolling);
    root.removeEventListener('click', onClick);
    root.removeEventListener('input', onInput);
    root.removeEventListener('keydown', onKey);
  };
}
