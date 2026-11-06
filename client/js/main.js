import { createNet } from './net.js';
import { createSounds } from './ui/sounds.js';
import { createVoice } from './ui/voice.js';
import * as fx from './ui/fx.js';
import { renderHallScene } from './art/scenes.js';
// importing the art modules registers every illustration with the card renderer
import './art/junk.js';
import './art/common.js';
import './art/top.js';
import './art/units.js';
import * as entry from './screens/entry.js';
import * as lobby from './screens/lobby.js';
import * as table from './screens/table.js';
import * as end from './screens/end.js';

const root = document.getElementById('app');
const overlay = document.getElementById('overlay');
// The saved seat lives in sessionStorage so every browser tab is its own player. localStorage is shared by all
// tabs, which silently turned extra tabs into the same player (shared bids, shared private peeks).
const net = createNet(window.io(), window.sessionStorage);
const sounds = createSounds(window.AudioContext || window.webkitAudioContext, window.localStorage);
const voice = createVoice({ synth: window.speechSynthesis, Utterance: window.SpeechSynthesisUtterance, Audio: window.Audio, isMuted: () => sounds.isMuted() });
const ctx = { net, sounds, fx, voice, notice: null, route };

// Sound toggle (always visible) and a click sound on every button.
const SPEAKER = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9z"/>';
const mute = document.createElement('button');
mute.className = 'btn small mute';
const paintMute = () => {
  mute.innerHTML = sounds.isMuted()
    ? `${SPEAKER}<path d="M17 9l5 6M22 9l-5 6"/></svg>SOUND OFF`
    : `${SPEAKER}<path d="M16 9a4 4 0 010 6M18.5 6.5a8 8 0 010 11"/></svg>SOUND ON`;
  mute.setAttribute('aria-pressed', String(!sounds.isMuted()));
};
mute.addEventListener('click', () => { sounds.setMuted(!sounds.isMuted()); paintMute(); });
paintMute();
document.body.appendChild(mute);
document.addEventListener('click', (e) => { if (e.target.closest('button') && e.target !== mute) sounds.play('click'); });
const screens = { entry, lobby, table, end };

let name = null;
let unmount = null;

// The auction-hall backdrop lives outside #app so re-rendering a screen never redraws it. The entry screen
// brings its own night-lot scene.
const bg = document.createElement('div');
bg.id = 'bg';
root.before(bg);

function show(next) {
  if (next === name) return;
  unmount?.();
  root.replaceChildren();
  bg.innerHTML = next === 'entry' ? '' : renderHallScene();
  name = next;
  unmount = screens[next].mount(root, ctx);
}

/** Picks the screen from whatever the server last told us. */
function route() {
  const { lobby: l, state } = net.last;
  if (l) show('lobby');
  else if (state) show(state.view.gameover ? 'end' : 'table');
  else show('entry');
}

net.on('lobby', route);
net.on('state', route);
net.on('closed', ({ reason }) => {
  ctx.notice = reason === 'gone' ? 'That room is gone (the server may have restarted).'
    : reason === 'kicked' ? 'You were removed from the room.'
      : reason === 'other-tab' ? 'This seat was opened in another tab. Use that tab, or join again with the room code and your name.' : null;
  route();
});
// a thin bar for short drops, the full overlay once the server looks asleep (free hosting sleeps when idle)
const recon = document.createElement('div');
recon.className = 'recon';
recon.hidden = true;
recon.setAttribute('role', 'status');
recon.textContent = 'Reconnecting… your seat is saved';
document.body.appendChild(recon);
net.on('status', (s) => {
  overlay.hidden = s !== 'waking';
  recon.hidden = s !== 'offline';
});

route();
