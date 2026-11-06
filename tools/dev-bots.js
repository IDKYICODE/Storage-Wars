// Dev/QA tool, not part of the game: joins a room as scripted guests so one person can exercise the whole UI.
// usage: node tools/dev-bots.js ROOMCODE [guests=2] [url=http://localhost:3000]
import { io } from 'socket.io-client';

const [code, count = '2', url = 'http://localhost:3000'] = process.argv.slice(2);
if (!code) { console.error('usage: node tools/dev-bots.js ROOMCODE [guests] [url]'); process.exit(1); }
const NAMES = ['Bea', 'Cal', 'Dee', 'Eli', 'Fay', 'Gus'];
const pause = (ms) => new Promise((r) => setTimeout(r, ms));

function play(socket) {
  const bids = {};
  socket.on('state', ({ view }) => {
    if (view.gameover) { console.log('game over, winners:', view.gameover.winnerIds); return; }
    const { can } = view;
    const act = (type, extra = {}) => socket.emit('game:act', { type, ...extra }, () => {});
    if (can.buyin && Math.random() < 0.8) act('buyin');
    else if (can.pass) act('pass');
    if (can.flip) setTimeout(() => act('flip', { index: view.slots.findIndex((s) => !s.faceUp) }), 1200);
    if (can.peek && Math.random() < 0.5) act('peek', { index: view.slots.findIndex((s) => !s.faceUp && !s.peeked) });
    if (can.ready) act('ready');
    if (can.bid && (bids[view.roundNo] ?? 0) < 4 && Math.random() < 0.6) {
      bids[view.roundNo] = (bids[view.roundNo] ?? 0) + 1;
      setTimeout(() => act('bid', { amount: (view.bid?.amount ?? 0) + 100 * (1 + Math.floor(Math.random() * 4)) }), 900 + Math.random() * 1500);
    }
    if (can.call) setTimeout(() => act('call'), 2500);
    if (can.pay && view.payment.suggested) setTimeout(() => act('pay', view.payment.suggested), 1500);
  });
}

for (let i = 0; i < Number(count); i++) {
  const socket = io(url, { transports: ['websocket'] });
  socket.on('connect', async () => {
    await pause(i * 150);
    socket.emit('room:join', { code, name: NAMES[i] }, (res) => console.log(NAMES[i], res.ok ? 'joined' : res.code));
  });
  play(socket);
}
