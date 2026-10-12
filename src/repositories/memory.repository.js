// Repository trong bo nho phuc vu demo va unit test; API that co the thay bang PostgreSQL.
class BoNhoRepository {
  constructor({ khachHangs = [], thietBis = [], phieus = [] } = {}) {
    this.khachHangs = [...khachHangs];
    this.thietBis = [...thietBis];
    this.phieus = [...phieus];
  }

  async timKhachHangTheoId(customerId) {
    return this.khachHangs.find((khachHang) => khachHang.customer_id === customerId) || null;
  }

  async timKhachHangTheoSoDienThoai(phone) {
    return this.khachHangs.find((khachHang) => khachHang.phone === phone) || null;
  }

  async lietKeKhachHang() {
    return [...this.khachHangs];
  }

  async taoKhachHang(duLieu) {
    const customerId = this.khachHangs.length + 1;
    const khachHang = { customer_id: customerId, ...duLieu };
    this.khachHangs.push(khachHang);
    return khachHang;
  }

  async capNhatKhachHang(customerId, duLieu) {
    const viTri = this.khachHangs.findIndex((khachHang) => khachHang.customer_id === customerId);
    if (viTri < 0) return null;
    this.khachHangs[viTri] = { ...this.khachHangs[viTri], ...duLieu, customer_id: customerId };
    return this.khachHangs[viTri];
  }

  async xoaKhachHang(customerId) {
    const viTri = this.khachHangs.findIndex((khachHang) => khachHang.customer_id === customerId);
    if (viTri < 0) return false;
    this.khachHangs.splice(viTri, 1);
    return true;
  }

  async timThietBiTheoId(deviceId) {
    return this.thietBis.find((thietBi) => thietBi.device_id === deviceId) || null;
  }

  async timPhieuTheoSerial(serialNo) {
    return this.phieus.filter((phieu) => phieu.serial_no === serialNo);
  }

  async timPhieuTheoId(ticketId) {
    return this.phieus.find((phieu) => phieu.ticket_id === ticketId) || null;
  }

  async lietKePhieu() {
    return [...this.phieus];
  }

  async taoPhieu(duLieu) {
    const ticketId = this.phieus.length + 1;
    const phieu = {
      ticket_id: ticketId,
      ticket_code: `BH-${String(ticketId).padStart(6, '0')}/2026`,
      status: 'MOI',
      received_at: new Date().toISOString(),
      ...duLieu,
    };
    this.phieus.push(phieu);
    return phieu;
  }

  async capNhatPhieu(ticketId, duLieu) {
    const viTri = this.phieus.findIndex((phieu) => phieu.ticket_id === ticketId);
    if (viTri < 0) return null;
    this.phieus[viTri] = { ...this.phieus[viTri], ...duLieu, ticket_id: ticketId };
    return this.phieus[viTri];
  }

  async xoaPhieu(ticketId) {
    const viTri = this.phieus.findIndex((phieu) => phieu.ticket_id === ticketId);
    if (viTri < 0) return false;
    this.phieus.splice(viTri, 1);
    return true;
  }
}

module.exports = { BoNhoRepository };
