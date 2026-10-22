/**
 * Phiên đăng nhập mô phỏng cho giao diện.
 *
 * Vì sao chưa có JWT: backend BT2 mới hiện thực luồng L2, chưa có module xác
 * thực. Giao diện lưu vai trò/trung tâm đã chọn và gửi qua header, đúng với
 * middleware `src/middleware/ngu-canh.js`. Khi có đăng nhập thật, chỉ cần thay
 * phần đọc/ghi phiên ở tệp này — các màn hình không phải sửa.
 */

const KHOA_PHIEN = 'cdtn1.phien';

/**
 * Đọc phiên đang lưu trong sessionStorage.
 *
 * @returns {{vaiTro: string, centerId: number|null, tenHienThi: string}|null}
 *   `null` khi chưa đăng nhập hoặc dữ liệu lưu bị hỏng.
 */
export function docPhien() {
  try {
    const duLieu = JSON.parse(sessionStorage.getItem(KHOA_PHIEN) || 'null');
    if (!duLieu || !duLieu.vaiTro) return null;
    return duLieu;
  } catch {
    // sessionStorage có thể bị chặn ở chế độ riêng tư; coi như chưa đăng nhập
    // thay vì làm trắng cả ứng dụng.
    return null;
  }
}

/**
 * Lưu phiên sau khi người dùng chọn vai trò.
 *
 * @param {{vaiTro: string, centerId: number|null, tenHienThi: string}} phien
 * @returns {void}
 */
export function luuPhien(phien) {
  sessionStorage.setItem(KHOA_PHIEN, JSON.stringify(phien));
}

/**
 * Xóa phiên (đăng xuất hoặc khi API trả 401).
 *
 * @returns {void}
 */
export function xoaPhien() {
  sessionStorage.removeItem(KHOA_PHIEN);
}

/**
 * Tên tiếng Việt của vai trò để hiển thị trên thanh điều hướng.
 *
 * @param {string} vaiTro Mã vai trò từ middleware.
 * @returns {string} Nhãn thân thiện.
 */
export function nhanVaiTro(vaiTro) {
  const nhan = {
    nhan_vien: 'Nhân viên tiếp nhận',
    quan_ly: 'Quản lý trung tâm',
    ban_giam_doc: 'Ban giám đốc',
  };
  return nhan[vaiTro] || vaiTro;
}
