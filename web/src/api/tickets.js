import { goiApi } from './client';

/**
 * Các thao tác nghiệp vụ L2 mà giao diện cần.
 *
 * Mỗi hàm chỉ mô tả MỘT endpoint và trả đúng `data`/`meta` của hợp đồng. Nhờ
 * vậy component không biết gì về query string hay tên tham số CSDL.
 */

/**
 * Lấy danh sách phiếu có lọc và phân trang.
 *
 * @param {object} [boLoc]
 * @param {string} [boLoc.status] Mã trạng thái (MOI, DA_PHAN_CONG...).
 * @param {number|null} [boLoc.centerId] Trung tâm; bỏ trống để lấy theo quyền.
 * @param {number} [boLoc.page=1] Trang bắt đầu từ 1.
 * @param {number} [boLoc.pageSize=50] Số dòng mỗi trang.
 * @returns {Promise<{data: object[], meta: {page: number, page_size: number, total: number}}>}
 *   `data` rỗng là trạng thái RỖNG hợp lệ, không phải lỗi.
 */
export async function layDanhSachPhieu({ status, centerId, page = 1, pageSize = 50 } = {}) {
  const thamSo = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
  if (status) thamSo.set('status', status);
  if (centerId) thamSo.set('center_id', String(centerId));
  const ketQua = await goiApi(`/tickets?${thamSo.toString()}`);
  return { data: ketQua.data, meta: ketQua.meta };
}

/**
 * Lấy chi tiết phiếu kèm lịch sử và các bước chuyển hợp lệ (QT-06).
 *
 * @param {number} ticketId Mã phiếu.
 * @returns {Promise<object>} Hợp đồng chi tiết từ `src/contracts/ticket.contract.js`.
 */
export async function layChiTietPhieu(ticketId) {
  const ketQua = await goiApi(`/tickets/${ticketId}`);
  return ketQua.data;
}

/**
 * Chuyển trạng thái phiếu (QT-06).
 *
 * @param {number} ticketId Mã phiếu.
 * @param {string} toStatus Trạng thái đích; phải nằm trong `chuyen_tiep_duoc_phep`.
 * @param {string|null} [note] Ghi chú xử lý.
 * @returns {Promise<object>} `{ticket_id, from_status, to_status, changed_at, changed_by}`.
 * @throws {LoiApi} `INVALID_TRANSITION` khi bước chuyển không hợp lệ.
 */
export async function chuyenTrangThai(ticketId, toStatus, note = null) {
  const ketQua = await goiApi(`/tickets/${ticketId}/transitions`, {
    method: 'POST',
    body: { to_status: toStatus, note },
  });
  return ketQua.data;
}

/**
 * Tra khách hàng theo số điện thoại (QT-01, QT-02).
 *
 * @param {string} phone Số người dùng nhập, chưa cần đúng định dạng.
 * @returns {Promise<object>} Hồ sơ khách hàng.
 * @throws {LoiApi} `CUSTOMER_NOT_FOUND` khi số chưa có — giao diện chuyển sang
 *   form tạo khách mới; các lỗi khác hiển thị nguyên câu.
 */
export async function traKhachTheoSo(phone) {
  const ketQua = await goiApi(`/customers?phone=${encodeURIComponent(phone)}`);
  return ketQua.data;
}

/**
 * Tạo hồ sơ khách hàng mới (QT-01).
 *
 * @param {{full_name: string, phone: string, address?: string}} duLieu
 * @returns {Promise<object>} Hồ sơ vừa tạo.
 * @throws {LoiApi} `PHONE_ALREADY_EXISTS` khi số đã có — giao diện gợi ý dùng
 *   lại hồ sơ cũ thay vì tạo bản ghi thứ hai.
 */
export async function taoKhachHang(duLieu) {
  const ketQua = await goiApi('/customers', { method: 'POST', body: duLieu });
  return ketQua.data;
}

/**
 * Lấy thiết bị đang hoạt động của một khách (QT-03, QT-13).
 *
 * @param {number} customerId Mã khách hàng.
 * @returns {Promise<object[]>} Mảng rỗng nghĩa là khách chưa có thiết bị —
 *   giao diện hiện trạng thái RỖNG kèm nút thêm thiết bị.
 */
export async function layThietBiCuaKhach(customerId) {
  const ketQua = await goiApi(`/customers/${customerId}/devices`);
  return ketQua.data;
}

/**
 * Ghi nhận thiết bị mới trước khi lập phiếu (QT-03).
 *
 * @param {{customer_id: number, serial_no: string, purchase_date: string|null, warranty_months: number}} duLieu
 * @returns {Promise<object>} Thiết bị vừa tạo (có `device_id`).
 * @throws {LoiApi} `SERIAL_ALREADY_EXISTS` khi serial thuộc thiết bị khác.
 */
export async function taoThietBi(duLieu) {
  const ketQua = await goiApi('/devices', { method: 'POST', body: duLieu });
  return ketQua.data;
}

/**
 * Tạo phiếu tiếp nhận (QT-03, QT-04, QT-05, QD-01, NFR4).
 *
 * @param {object} duLieu
 * @param {number} duLieu.customer_id
 * @param {number} duLieu.device_id
 * @param {number} duLieu.center_id
 * @param {number} duLieu.category_id
 * @param {string} duLieu.issue_desc
 * @param {'CAO'|'TRUNG_BINH'|'THAP'} duLieu.priority
 * @param {string} duLieu.request_id Khóa chống trùng; gửi lại cùng khóa khi
 *   người dùng bấm thử lại để không tạo phiếu thứ hai.
 * @returns {Promise<object>} Phiếu mới, kèm `canh_bao_bao_hanh` nếu thiếu ngày
 *   mua (QT-05).
 * @throws {LoiApi} `PHIEU_DANG_MO` (QD-01), `THIET_BI_KHONG_THUOC_KHACH` (QT-03).
 */
export async function taoPhieu(duLieu) {
  const ketQua = await goiApi('/tickets', { method: 'POST', body: duLieu });
  return ketQua.data;
}

/**
 * Lấy danh mục cần cho form tiếp nhận: nhóm sự cố và trung tâm.
 *
 * @returns {Promise<{nhomSuCo: object[], trungTam: object[]}>}
 * @throws {LoiApi} Khi một trong hai danh mục không tải được.
 */
export async function layDanhMuc() {
  const [nhomSuCo, trungTam] = await Promise.all([
    goiApi('/issue-categories'),
    goiApi('/service-centers'),
  ]);
  return { nhomSuCo: nhomSuCo.data, trungTam: trungTam.data };
}
