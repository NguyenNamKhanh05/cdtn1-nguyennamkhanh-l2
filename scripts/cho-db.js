const { Client } = require('pg');
const { cauHinh } = require('../src/config/env');

/**
 * Chờ PostgreSQL sẵn sàng trước khi chạy migration.
 *
 * Vì sao cần: `docker compose up -d` trả về ngay khi container được tạo, nhưng
 * PostgreSQL cần thêm 1–3 giây để nhận kết nối. Nếu `npm run setup` chạy
 * migration ngay lập tức, lần đầu trên máy chậm sẽ thất bại ngẫu nhiên — đúng
 * loại lỗi khiến giảng viên kết luận "repo chạy không được".
 *
 * Dùng: `node scripts/cho-db.js` (được gọi tự động trong `npm run setup`).
 */

const SO_LAN_THU = 30;
const CHO_MS = 1000;

/** @param {number} ms Thời gian chờ. @returns {Promise<void>} */
function cho(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Thử kết nối tối đa 30 lần, mỗi lần cách nhau 1 giây.
 *
 * Khi hết lượt, đặt `process.exitCode = 1` thay vì `process.exit(1)` để các
 * thông báo đã ghi ra stdout kịp thoát ra terminal (đặc biệt trên Windows).
 *
 * @returns {Promise<void>}
 */
async function chay() {
  for (let lan = 1; lan <= SO_LAN_THU; lan += 1) {
    const client = new Client(cauHinh.db);
    try {
      await client.connect();
      await client.query('SELECT 1');
      await client.end();
      console.log(`PostgreSQL san sang (${cauHinh.db.host}:${cauHinh.db.port}/${cauHinh.db.database}).`);
      return;
    } catch (loi) {
      // client.end() có thể ném lỗi nếu kết nối chưa từng mở; bỏ qua vì ta
      // đang trong nhánh xử lý lỗi chính rồi.
      await client.end().catch(() => {});
      if (lan === SO_LAN_THU) {
        console.error(`Khong ket noi duoc PostgreSQL sau ${SO_LAN_THU} lan thu.`);
        console.error(`Chi tiet: ${loi.message}`);
        console.error('Goi y: chay "npm run db:up" de bat PostgreSQL bang Docker.');
        process.exitCode = 1;
        return;
      }
      // Dấu chấm để người dùng thấy script đang chờ chứ không bị treo im lặng.
      process.stdout.write('.');
      await cho(CHO_MS);
    }
  }
}

chay();
