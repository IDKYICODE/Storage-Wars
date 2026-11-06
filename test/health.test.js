import test from 'node:test';
import assert from 'node:assert/strict';
import { startServer } from '../server/index.js';

test('health check returns ok and index is served', async () => {
  const srv = await startServer({ port: 0 });
  try {
    const health = await fetch(`http://localhost:${srv.port}/healthz`);
    assert.equal(health.status, 200);
    assert.equal(await health.text(), 'ok');

    const home = await fetch(`http://localhost:${srv.port}/`);
    assert.equal(home.status, 200);
    assert.match(home.headers.get('content-type'), /html/);
  } finally {
    await srv.close();
  }
});
