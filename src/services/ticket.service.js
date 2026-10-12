const { AppError } = require('../errors/AppError');

// QT-04: SLA tinh theo muc uu tien, don vi la gio.
const SLA_GIO = { CAO: 24, TRUNG_BINH: 72, THAP: 120 };

class DichVuPhieu {
  constructor(repository, dongHo = () => new Date()) {
    this.repository = repository;
    this.dongHo = dongHo;
  }

  // QT-05: kiem tra thiet bi con bao hanh tai thoi diem tiep nhan.
  kiemTraConBaoHanh(thietBi, ngayTiepNhan) {
    if (!thietBi.purchase_date) {
      return { conBaoHanh: null, lyDo: 'CHUA_XAC_MINH_BAO_HANH' };
    }

    const ngayHetHan = new Date(thietBi.purchase_date);
    ngayHetHan.setMonth(ngayHetHan.getMonth() + thietBi.warranty_months);
    const conBaoHanh = ngayTiepNhan <= ngayHetHan;
    return { conBaoHanh, lyDo: conBaoHanh ? 'CON_BAO_HANH' : 'HET_BAO_HANH' };
  }

  // QT-04: sinh han cam ket tu muc uu tien, khong de routes tu tinh.
  tinhHanCamKet(ngayTiepNhan, mucUuTien) {
    const soGio = SLA_GIO[mucUuTien];
    if (!soGio) {
      throw new AppError('UU_TIEN_KHONG_HOP_LE', 'Muc do uu tien khong hop le.');
    }
    return new Date(ngayTiepNhan.getTime() + soGio * 60 * 60 * 1000);
  }

  async taoPhieu(duLieu) {
    const khachHang = await this.repository.timKhachHangTheoId(duLieu.customerId);
    if (!khachHang) {
      throw new AppError('KHACH_KHONG_TON_TAI', 'Khong tim thay khach hang voi ma da cho.');
    }

    const thietBi = await this.repository.timThietBiTheoId(duLieu.deviceId);
    if (!thietBi) {
      throw new AppError('THIET_BI_KHONG_TON_TAI', 'Khong tim thay thiet bi.');
    }
    if (thietBi.customer_id !== khachHang.customer_id) {
      throw new AppError('THIET_BI_KHONG_THUOC_KHACH', 'Thiet bi khong thuoc ve khach hang nay.');
    }

    // QT-09: mot serial khong duoc co hai phieu dang mo cung luc.
    const phieuCungSerial = await this.repository.timPhieuTheoSerial(duLieu.serialNo);
    const phieuDangMo = phieuCungSerial.find((phieu) => !['HOAN_TAT', 'DA_DONG', 'DA_HUY'].includes(phieu.status));
    if (phieuDangMo) {
      throw new AppError('PHIEU_DANG_MO', `Thiet bi ${duLieu.serialNo} da co phieu dang xu ly.`);
    }

    const ngayTiepNhan = this.dongHo();
    const ketQuaBaoHanh = this.kiemTraConBaoHanh(thietBi, ngayTiepNhan);
    const dueDate = this.tinhHanCamKet(ngayTiepNhan, duLieu.priority);

    return this.repository.taoPhieu({
      ...duLieu,
      serial_no: duLieu.serialNo,
      received_at: ngayTiepNhan.toISOString(),
      due_date: dueDate.toISOString(),
      is_warranty: ketQuaBaoHanh.conBaoHanh,
      warranty_reason: ketQuaBaoHanh.lyDo,
    });
  }

  async lietKePhieu() {
    return this.repository.lietKePhieu();
  }

  async timPhieuTheoId(ticketId) {
    const phieu = await this.repository.timPhieuTheoId(ticketId);
    if (!phieu) throw new AppError('PHIEU_KHONG_TON_TAI', 'Khong tim thay phieu.');
    return phieu;
  }

  async capNhatPhieu(ticketId, duLieu) {
    await this.timPhieuTheoId(ticketId);
    return this.repository.capNhatPhieu(ticketId, duLieu);
  }

  async xoaPhieu(ticketId) {
    await this.timPhieuTheoId(ticketId);
    await this.repository.xoaPhieu(ticketId);
  }
}

module.exports = { DichVuPhieu, SLA_GIO };
