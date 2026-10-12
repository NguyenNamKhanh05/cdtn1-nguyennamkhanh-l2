const { AppError } = require('../errors/AppError');

// Service khach hang giu quy tac trung so dien thoai, khong phu thuoc HTTP.
class DichVuKhachHang {
  constructor(repository) {
    this.repository = repository;
  }

  async lietKe() {
    return this.repository.lietKeKhachHang();
  }

  async timTheoId(customerId) {
    const khachHang = await this.repository.timKhachHangTheoId(customerId);
    if (!khachHang) throw new AppError('KHACH_KHONG_TON_TAI', 'Khong tim thay khach hang.');
    return khachHang;
  }

  async timTheoSoDienThoai(phone) {
    const khachHang = await this.repository.timKhachHangTheoSoDienThoai(phone);
    if (!khachHang) throw new AppError('KHACH_KHONG_TON_TAI', 'Khong tim thay khach hang.');
    return khachHang;
  }

  async tao(duLieu) {
    const daCo = await this.repository.timKhachHangTheoSoDienThoai(duLieu.phone);
    if (daCo) throw new AppError('SO_DIEN_THOAI_DA_TON_TAI', 'So dien thoai da ton tai.');
    return this.repository.taoKhachHang(duLieu);
  }

  async capNhat(customerId, duLieu) {
    await this.timTheoId(customerId);
    if (duLieu.phone) {
      const daCo = await this.repository.timKhachHangTheoSoDienThoai(duLieu.phone);
      if (daCo && daCo.customer_id !== customerId) {
        throw new AppError('SO_DIEN_THOAI_DA_TON_TAI', 'So dien thoai da ton tai.');
      }
    }
    return this.repository.capNhatKhachHang(customerId, duLieu);
  }

  async xoa(customerId) {
    await this.timTheoId(customerId);
    await this.repository.xoaKhachHang(customerId);
  }
}

module.exports = { DichVuKhachHang };
