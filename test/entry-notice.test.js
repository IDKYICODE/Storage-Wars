import test from 'node:test';
import assert from 'node:assert/strict';

// The entry screen is already on screen when a page reload finds that the saved room is gone.
// The "room is gone" notice must still appear then, not only the next time the screen is mounted.
globalThis.window = { location: { search: '' }, localStorage: { getItem: () => null, setItem() {} } };
const { mount } = await import('../client/js/screens/entry.js');

function fakeRoot() {
  const listeners = {};
  return {
    innerHTML: '',
    addEventListener(ev, fn) { listeners[ev] = fn; },
    removeEventListener() {},
    querySelector: () => null,
    querySelectorAll: () => [],
  };
}
function fakeNet() {
  const handlers = {};
  return {
    handlers,
    on(ev, fn) { (handlers[ev] ??= []).push(fn); return () => { handlers[ev] = handlers[ev].filter((f) => f !== fn); }; },
  };
}

test('a "gone" message arriving while the entry screen is showing displays the notice', () => {
  const root = fakeRoot();
  const net = fakeNet();
  const ctx = { net, notice: null };
  const unmount = mount(root, ctx);
  assert.ok(!root.innerHTML.includes('That room is gone'));
  ctx.notice = 'That room is gone (the server may have restarted).'; // what main.js sets before routing
  net.handlers.closed.forEach((fn) => fn({ reason: 'gone' }));
  assert.ok(root.innerHTML.includes('That room is gone'));
  unmount();
  assert.equal(net.handlers.closed.length, 0, 'listener must be removed on unmount');
});
