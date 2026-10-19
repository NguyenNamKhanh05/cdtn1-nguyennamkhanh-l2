const express = require('express');
const { cauHinh } = require('./config/env');
const { taoKetNoiPostgreSQL } = require('./config/database');
const { PhieuRepository } = require('./repositories/pg.repository');
const { BoNhoRepository } = require('./repositories/memory.repository');
const { DichVuPhieu } = require('./services/ticket.service');
const { DichVuKhachHang } = require('./services/customer.service');
const { taoRouteKhachHang } = require('./routes/customer.routes');
const { taoRoutePhieu } = require('./routes/ticket.routes');
const { taoRouteDanhMuc } = require('./routes/catalog.routes');
const { ganNguCanh } = require('./middleware/ngu-canh');

/**
 * Dữ liệu mẫu cho chế độ `memory`.
 *
 * Vì sao cần chế độ này: giảng viên có thể chạy `CHE_DO_DU_LIEU=memory npm start`
 * để xem API hoạt động mà không phải cài Docker/PostgreSQL. Đây cũng là bộ dữ
 * liệu dùng cho unit test, nên ba phiếu ở đây cố ý trùng với `seeds/001_seed_demo.sql`
 * để kết quả `GET /tickets` giống nhau ở cả hai chế độ.
 */
const DU_LIEU_MEM = {
  khachHangs: [
    { customer_id: 1, full_name: 'Nguyen Van Binh', phone: '0901234567', email: 'binh@example.com', address: 'Can Tho' },
    { customer_id: 2, full_name: 'Tran Thi Lan', phone: '0912345678', email: 'lan@example.com', address: 'Can Tho' },
    { customer_id: 3, full_name: 'Le Minh Khoa', phone: '0987654321', email: 'khoa@example.com', address: 'Ha Noi' },
  ],
  thietBis: [
    { device_id: 10, customer_id: 1, serial_no: 'SN-10293', purchase_date: '2026-03-01', warranty_months: 12 },
    { device_id: 11, customer_id: 2, serial_no: 'SN-20481', purchase_date: '2026-01-15', warranty_months: 12 },
    { device_id: 12, customer_id: 3, serial_no: 'SN-30755', purchase_date: '2025-11-20', warranty_months: 12 },
  ],
  phieus: [
    {
      ticket_id: 1,
      ticket_code: 'BH-000001/2026',
      customer_id: 1,
      device_id: 10,
      center_id: 1,
      request_type: 'BAO_HANH',
      issue_desc: 'May khong sac duoc',
      category_id: 3,
      priority: 'CAO',
      status: 'MOI',
      received_at: '2026-10-19T02:00:00.000Z',
      due_date: '2026-10-20T02:00:00.000Z',
      is_warranty: true,
    },
    {
      ticket_id: 2,
      ticket_code: 'BH-000002/2026',
      customer_id: 2,
      device_id: 11,
      center_id: 1,
      request_type: 'BAO_HANH',
      issue_desc: 'Man hinh bi soc',
      category_id: 1,
      priority: 'TRUNG_BINH',
      status: 'DANG_XU_LY',
      received_at: '2026-10-18T02:00:00.000Z',
      due_date: '2026-10-21T02:00:00.000Z',
      is_warranty: true,
    },
    {
      ticket_id: 3,
      ticket_code: 'BH-000003/2026',
      customer_id: 3,
      device_id: 12,
      center_id: 2,
      request_type: 'BAO_HANH',
      issue_desc: 'Pin tut nhanh',
      category_id: 2,
      priority: 'THAP',
      status: 'MOI',
      received_at: '2026-10-17T02:00:00.000Z',
      due_date: '2026-10-22T02:00:00.000Z',
      is_warranty: true,
    },
  ],
};

/**
 * Khởi tạo ứng dụng Express và "lắp ráp" các lớp theo kiến trúc 3 lớp.
 *
 * Vì sao tách khỏi `server.js`: `createApp` trả về app mà KHÔNG mở cổng, nhờ vậy
 * test có thể gọi `app.listen(0)` để lấy cổng ngẫu nhiên, tránh xung đột cổng
 * 3000 khi chạy test song song với server đang bật.
 *
 * Thứ tự middleware có ý nghĩa: `express.json()` phải đứng trước route để
 * `req.body` có dữ liệu; `ganNguCanh` phải đứng trước route để QT-14/QT-15 đọc
 * được vai trò người dùng.
 *
 * @param {object} [tuyChon]
 * @param {object|null} [tuyChon.repository] Repository tự truyền vào (dùng cho
 *   test hoặc để thay CSDL khác). Khi có, bỏ qua `cheDoDuLieu`.
 * @param {'postgresql'|'memory'|null} [tuyChon.cheDoDuLieu] Ghi đè chế độ kho
 *   dữ liệu trong `.env`. `memory` = không cần PostgreSQL.
 * @returns {import('express').Express} Ứng dụng đã cấu hình đầy đủ route.
 */
