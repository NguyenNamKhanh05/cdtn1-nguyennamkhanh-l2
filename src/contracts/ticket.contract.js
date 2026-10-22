const { cheSoDienThoai } = require('../domain/phone');
const { danhSachTrangThaiKeTiep } = require('../domain/ticket-status');
const { duocXemSoDayDu } = require('../middleware/ngu-canh');

/**
 * Hợp đồng dữ liệu giữa lớp nghiệp vụ và lớp trình bày (Buổi 9).
 *
 * Vì sao cần tệp này: trước đây route trả thẳng bản ghi lấy từ câu SQL, nên
 * giao diện phải biết tên cột `ticket_code`, `customer_phone`... Đổi tên một
 * cột trong CSDL sẽ làm vỡ giao diện ngay lúc chạy mà không test nào bắt được.
 * Từ đây, MỌI endpoint phiếu đều đi qua `toTicketView` — đó là chỗ duy nhất
 * biết hình dạng dữ liệu ra, và cũng là chỗ duy nhất áp QT-15 cho số điện thoại
 * của khách gắn với phiếu.
 *
 * Quy ước đặt tên: giữ snake_case ở hợp đồng để không phá vỡ API contract và
 * các ảnh Postman đã nộp; lớp giao diện chỉ đọc các trường được khai báo dưới
 * đây, không đọc trực tiếp bản ghi CSDL.
 */

/**
 * Nhãn tiếng Việt của trạng thái — dùng cho màn hình và lịch sử.
 * Không đặt trong CSDL vì đây là chuyện trình bày, đổi câu chữ không cần migration.
 */
const NHAN_TRANG_THAI = {
  MOI: 'Mới tiếp nhận',
  DA_PHAN_CONG: 'Đã phân công',
  DANG_XU_LY: 'Đang xử lý',
  CHO_LINH_KIEN: 'Chờ linh kiện',
  HOAN_TAT: 'Hoàn tất',
  DA_DONG: 'Đã đóng',
  DA_HUY: 'Đã hủy',
};

/** Nhãn mức ưu tiên; giữ đúng ba giá trị mà CHECK trong DDL cho phép (QT-04). */
const NHAN_UU_TIEN = {
  CAO: 'Cao',
  TRUNG_BINH: 'Trung bình',
  THAP: 'Thấp',
};

/** Trạng thái đã kết thúc — không còn tính quá hạn và không chuyển tiếp được. */
const TRANG_THAI_KET_THUC = ['HOAN_TAT', 'DA_DONG', 'DA_HUY'];

/**
 * Đổi một giá trị ngày sang chuỗi ISO 8601 để bên gọi luôn nhận cùng một định
 * dạng, bất kể PostgreSQL trả `Date` hay chuỗi.
 *
 * @param {Date|string|null|undefined} giaTri Giá trị ngày từ CSDL.
 * @returns {string|null} Chuỗi ISO 8601, hoặc `null` khi không có ngày.
 *   Ngày không hợp lệ cũng trả `null` — dữ liệu hỏng không được làm sập màn hình.
 */
function ngayISO(giaTri) {
  if (!giaTri) return null;
  const ngay = giaTri instanceof Date ? giaTri : new Date(giaTri);
  return Number.isNaN(ngay.getTime()) ? null : ngay.toISOString();
}

/**
 * Suy ra ý nghĩa bảo hành từ cờ `is_warranty` và ngày mua (QT-05).
 *
 * Vì sao không chỉ dùng `is_warranty`: cột này là NOT NULL nên thiếu ngày mua
 * bị lưu `false`, trùng với "đã hết bảo hành". Ba trạng thái dưới đây giữ lại
 * sự khác nhau đó để giao diện yêu cầu quản lý phê duyệt thay vì từ chối oan.
 *
 * @param {{is_warranty: boolean, purchase_date: Date|string|null}} phieu
 * @returns {'CON_BAO_HANH'|'HET_BAO_HANH'|'CHUA_XAC_MINH'} Ý nghĩa bảo hành.
 */
function trangThaiBaoHanh(phieu) {
  if (phieu.is_warranty) return 'CON_BAO_HANH';
  return phieu.purchase_date ? 'HET_BAO_HANH' : 'CHUA_XAC_MINH';
}

/**
 * Chuyển một bản ghi phiếu (có thể kèm trường JOIN) thành hợp đồng cho giao diện.
 *
 * @param {object|null} phieu Bản ghi từ repository; có thể có `customer_name`,
 *   `customer_phone`, `center_name`, `category_name`, `serial_no`,
 *   `purchase_date`, `warranty_months` nhờ JOIN.
 * @param {object} [tuyChon]
 * @param {'nhan_vien'|'quan_ly'|'ban_giam_doc'} [tuyChon.vaiTro='nhan_vien']
 *   Vai trò người xem; quyết định số điện thoại có bị che hay không (QT-15).
 * @param {Date} [tuyChon.bayGio=new Date()] Mốc thời gian để tính quá hạn;
 *   tham số hoá để test không phụ thuộc ngày chạy.
 * @returns {object|null} Hợp đồng gồm các trường được khai báo bên dưới, hoặc
 *   `null` khi đầu vào rỗng (bên gọi phải tự quyết định hiển thị "không có").
 */
