import test, { mock } from 'node:test';
import assert from 'node:assert/strict';
import { createNet } from '../client/js/net.js';

/** A fake socket: records emits, lets the test fire server events and answer acks. */
function fakeSocket() {
  const handlers = {};
  const sent = [];
  const acks = {}; // event -> reply to give
  return {
    connected: false,
    sent,
    acks,
    on(ev, fn) { (handlers[ev] ??= []).push(fn); },
    emit(ev, payload, cb) {
      sent.push([ev, payload]);
      if (cb && acks[ev]) cb(acks[ev]);
    },
    fire(ev, ...args) { (handlers[ev] ?? []).forEach((fn) => fn(...args)); },
  };
}
const memory = () => {
  const m = new Map();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
};

test('create stores the token and code; a reconnect rejoins with that token', async () => {
  const sock = fakeSocket();
  const storage = memory();
  const net = createNet(sock, storage);
  sock.acks['room:create'] = { ok: true, token: 'tok123', code: 'ABCD' };
  const res = await net.create('Ayush');
  assert.equal(res.ok, true);
  assert.deepEqual(JSON.parse(storage.getItem('storage-wars-session')), { token: 'tok123', code: 'ABCD' });

  sock.sent.length = 0;
  sock.acks['room:rejoin'] = { ok: true, code: 'ABCD' };
  sock.fire('connect');
  assert.deepEqual(sock.sent, [['room:rejoin', { token: 'tok123' }]]);
});

test('with no saved token nothing is sent on connect', () => {
  const sock = fakeSocket();
  createNet(sock, memory());
  sock.fire('connect');
  assert.deepEqual(sock.sent, []);
});

test('an unknown-room answer clears the session and tells the app the room is gone', async () => {
  const sock = fakeSocket();
  const storage = memory();
  storage.setItem('storage-wars-session', JSON.stringify({ token: 'old', code: 'ZZZZ' }));
  const net = createNet(sock, storage);
  const closed = [];
  net.on('closed', (m) => closed.push(m));
  sock.acks['room:rejoin'] = { ok: false, code: 'no-room' };
  sock.fire('connect');
  await new Promise((r) => setImmediate(r)); // the rejoin answer arrives asynchronously
  assert.equal(storage.getItem('storage-wars-session'), null);
  assert.deepEqual(closed, [{ reason: 'gone' }]);
});

test('lobby and state messages are remembered so a screen mounted later can read them', () => {
  const sock = fakeSocket();
  const net = createNet(sock, memory());
  sock.fire('lobby', { code: 'ABCD' });
  assert.deepEqual(net.last.lobby, { code: 'ABCD' });
  sock.fire('state', { view: { phase: 'buyin' }, events: [], serverNow: 5000 });
  assert.equal(net.last.state.view.phase, 'buyin');
  assert.equal(typeof net.now(), 'number');
});

test('being kicked or leaving clears the session', async () => {
  const sock = fakeSocket();
  const storage = memory();
  const net = createNet(sock, storage);
  sock.acks['room:join'] = { ok: true, token: 't', code: 'ABCD' };
  await net.join('abcd', 'Bea');
  assert.ok(storage.getItem('storage-wars-session'));
  sock.fire('closed', { reason: 'kicked' });
  assert.equal(storage.getItem('storage-wars-session'), null);
  sock.acks['room:create'] = { ok: true, token: 't2', code: 'EFGH' };
  sock.acks['room:leave'] = { ok: true };
  await net.create('Bea');
  await net.leave();
  assert.equal(storage.getItem('storage-wars-session'), null);
});

test('status goes waking after 3 s without a connection and online when it connects', () => {
  mock.timers.enable({ apis: ['setTimeout'] });
  try {
    const sock = fakeSocket();
    const net = createNet(sock, memory());
    const seen = [];
    net.on('status', (s) => seen.push(s));
    assert.equal(net.status, 'connecting');
    mock.timers.tick(3000);
    assert.equal(net.status, 'waking');
    sock.fire('connect');
    assert.equal(net.status, 'online');
    sock.fire('disconnect');
    assert.equal(net.status, 'offline');
    mock.timers.tick(3000);
    assert.equal(net.status, 'waking');
    assert.deepEqual(seen, ['waking', 'online', 'offline', 'waking']);
  } finally {
    mock.timers.reset();
  }
});

test('a listener removed while an event is being delivered is not called afterwards', () => {
  const sock = fakeSocket();
  const net = createNet(sock, memory());
  const calls = [];
  let offSecond = () => {};
  net.on('state', () => { calls.push('first'); offSecond(); }); // like the router swapping screens
  offSecond = net.on('state', () => calls.push('second'));
  sock.fire('state', { view: {}, events: [], serverNow: 1 });
  assert.deepEqual(calls, ['first']);
  sock.fire('state', { view: {}, events: [], serverNow: 2 });
  assert.deepEqual(calls, ['first', 'first']);
});

test('act sends game:act with the type merged into the payload', async () => {
  const sock = fakeSocket();
  const net = createNet(sock, memory());
  sock.acks['game:act'] = { ok: true };
  await net.act('bid', { amount: 300 });
  assert.deepEqual(sock.sent.at(-1), ['game:act', { type: 'bid', amount: 300 }]);
});
