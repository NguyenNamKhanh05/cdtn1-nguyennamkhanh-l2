const { Pool } = require('pg');
const { cauHinh } = require('./env');

/**
 * Kết nối PostgreSQL dùng chung cho toàn ứng dụng.
 *
 * Hai bộ chuyển kiểu dưới đây là bắt buộc, không phải tối ưu hóa tùy chọn —
 * xem giải thích ở từng dòng. Nếu bỏ đi, mã ở lớp Service sẽ so sánh sai mà
 * không báo lỗi, đây là loại lỗi khó phát hiện nhất.
 */

// Mã OID của PostgreSQL cho kiểu dữ liệu.
const KIEU_SO_NGUYEN_LON = 20; // int8 / BIGINT
const KIEU_NGAY = 1082; // DATE

const kieuGoc = require('pg').types;

// CẢNH BÁO: mặc định `pg` trả BIGINT về dạng CHUỖI để không mất độ chính xác.
// Với dự án này, `ticket_id`, `customer_id`... đều là BIGSERIAL và nhỏ hơn
// 2^53, nên đọc thành Number cho đúng ý định. Nếu bỏ dòng này,
// `thietBi.customer_id !== khachHang.customer_id` sẽ luôn đúng (so sánh chuỗi
// với số) và QT-03 báo sai "thiết bị không thuộc khách".
kieuGoc.setTypeParser(KIEU_SO_NGUYEN_LON, (giaTri) => (giaTri === null ? null : Number(giaTri)));

// DATE giữ nguyên dạng `YYYY-MM-DD` thay vì đổi sang Date. Lý do: `new Date('2026-03-01')`
// được hiểu là 00:00 UTC, khi hiển thị theo giờ Việt Nam (UTC+7) vẫn đúng ngày,
// nhưng nếu dùng getDate() ở múi giờ âm sẽ lùi một ngày — làm sai QT-05.
kieuGoc.setTypeParser(KIEU_NGAY, (giaTri) => giaTri);

/**
 * Tạo pool kết nối PostgreSQL từ biến môi trường.
 *
 * Dùng Pool thay vì Client đơn lẻ vì mỗi request cần một kết nối riêng; pool
 * tái sử dụng kết nối nên không phải bắt tay TCP lại cho từng request.
 *
 * @returns {import('pg').Pool} Pool chưa được kiểm tra kết nối — lỗi kết nối sẽ
 *   xuất hiện ở truy vấn đầu tiên, và `/health` là nơi phát hiện sớm nhất.
 */
function taoKetNoiPostgreSQL() {
  return new Pool(cauHinh.db);
}

module.exports = { taoKetNoiPostgreSQL };
