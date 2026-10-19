const fs = require('node:fs');
const path = require('node:path');

/**
 * Nạp biến môi trường và cung cấp cấu hình mặc định.
 *
 * Vì sao không dùng thư viện `dotenv`: bài nộp cần chạy được ngay sau khi clone,
 * nên càng ít phụ thuộc càng tốt. Định dạng `.env` ở đây chỉ là KEY=VALUE, đủ
 * cho nhu cầu của đồ án.
 *
 * Vì sao có giá trị mặc định: nếu thầy quên tạo `.env` thì các giá trị này phải
 * TRÙNG với `docker-compose.yml`, nhờ vậy `npm run setup` vẫn chạy được. Đây là
 * đánh đổi có chủ ý giữa "bảo mật" và "chạy được ngay" — mật khẩu mặc định chỉ
 * dùng cho CSDL local trong Docker, không dùng cho môi trường thật.
 */

const DUONG_DAN_ENV = path.resolve(__dirname, '..', '..', '.env');

/**
 * Đọc file `.env` (nếu có) và gán vào `process.env`.
 *
 * Quy tắc: biến đã có trong môi trường thật sẽ KHÔNG bị ghi đè, để có thể
 * `DB_PORT=5555 npm start` mà không phải sửa file.
 *
 * @returns {void}
 */
function napEnv() {
  if (!fs.existsSync(DUONG_DAN_ENV)) return;
  const noiDung = fs.readFileSync(DUONG_DAN_ENV, 'utf8');
  for (const dong of noiDung.split(/\r?\n/)) {
    const dongSach = dong.trim();
    // Bỏ qua dòng trống và dòng chú thích.
    if (!dongSach || dongSach.startsWith('#')) continue;
    const viTri = dongSach.indexOf('=');
    if (viTri < 0) continue;
    const khoa = dongSach.slice(0, viTri).trim();
    let giaTri = dongSach.slice(viTri + 1).trim();
    // Cho phép giá trị có dấu nháy, hữu ích khi mật khẩu chứa dấu cách.
    if (
      (giaTri.startsWith('"') && giaTri.endsWith('"'))
      || (giaTri.startsWith("'") && giaTri.endsWith("'"))
    ) {
      giaTri = giaTri.slice(1, -1);
    }
    if (!(khoa in process.env)) process.env[khoa] = giaTri;
  }
}

napEnv();

/**
 * Cấu hình đã chuẩn hóa, dùng chung cho toàn ứng dụng.
 *
 * `db.port = 5434` vì máy dev đã có PostgreSQL ở 5432/5433; xem README mục
 * "Vì sao cổng 5434".
 */
const cauHinh = {
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5434),
    database: process.env.DB_NAME || 'mekong_mobile',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'mekong_local_dev',
    max: Number(process.env.DB_POOL_MAX || 10),
  },
  port: Number(process.env.PORT || 3000),
  // CHE_DO_DU_LIEU=memory để chạy không cần PostgreSQL (dùng cho demo nhanh
  // hoặc khi máy chấm không cài Docker).
  cheDoDuLieu: (process.env.CHE_DO_DU_LIEU || 'auto').toLowerCase(),
};

module.exports = { cauHinh, napEnv };
