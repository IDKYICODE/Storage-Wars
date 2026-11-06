import { esc } from '../art/kit.js';

const CROWN = '<svg class="crown" viewBox="0 0 24 24" aria-label="host"><path d="M3 18l-1-11 6 5 4-8 4 8 6-5-1 11z" fill="#ffd23f" stroke="#1d1a2b" stroke-width="2" stroke-linejoin="round"/></svg>';

const MODES = {
  manual: { label: 'MANUAL', text: 'A real player runs each auction: picks the flip, then calls going once, going twice, SOLD.' },
  auto: { label: 'AUTO', text: "The computer runs each auction for whoever's turn it is. They still collect the money." },
};

/** Pure markup for the room lobby. `lobby` is the server's lobby message ({code, hostId, mode, players, you}). */
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

  const seg = (m) => `<button class="seg${lobby.mode === m ? ' on' : ''}" ${isHost ? `data-act="mode" data-mode="${m}"` : 'disabled'} aria-pressed="${lobby.mode === m}">${MODES[m].label}</button>`;
  const startArea = isHost
    ? `<button class="btn go big" data-act="start"${canStart ? '' : ' disabled'}>START GAME</button>${canStart ? '' : '<p class="hint">You need 3 to 7 players to start.</p>'}`
    : '<p class="hint wait">Waiting for the host to start…</p>';

  return `<div class="lobby"><div class="hang"><div class="roomsign"><h1 class="roomcode display" aria-label="Room code">${esc(lobby.code)}</h1></div></div>`
    + `<div class="lobby-card"><div class="clip"><i></i></div><div class="paper">`
    + `<button class="btn small" data-act="copy">COPY INVITE LINK</button>`
    + `<div class="section"><h2 class="display">PLAYERS <span class="count">${n} / 7</span></h2><ul class="plist">${rows}</ul></div>`
    + `<div class="section"><h2 class="display">AUCTIONEER</h2><div class="segs">${seg('manual')}${seg('auto')}</div>`
    + `<p class="modetext">${esc(MODES[lobby.mode].text)}</p></div>`
    + `${startArea}<p class="toast-line" role="status"></p>`
    + `<button class="link" data-act="leave">Leave room</button></div></div></div>`;
}

const TOASTS = {
  'bad-count': 'You need 3 to 7 players to start.',
  'not-host': 'Only the host can do that.',
  started: 'The game already started.',
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
    } else if (act === 'mode') {
      await net.setMode(btn.dataset.mode);
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
