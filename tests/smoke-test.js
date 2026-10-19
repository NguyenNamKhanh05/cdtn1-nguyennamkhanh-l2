const assert = require('node:assert/strict');
const { once } = require('node:events');
const { createApp } = require('../src/app');

/**
 * Smoke test: dựng app thật rồi gọi `GET /health` qua HTTP.
 *
 * Vì sao cần: unit test gọi thẳng Service nên không phát hiện được lỗi lắp ráp
 * (quên `app.use`, sai thứ tự middleware, route không mount). Smoke test bắt
 * đúng những lỗi đó với chi phí gần như bằng không.
 *
 * Chạy bằng repository bộ nhớ để không cần PostgreSQL.
 *
 * @returns {Promise<void>}
 */
async function main() {
  const app = createApp({ repository: null, cheDoDuLieu: 'memory' });

  // Cổng 0 = hệ điều hành tự chọn cổng trống, tránh đụng cổng 3000 khi server
  // thật đang chạy trong lúc test.
  const server = app.listen(0);
  await once(server, 'listening');

  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/health`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.status, 'ok');

  server.close();
  console.log('Smoke test passed: GET /health returns {"status":"ok"}');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
