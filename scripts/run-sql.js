const fs = require('node:fs/promises');
const path = require('node:path');
const { Client } = require('pg');
const { cauHinh } = require('../src/config/env');

/**
 * Chạy một hoặc nhiều file SQL trên cùng một kết nối.
 *
 * Vì sao dùng script này thay vì gọi `psql`: máy chấm có thể không có `psql`
 * trong PATH (chỉ có Docker). Dùng thư viện `pg` sẵn có bảo đảm `npm run migrate`
 * chạy được ở mọi máy đã `npm install`.
 *
 * Mỗi file nằm trong MỘT transaction riêng: nếu file lỗi giữa chừng, không có
 * bảng nào bị tạo dở. Nhờ vậy có thể chạy lại toàn bộ migration sau khi sửa.
 *
 * Dùng: `node scripts/run-sql.js migrations/001_create_core.sql`
 */

/**
 * Chạy nội dung một file SQL trong transaction riêng.
 *
 * @param {import('pg').Client} client Kết nối đang mở.
 * @param {string} filePath Đường dẫn file SQL (tương đối tính từ thư mục chạy).
 * @returns {Promise<void>}
 * @throws {Error} Khi SQL lỗi — đã rollback trước khi ném.
 */
async function chayFile(client, filePath) {
  const noiDung = await fs.readFile(path.resolve(filePath), 'utf8');
  await client.query('BEGIN');
  try {
    await client.query(noiDung);
    await client.query('COMMIT');
    console.log(`Da chay ${filePath}`);
  } catch (loi) {
    await client.query('ROLLBACK');
    throw loi;
  }
}

/**
 * Điểm vào: đọc danh sách file từ `process.argv`, chạy lần lượt.
 * @returns {Promise<void>}
 * @throws {Error} Khi không truyền file nào.
 */
async function chay() {
  const danhSach = process.argv.slice(2);
  if (danhSach.length === 0) {
    throw new Error('Su dung: node scripts/run-sql.js <file.sql> [file.sql ...]');
  }

  const client = new Client(cauHinh.db);
  await client.connect();
  try {
    for (const filePath of danhSach) {
      await chayFile(client, filePath);
    }
  } finally {
    // Luôn đóng kết nối, kể cả khi một file lỗi, nếu không tiến trình sẽ treo.
    await client.end();
  }
}

chay().catch((loi) => {
  console.error(`Loi: ${loi.message}`);
  process.exitCode = 1;
});
