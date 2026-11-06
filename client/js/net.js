// Socket layer: one place that talks to the server, remembers the seat for reconnects, and tracks
// connection status. No DOM or window access at import time so it can be tested in Node.

const SESSION_KEY = 'storage-wars-session';
const WAKING_AFTER_MS = 3000;

export function createNet(socket, storage) {
  const listeners = {};
  const net = {
    status: 'connecting', // connecting | online | offline | waking
    last: { lobby: null, state: null },
  };
  let offset = 0;
  let wakeTimer = null;

  // Delivering to a snapshot would still call a listener that an earlier listener just removed (the router
  // swapping screens does exactly that), so each listener carries an `off` flag that is checked per call.
  const emit = (ev, payload) => [...(listeners[ev] ?? [])].forEach((l) => { if (!l.off) l.fn(payload); });
  const ask = (ev, payload) => new Promise((resolve) => socket.emit(ev, payload, resolve));

  const loadSession = () => {
    try { return JSON.parse(storage.getItem(SESSION_KEY)); } catch { return null; }
  };
  const saveSession = (s) => { try { storage.setItem(SESSION_KEY, JSON.stringify(s)); } catch { /* storage blocked: reconnect just won't resume */ } };
  const clearSession = () => { try { storage.removeItem(SESSION_KEY); } catch { /* ignore */ } };

  const setStatus = (s) => {
    if (net.status === s) return;
    net.status = s;
    emit('status', s);
  };
  const armWakeTimer = () => {
    clearTimeout(wakeTimer);
    wakeTimer = setTimeout(() => setStatus('waking'), WAKING_AFTER_MS);
    wakeTimer?.unref?.();
  };

  socket.on('connect', async () => {
    clearTimeout(wakeTimer);
    setStatus('online');
    const session = loadSession();
    if (!session?.token) return;
    const res = await ask('room:rejoin', { token: session.token });
    if (!res?.ok) {
      clearSession();
      net.last = { lobby: null, state: null };
      emit('closed', { reason: 'gone' });
    }
  });
  socket.on('disconnect', () => { setStatus('offline'); armWakeTimer(); });
  socket.on('connect_error', () => { if (net.status === 'online') setStatus('offline'); armWakeTimer(); });

  socket.on('lobby', (l) => { net.last = { lobby: l, state: null }; emit('lobby', l); });
  socket.on('state', (m) => {
    offset = m.serverNow - Date.now();
    net.last = { lobby: null, state: m };
    emit('state', m);
  });
  socket.on('closed', (m) => {
    clearSession();
    net.last = { lobby: null, state: null };
    emit('closed', m);
  });

  armWakeTimer();

  const enter = async (ev, payload) => {
    const res = await ask(ev, payload);
    if (res?.ok) saveSession({ token: res.token, code: res.code });
    return res;
  };

  return Object.assign(net, {
    /** Server time right now, corrected for clock skew (for countdowns). */
    now: () => Date.now() + offset,
    on(ev, fn) {
      const entry = { fn, off: false };
      (listeners[ev] ??= []).push(entry);
      return () => { entry.off = true; listeners[ev] = listeners[ev].filter((l) => l !== entry); };
    },
    create: (name) => enter('room:create', { name }),
    join: (code, name) => enter('room:join', { code, name }),
    act: (type, payload = {}) => ask('game:act', { ...payload, type }),
    kick: (playerId) => ask('room:kick', { playerId }),
    setMode: (mode) => ask('room:mode', { mode }),
    setSettings: (patch) => ask('room:settings', patch),
    start: () => ask('room:start', {}),
    async leave() {
      const res = await ask('room:leave', {});
      clearSession();
      net.last = { lobby: null, state: null };
      return res;
    },
  });
}
