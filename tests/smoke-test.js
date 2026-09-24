const assert = require('node:assert/strict');
const { once } = require('node:events');
const { createApp } = require('../src/app');

async function main() {
  const app = createApp();
  const server = app.listen(0);
  await once(server, 'listening');

  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/health`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(body, { status: 'ok' });

  server.close();
  console.log('Smoke test passed: GET /health returns {"status":"ok"}');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