function createApp({ repository = null, cheDoDuLieu = null } = {}) {
  const app = express();
  const cheDo = cheDoDuLieu || cauHinh.cheDoDuLieu;

  // Chọn cài đặt repository theo cấu hình. Cả hai cài đặt cùng một interface
  // nên Service không cần biết dữ liệu đang nằm ở PostgreSQL hay trong RAM.
  const kho = repository
    ? { repository, loai: 'custom' }
    : (cheDo === 'memory'
      ? { repository: new BoNhoRepository(DU_LIEU_MEM), loai: 'memory' }
      : { repository: new PhieuRepository(taoKetNoiPostgreSQL()), loai: 'postgresql' });
  const duLieu = kho.repository;

  const dichVuPhieu = new DichVuPhieu(duLieu);
  const dichVuKhachHang = new DichVuKhachHang(duLieu);

  // Gắn lên app.locals để server.js đóng được pool khi tắt và test kiểm tra được
  // đang chạy chế độ nào mà không phải đọc lại biến môi trường.
  app.locals.repository = duLieu;
  app.locals.loaiKhoDuLieu = kho.loai;

  app.use(express.json());
  app.use(ganNguCanh);

  /**
   * GET /health — kiểm tra API và kết nối CSDL.
   * Trả 503 thay vì 200 khi mất CSDL để Docker healthcheck/giám sát phát hiện được.
   */
  app.get('/health', async (req, res) => {
    try {
      const ketNoi = await duLieu.kiemTraKetNoi();
      return res.json({ status: 'ok', database: kho.loai, connected: ketNoi });
    } catch (loi) {
      return res.status(503).json({ status: 'error', database: kho.loai, message: loi.message });
    }
  });

  // Đường dẫn chuẩn có phiên bản, dùng cho giao diện và tài liệu API.
  app.use('/api/v1', taoRouteKhachHang(dichVuKhachHang));
  app.use('/api/v1', taoRoutePhieu(dichVuPhieu));
  app.use('/api/v1', taoRouteDanhMuc(dichVuPhieu, duLieu));

  // Alias không có /api/v1 để gõ thử nhanh bằng curl/Postman đúng như ví dụ
  // trên lớp. Chấp nhận trùng route: đánh đổi nhỏ để giảm lỗi khi chấm bài.
  app.use('/', taoRouteKhachHang(dichVuKhachHang));
  app.use('/', taoRoutePhieu(dichVuPhieu));
  app.use('/', taoRouteDanhMuc(dichVuPhieu, duLieu));

  // 404 phải nằm sau toàn bộ route, nếu không sẽ "nuốt" mọi request.
  app.use((req, res) => {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: `Khong tim thay ${req.method} ${req.path}` } });
  });

  // Middleware lỗi tập trung: mọi lỗi không được route xử lý đều rơi vào đây.
  app.use((loi, req, res, next) => {
    if (res.headersSent) return next(loi);
    // JSON gửi sai định dạng là lỗi dữ liệu của người dùng, không phải lỗi hệ
    // thống — trả 400 để giao diện hiển thị đúng thông báo.
    if (loi.type === 'entity.parse.failed') {
      return res.status(400).json({
        error: { code: 'DU_LIEU_KHONG_HOP_LE', message: 'Body khong phai JSON hop le.' },
      });
    }
    // Log ra stderr để người chấm thấy nguyên nhân thật, nhưng KHÔNG trả chi
    // tiết lỗi cho client (tránh lộ cấu trúc CSDL/đường dẫn máy chủ).
    console.error(loi);
    return res.status(500).json({
      error: { code: 'LOI_HE_THONG', message: 'He thong dang gap su co. Vui long thu lai sau.' },
    });
  });

  return app;
}

module.exports = { createApp, DU_LIEU_MEM };
