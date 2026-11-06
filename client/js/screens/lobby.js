import { esc, formatMoney } from '../art/kit.js';

const CROWN = '<svg class="crown" viewBox="0 0 24 24" aria-label="host"><path d="M3 18l-1-11 6 5 4-8 4 8 6-5-1 11z" fill="#ffd23f" stroke="#1d1a2b" stroke-width="2" stroke-linejoin="round"/></svg>';

const STEPS = { rounds: [1, 99, 1], startCash: [1000, 20000, 1000], buyIn: [100, 1000, 100] };
const QUICK_ROUNDS = [4, 8, 12, 16, 20];

/** The game-rules panel: number of rounds (quick picks plus a stepper), starting cash and buy-in fee. Read-only for non-hosts. */
function renderSettings(lobby, isHost) {
  const { rounds } = lobby.settings;
  const quick = QUICK_ROUNDS.map((t) => (isHost
    ? `<button class="seg${rounds === t ? ' on' : ''}" data-act="set" data-key="rounds" data-value="${t}" aria-pressed="${rounds === t}">${t}</button>`
    : `<span class="seg${rounds === t ? ' on' : ''}">${t}</span>`)).join('');
  const stepper = (key, label, show) => {
    const [min, max, step] = STEPS[key];
    const value = lobby.settings[key];
    const btn = (to, sign, off) => `<button class="step" data-act="set" data-key="${key}" data-value="${to}" aria-label="${sign === '-' ? 'Less' : 'More'} ${label}"${off ? ' disabled' : ''}>${sign}</button>`;
    return `<div class="setrow"><span class="setlabel">${label}</span>`
      + (isHost ? btn(value - step, '-', value <= min) : '')
      + `<b class="setval">${show(value)}</b>`
      + (isHost ? btn(value + step, '+', value >= max) : '')
      + '</div>';
  };
  return `<div class="section"><h2 class="display">GAME RULES</h2>`
    + `${isHost ? `<div class="segs quick">${quick}</div>` : ''}`
    + `${stepper('rounds', 'Rounds', String)}`
    + `<p class="modetext">${rounds} ${rounds === 1 ? 'storage unit goes' : 'storage units go'} up for auction, one at a time. Everyone bids on every unit.</p>`
    + `${stepper('startCash', 'Starting cash', formatMoney)}${stepper('buyIn', 'Buy-in fee', formatMoney)}</div>`;
}

/** Pure markup for the room lobby. `lobby` is the server's lobby message ({code, hostId, settings, players, you}). */
export function renderLobby(lobby) {
  const isHost = lobby.you === lobby.hostId;
  const n = lobby.players.length;
  const canStart = n >= 3 && n <= 7;

  const rows = lobby.players.map((p) => `<li class="prow">`
    + `<i class="dot ${p.connected ? 'on' : 'off'}" title="${p.connected ? 'online' : 'offline'}"></i>`
    + `<span class="pname">${esc(p.name)}</span>`
    + `${p.id === lobby.you ? '<span class="you">you</span>' : ''}`
    + `${p.id === lobby.hostId ? CROWN : ''}`
    + `${isHost && p.id !== lobby.you ? `<button class="btn small bad" data-act="kick" data-kick="${esc(p.id)}">KICK</button>` : ''}`
    + '</li>').join('');

  const startArea = isHost
    ? `<button class="btn go big" data-act="start"${canStart ? '' : ' disabled'}>START GAME</button>${canStart ? '' : '<p class="hint">You need 3 to 7 players to start.</p>'}`
    : '<p class="hint wait">Waiting for the host to start…</p>';

  return `<div class="lobby"><div class="hang"><div class="roomsign"><h1 class="roomcode display" aria-label="Room code">${esc(lobby.code)}</h1></div></div>`
    + `<div class="lobby-card"><div class="clip"><i></i></div><div class="paper">`
    + `<button class="btn small" data-act="copy">COPY INVITE LINK</button>`
    + `<div class="section"><h2 class="display">PLAYERS <span class="count">${n} / 7</span></h2><ul class="plist">${rows}</ul></div>`
    + `${renderSettings(lobby, isHost)}`
    + `${startArea}<p class="toast-line" role="status"></p>`
    + `<button class="link" data-act="leave">Leave room</button></div></div></div>`;
}

const TOASTS = {
  'bad-count': 'You need 3 to 7 players to start.',
  'not-host': 'Only the host can do that.',
  started: 'The game already started.',
  'bad-setting': 'That setting is out of range.',
};

export function mount(root, ctx) {
  const { net } = ctx;
  let lobby = net.last.lobby;
  const paint = () => { if (lobby) root.innerHTML = renderLobby(lobby); };
  const toast = (msg) => {
    const el = root.querySelector('.toast-line');
    if (el) el.textContent = msg;
  };

  const off = net.on('lobby', (l) => { lobby = l; paint(); });

  const onClick = async (e) => {
    const btn = e.target.closest('[data-act]');
    if (!btn) return;
    const act = btn.dataset.act;
    if (act === 'copy') {
      const link = `${window.location.origin}/?room=${lobby.code}`;
      try { await navigator.clipboard.writeText(link); toast('Invite link copied. Send it to your friends.'); }
      catch { toast(link); }
    } else if (act === 'set') {
      const res = await net.setSettings({ [btn.dataset.key]: Number(btn.dataset.value) });
      if (!res?.ok) toast(TOASTS[res?.code] ?? 'Could not change that setting.');
    } else if (act === 'kick') {
      await net.kick(btn.dataset.kick);
    } else if (act === 'start') {
      const res = await net.start();
      if (!res?.ok) toast(TOASTS[res?.code] ?? 'Could not start. Try again.');
    } else if (act === 'leave') {
      await net.leave();
      ctx.route();
    }
  };

  root.addEventListener('click', onClick);
  paint();
  return () => { off(); root.removeEventListener('click', onClick); };
}
