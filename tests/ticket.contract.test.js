const assert = require('node:assert/strict');
const {
  toTicketView,
  toTicketDetailView,
  toHistoryView,
  toTicketPage,
} = require('../src/contracts/ticket.contract');

/**
 * Test hợp đồng dữ liệu ở ranh giới nghiệp vụ → trình bày (Buổi 9).
 *
 * Vì sao test riêng khỏi test nghiệp vụ: các test TC-01..TC-13 kiểm tra quy tắc
 * đúng/sai, còn test này kiểm tra HÌNH DẠNG và Ý NGHĨA của dữ liệu mà giao diện
 * nhận được. Nếu ai đổi tên cột trong CSDL hoặc bỏ một trường khi map, test này
 * đỏ ngay trên máy — không đợi tới lúc người dùng mở trang mới thấy "undefined".
 *
 * Chạy: `npm test` (được gọi từ tests/run-all.js).
 */

/** Bản ghi mẫu giống dữ liệu repository trả về sau khi JOIN. */
const PHIEU_MAU = {
  ticket_id: 1,
  ticket_code: 'BH-000001/2026',
  customer_id: 1,
  customer_name: 'Nguyen Van Binh',
  customer_phone: '0901234567',
  device_id: 10,
  serial_no: 'SN-10293',
  purchase_date: '2026-03-01',
  warranty_months: 12,
  center_id: 1,
  center_name: 'TTBH Quan 10',
  category_id: 3,
  category_name: 'SAC',
  issue_desc: 'May khong sac duoc',
  priority: 'CAO',
  status: 'MOI',
  request_type: 'BAO_HANH',
  received_at: '2026-10-19T02:00:00.000Z',
  due_date: '2026-10-20T02:00:00.000Z',
  closed_at: null,
  is_warranty: true,
};

/** Danh sách trường hợp đồng — đổi danh sách này là đổi hợp đồng, phải báo bên gọi. */
const TRUONG_HOP_DONG = [
  'category_id', 'category_name', 'center_id', 'center_name', 'closed_at',
  'customer_id', 'customer_name', 'customer_phone', 'device_id', 'due_date',
  'is_overdue', 'is_warranty', 'issue_desc', 'priority', 'priority_label',
  'purchase_date', 'received_at', 'request_type', 'serial_no', 'status',
  'status_label', 'ticket_code', 'ticket_id', 'warranty_months', 'warranty_status',
];

function chay() {
  // HD-01: hợp đồng có ĐÚNG bộ trường đã cam kết, không thừa không thiếu.
  const view = toTicketView(PHIEU_MAU, { bayGio: new Date('2026-10-19T05:00:00.000Z') });
  assert.deepEqual(Object.keys(view).sort(), TRUONG_HOP_DONG);
  console.log('[PASS] HD-01 hop dong co dung bo truong da cam ket');

  // HD-02: ngày luôn ra ISO 8601; null giữ nguyên null thay vì "Invalid Date".
  assert.equal(view.received_at, '2026-10-19T02:00:00.000Z');
  assert.equal(view.closed_at, null);
  assert.equal(view.purchase_date, '2026-03-01T00:00:00.000Z');
  console.log('[PASS] HD-02 ngay ra ISO 8601, null giu nguyen null');

  // HD-03 (QT-15): nhân viên thấy số che, quản lý thấy số đầy đủ.
  assert.equal(view.customer_phone, '090****567');
  const viewQuanLy = toTicketView(PHIEU_MAU, { vaiTro: 'quan_ly' });
  assert.equal(viewQuanLy.customer_phone, '0901234567');
  console.log('[PASS] HD-03 QT-15 che so theo vai tro');

  // HD-04 (QT-05): ba ý nghĩa bảo hành không được gộp làm một.
  assert.equal(view.warranty_status, 'CON_BAO_HANH');
  const hetHan = toTicketView({ ...PHIEU_MAU, is_warranty: false });
  assert.equal(hetHan.warranty_status, 'HET_BAO_HANH');
  const chuaXacMinh = toTicketView({ ...PHIEU_MAU, is_warranty: false, purchase_date: null });
  assert.equal(chuaXacMinh.warranty_status, 'CHUA_XAC_MINH');
  console.log('[PASS] HD-04 QT-05 phan biet con han / het han / chua xac minh');

  // HD-05: quá hạn chỉ tính khi phiếu còn mở; phiếu đã đóng không bị báo đỏ.
  assert.equal(view.is_overdue, false); // hạn 20/10, đang xét 19/10
  const treHan = toTicketView(PHIEU_MAU, { bayGio: new Date('2026-10-21T00:00:00.000Z') });
  assert.equal(treHan.is_overdue, true);
  const daDong = toTicketView(
    { ...PHIEU_MAU, status: 'DA_DONG', closed_at: '2026-10-25T00:00:00.000Z' },
    { bayGio: new Date('2026-10-26T00:00:00.000Z') },
  );
  assert.equal(daDong.is_overdue, false);
  console.log('[PASS] HD-05 qua han chi tinh cho phieu con mo');

  // HD-06: log trạng thái có nhãn tiếng Việt để giao diện không phải tự dịch.
  const log = toHistoryView({
    log_id: 2, ticket_id: 1, from_status: 'MOI', to_status: 'DA_PHAN_CONG',
    changed_at: '2026-10-19T03:00:00.000Z', changed_by: 1, note: 'Da tiep nhan',
  });
  assert.equal(log.from_label, 'Mới tiếp nhận');
  assert.equal(log.to_label, 'Đã phân công');
  console.log('[PASS] HD-06 log trang thai co nhan tieng Viet');

  // HD-07 (QT-06): danh sách bước chuyển lấy từ domain, không để giao diện tự đoán.
  const chiTiet = toTicketDetailView(PHIEU_MAU, [], { bayGio: new Date('2026-10-19T05:00:00.000Z') });
  assert.deepEqual(
    chiTiet.chuyen_tiep_duoc_phep.map((x) => x.status),
    ['DA_PHAN_CONG', 'DA_HUY'],
  );
  console.log('[PASS] HD-07 QT-06 chi tra cac buoc chuyen hop le');

  // HD-08: metadata phân trang dùng đúng tên trường và giữ tổng số dòng.
  const trang = toTicketPage(
    { rows: [PHIEU_MAU], total: 7 },
    { page: 2, pageSize: 1 },
    { vaiTro: 'quan_ly' },
  );
  assert.deepEqual(trang.meta, { page: 2, page_size: 1, total: 7 });
  assert.equal(trang.data.length, 1);
  assert.equal(trang.data[0].customer_phone, '0901234567');
  console.log('[PASS] HD-08 metadata phan trang dung hop dong');

  // HD-09: đầu vào rỗng trả null, không ném lỗi — bên gọi tự quyết định hiển thị.
  assert.equal(toTicketView(null), null);
  console.log('[PASS] HD-09 phieu rong tra null thay vi nem loi');

  console.log('[SO-TEST] 9');
  console.log('Contract tests passed: HD-01 .. HD-09');
}

chay();
