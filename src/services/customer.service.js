const { AppError } = require('../errors/AppError');

/**
 * Service khách hàng: giữ quy tắc số điện thoại duy nhất (QT-01) và
 * không xóa vật lý hồ sơ (QT-13).
 *
 * Việc chuẩn hóa định dạng số (QT-02) đã làm ở validator, trước khi vào đây.
 * Service chỉ làm phần cần đọc dữ liệu hiện có để kiểm tra trùng.
 */
class DichVuKhachHang {
  /**
   * @param {object} repository Cài đặt repository (PostgreSQL hoặc bộ nhớ).
   */
  constructor(repository) {
    this.repository = repository;
  }

  /**
   * Lấy toàn bộ khách hàng đang hoạt động.
   *
   * @returns {Promise<object[]>} Danh sách khách hàng sắp theo mã.
   */
  async lietKe() {
    return this.repository.lietKeKhachHang();
  }

  /**
   * Lấy khách hàng theo mã.
   *
   * @param {number} customerId Mã khách hàng.
   * @returns {Promise<object>} Bản ghi khách hàng.
   * @throws {AppError} `KHACH_KHONG_TON_TAI` nếu không có hoặc đã ngừng sử dụng.
   */
  async timTheoId(customerId) {
    const khachHang = await this.repository.timKhachHangTheoId(customerId);
    if (!khachHang) throw new AppError('KHACH_KHONG_TON_TAI', 'Không tìm thấy khách hàng.');
    return khachHang;
  }

  /**
   * Tra cứu khách hàng theo số điện thoại đã chuẩn hóa (QT-01, QT-02).
   *
   * @param {string} phone Số 10 chữ số bắt đầu bằng 0 (validator đã chuẩn hóa).
   * @returns {Promise<object>} Bản ghi khách hàng.
   * @throws {AppError} `KHACH_KHONG_TON_TAI` khi số chưa có trong hệ thống —
   *   route đổi thành 404 để giao diện mở form tạo mới (UC2).
   */
  async timTheoSoDienThoai(phone) {
    const khachHang = await this.repository.timKhachHangTheoSoDienThoai(phone);
    if (!khachHang) throw new AppError('KHACH_KHONG_TON_TAI', 'Không tìm thấy khách hàng.');
    return khachHang;
  }

  /**
   * Tạo khách hàng mới (UC2).
   *
   * @param {object} duLieu Dữ liệu đã chuẩn hóa: `full_name`, `phone`, `email?`, `address?`.
   * @returns {Promise<object>} Bản ghi khách hàng vừa tạo.
   * @throws {AppError} `SO_DIEN_THOAI_DA_TON_TAI` — QT-01 yêu cầu trả hồ sơ có
   *   sẵn thay vì tạo bản ghi mới; route đổi thành 409 và giao diện hiển thị
   *   hồ sơ cũ cho nhân viên dùng lại.
   */
  async tao(duLieu) {
    const daCo = await this.repository.timKhachHangTheoSoDienThoai(duLieu.phone);
    if (daCo) throw new AppError('SO_DIEN_THOAI_DA_TON_TAI', 'Số điện thoại đã tồn tại.');
    return this.repository.taoKhachHang(duLieu);
  }

  /**
   * Cập nhật hồ sơ khách hàng.
   *
   * @param {number} customerId Mã khách hàng.
   * @param {object} duLieu Các trường cần đổi; trường không gửi giữ nguyên.
   * @returns {Promise<object>} Khách hàng sau cập nhật.
   * @throws {AppError} `KHACH_KHONG_TON_TAI`, `SO_DIEN_THOAI_DA_TON_TAI`.
   */
  async capNhat(customerId, duLieu) {
    await this.timTheoId(customerId);

    // QT-01: đổi số điện thoại cũng phải giữ tính duy nhất. Bỏ qua chính bản
    // ghi đang sửa, nếu không sẽ tự báo trùng với chính mình.
    if (duLieu.phone) {
      const daCo = await this.repository.timKhachHangTheoSoDienThoai(duLieu.phone);
      if (daCo && daCo.customer_id !== customerId) {
        throw new AppError('SO_DIEN_THOAI_DA_TON_TAI', 'Số điện thoại đã tồn tại.');
      }
    }

    const ketQua = await this.repository.capNhatKhachHang(customerId, duLieu);
    if (!ketQua) throw new AppError('KHACH_KHONG_TON_TAI', 'Không tìm thấy khách hàng.');
    return ketQua;
  }

  /**
   * Ngừng sử dụng hồ sơ khách hàng — QT-13.
   *
   * Không xóa vật lý vì phiếu cũ vẫn tham chiếu tới khách hàng; xóa sẽ làm
   * mất lịch sử bảo hành. Repository chỉ đặt `is_active = false`.
   *
   * @param {number} customerId Mã khách hàng.
   * @returns {Promise<void>}
   * @throws {AppError} `KHACH_KHONG_TON_TAI`.
   */
  async xoa(customerId) {
    await this.timTheoId(customerId);
    await this.repository.xoaKhachHang(customerId);
  }
}

module.exports = { DichVuKhachHang };