function toTicketView(phieu, { vaiTro = 'nhan_vien', bayGio = new Date() } = {}) {
  if (!phieu) return null;

  const dueDate = ngayISO(phieu.due_date);
  const daKetThuc = TRANG_THAI_KET_THUC.includes(phieu.status);
  const conBaoHanh = trangThaiBaoHanh(phieu);

  // QT-15: chỉ Quản lý và Ban giám đốc thấy số đầy đủ. Che ở đúng một chỗ
  // (hợp đồng) để không endpoint nào vô tình trả số thô.
  const customerPhone = duocXemSoDayDu({ vaiTro })
    ? (phieu.customer_phone ?? null)
    : cheSoDienThoai(phieu.customer_phone ?? null);

  return {
    ticket_id: phieu.ticket_id,
    ticket_code: phieu.ticket_code,
    customer_id: phieu.customer_id,
    customer_name: phieu.customer_name ?? null,
    customer_phone: customerPhone,
    device_id: phieu.device_id,
    serial_no: phieu.serial_no ?? null,
    purchase_date: ngayISO(phieu.purchase_date),
    warranty_months: phieu.warranty_months ?? null,
    request_type: phieu.request_type ?? null,
    center_id: phieu.center_id,
    center_name: phieu.center_name ?? null,
    category_id: phieu.category_id ?? null,
    category_name: phieu.category_name ?? null,
    issue_desc: phieu.issue_desc,
    priority: phieu.priority,
    priority_label: NHAN_UU_TIEN[phieu.priority] || phieu.priority,
    status: phieu.status,
    status_label: NHAN_TRANG_THAI[phieu.status] || phieu.status,
    received_at: ngayISO(phieu.received_at),
    due_date: dueDate,
    closed_at: ngayISO(phieu.closed_at),
    is_warranty: Boolean(phieu.is_warranty),
    warranty_status: conBaoHanh,
    // Quá hạn chỉ có nghĩa khi phiếu còn mở. Tính ở đây thay vì ở giao diện để
    // mọi màn hình dùng chung một định nghĩa "quá hạn".
    is_overdue: Boolean(dueDate) && !daKetThuc && new Date(dueDate) < bayGio,
  };
}

/**
 * Chuyển một dòng log trạng thái thành hợp đồng cho màn hình chi tiết.
 *
 * @param {object} dong Bản ghi `ticket_status_log`.
 * @returns {object} Log với nhãn tiếng Việt và thời điểm dạng ISO 8601.
 */
function toHistoryView(dong) {
  return {
    log_id: dong.log_id,
    from_status: dong.from_status ?? null,
    from_label: dong.from_status ? (NHAN_TRANG_THAI[dong.from_status] || dong.from_status) : null,
    to_status: dong.to_status,
    to_label: NHAN_TRANG_THAI[dong.to_status] || dong.to_status,
    changed_at: ngayISO(dong.changed_at),
    changed_by: dong.changed_by,
    note: dong.note ?? null,
  };
}

/**
 * Hợp đồng cho màn hình chi tiết: thông tin phiếu + lịch sử + các bước chuyển
 * được phép.
 *
 * Vì sao trả kèm `chuyen_tiep_duoc_phep`: giao diện không được tự suy ra vòng
 * đời trạng thái (QT-06), nếu không sẽ có hai bản quy tắc và sớm lệch nhau.
 * Danh sách này lấy trực tiếp từ `src/domain/ticket-status.js`.
 *
 * @param {object} phieu Bản ghi phiếu đã JOIN.
 * @param {object[]} lichSu Các dòng log, cũ nhất trước.
 * @param {object} [tuyChon] Cùng ý nghĩa `vaiTro`/`bayGio` như `toTicketView`.
 * @returns {object} Hợp đồng chi tiết.
 */
function toTicketDetailView(phieu, lichSu = [], tuyChon = {}) {
  return {
    ...toTicketView(phieu, tuyChon),
    lich_su: lichSu.map(toHistoryView),
    chuyen_tiep_duoc_phep: danhSachTrangThaiKeTiep(phieu.status).map((status) => ({
      status,
      label: NHAN_TRANG_THAI[status] || status,
    })),
  };
}

/**
 * Bọc danh sách phiếu và metadata phân trang thành hợp đồng.
 *
 * @param {{rows: object[], total: number}} ketQua Kết quả repository.
 * @param {{page: number, pageSize: number}} phanTrang Thông số đã dùng để truy vấn.
 * @param {object} [tuyChon] Cùng ý nghĩa `vaiTro`/`bayGio` như `toTicketView`.
 * @returns {{data: object[], meta: {page: number, page_size: number, total: number}}}
 *   `total` là tổng số dòng khớp bộ lọc, không phải số dòng của trang.
 */
function toTicketPage(ketQua, { page, pageSize }, tuyChon = {}) {
  return {
    data: ketQua.rows.map((row) => toTicketView(row, tuyChon)),
    meta: {
      page,
      page_size: pageSize,
      total: ketQua.total,
    },
  };
}

module.exports = {
  NHAN_TRANG_THAI,
  NHAN_UU_TIEN,
  TRANG_THAI_KET_THUC,
  ngayISO,
  trangThaiBaoHanh,
  toTicketView,
  toHistoryView,
  toTicketDetailView,
  toTicketPage,
};
