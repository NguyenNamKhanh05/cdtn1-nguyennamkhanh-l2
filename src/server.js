require('./config/env');
const { createApp } = require('./app');

/**
 * Điểm khởi động của API.
 *
 * Tách khỏi `app.js` để phần "mở cổng" và phần "lắp ráp ứng dụng" không trộn
 * vào nhau: test import `createApp` mà không vô tình mở cổng 3000.
 */

const app = createApp();
const port = Number(process.env.PORT || 3000);

const server = app.listen(port, () => {
  console.log(`API dang chay tai http://localhost:${port}`);
  console.log(`Kiem tra suc khoe: http://localhost:${port}/health`);
  console.log(`Kieu kho du lieu: ${app.locals.loaiKhoDuLieu}`);
});

/**
 * Tắt server gọn gàng khi nhận tín hiệu dừng (Ctrl+C hoặc Docker stop).
 *
 * Vì sao phải đóng repository: pool PostgreSQL còn kết nối mở sẽ giữ tiến trình
 * Node sống, khiến `docker compose down` phải chờ hết timeout mới dừng được.
 *
 * @param {string} tinHieu Tên tín hiệu nhận được (`SIGINT`, `SIGTERM`).
 * @returns {Promise<void>}
 */
async function tat(tinHieu) {
  console.log(`\nNhan ${tinHieu}, dang tat server...`);
  server.close(async () => {
    const repository = app.locals.repository;
    if (repository && typeof repository.dong === 'function') await repository.dong();
    process.exit(0);
  });
}

process.on('SIGINT', () => tat('SIGINT'));
process.on('SIGTERM', () => tat('SIGTERM'));
