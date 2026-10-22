/**
 * Repository trong bộ nhớ — cùng interface với `PhieuRepository` nhưng không
 * cần PostgreSQL.
 *
 * Vì sao tồn tại hai cài đặt: unit test và chế độ demo cần chạy được trên máy
 * không có Docker. Điều kiện để cách này đúng là cả hai phải giữ CÙNG hợp đồng
 * (tên hàm, kiểu trả về); nếu lệch, test sẽ xanh mà chạy thật lại lỗi.
 *
 * Khác biệt có chủ ý so với bản PostgreSQL:
 * - Không có transaction: mọi thao tác đã là đồng bộ trên một mảng trong RAM.
 * - Không mô phỏng khóa dòng (`FOR UPDATE`) vì test chạy tuần tự.
 * - Dữ liệu mất khi tắt tiến trình — đúng như mong đợi ở chế độ demo.
 */
class BoNhoRepository {
  /**
   * @param {object} [duLieuBanDau]
   * @param {object[]} [duLieuBanDau.khachHangs] Khách hàng có sẵn.
   * @param {object[]} [duLieuBanDau.thietBis] Thiết bị có sẵn.
   * @param {object[]} [duLieuBanDau.phieus] Phiếu có sẵn.
   * @param {object[]} [duLieuBanDau.nhomSuCos] Nhóm sự cố; bỏ trống thì dùng
   *   danh mục mặc định bên dưới.
   * @param {object[]} [duLieuBanDau.trungTams] Trung tâm; bỏ trống thì dùng mặc định.
   * @param {object[]} [duLieuBanDau.lichSus] Lịch sử trạng thái có sẵn; dùng để
   *   chế độ `memory` có cùng dữ liệu lịch sử với seed PostgreSQL.
   */
  constructor({ khachHangs = [], thietBis = [], phieus = [], nhomSuCos = [], trungTams = [], lichSus = [] } = {}) {
    this.khachHangs = [...khachHangs];
    this.thietBis = [...thietBis];
    this.phieus = [...phieus];
    this.lichSus = [...lichSus];
    // Danh mục mặc định để Service kiểm tra được `category_id`/`center_id` mà
    // test không phải dựng dữ liệu danh mục ở mọi chỗ.
    this.nhomSuCos = nhomSuCos.length > 0 ? [...nhomSuCos] : [
      { category_id: 1, category_name: 'MAN_HINH', default_priority: 'CAO', is_active: true },
      { category_id: 2, category_name: 'PIN', default_priority: 'TRUNG_BINH', is_active: true },
      { category_id: 3, category_name: 'SAC', default_priority: 'TRUNG_BINH', is_active: true },
      { category_id: 4, category_name: 'PHAN_MEM', default_priority: 'THAP', is_active: true },
      { category_id: 5, category_name: 'NUOC_VAO', default_priority: 'CAO', is_active: true },
      { category_id: 6, category_name: 'KHAC', default_priority: 'TRUNG_BINH', is_active: true },
    ];
    this.trungTams = trungTams.length > 0 ? [...trungTams] : [
      { center_id: 1, center_code: 'TT01', center_name: 'TTBH Quan 10', city: 'TP. Ho Chi Minh' },
      { center_id: 2, center_code: 'TT02', center_name: 'TTBH Tan Binh', city: 'TP. Ho Chi Minh' },
    ];
  }

  /** Không có tài nguyên cần đóng; giữ hàm để `server.js` gọi thống nhất. */
  async dong() {}

  // ============================================================== KHÁCH HÀNG

  /**
   * @param {number} customerId
   * @returns {Promise<object|null>}
   */
  async timKhachHangTheoId(customerId) {
    return this.khachHangs.find((k) => k.customer_id === customerId) || null;
  }

  /**
   * @param {string} phone Số đã chuẩn hóa.
   * @returns {Promise<object|null>}
   */
  async timKhachHangTheoSoDienThoai(phone) {
    return this.khachHangs.find((k) => k.phone === phone) || null;
  }

  /** @returns {Promise<object[]>} */
  async lietKeKhachHang() {
    return [...this.khachHangs];
  }

  /**
   * Thêm khách hàng với mã tự tăng.
   * @param {object} duLieu
   * @returns {Promise<object>}
   */
  async taoKhachHang(duLieu) {
    const customerId = this.khachHangs.reduce((max, k) => Math.max(max, k.customer_id), 0) + 1;
    const khachHang = { customer_id: customerId, is_active: true, ...duLieu };
    this.khachHangs.push(khachHang);
    return khachHang;
  }

  /**
   * Cập nhật một phần hồ sơ.
   * @param {number} customerId
   * @param {object} duLieu
   * @returns {Promise<object|null>}
   */
  async capNhatKhachHang(customerId, duLieu) {
    const viTri = this.khachHangs.findIndex((k) => k.customer_id === customerId);
    if (viTri < 0) return null;
    this.khachHangs[viTri] = { ...this.khachHangs[viTri], ...duLieu, customer_id: customerId };
    return this.khachHangs[viTri];
  }

  /**
   * Xóa mềm — QT-13: chỉ đặt `is_active = false`, không cắt khỏi mảng.
   * @param {number} customerId
   * @returns {Promise<boolean>}
   */
  async xoaKhachHang(customerId) {
    const viTri = this.khachHangs.findIndex((k) => k.customer_id === customerId);
    if (viTri < 0) return false;
    this.khachHangs[viTri] = { ...this.khachHangs[viTri], is_active: false };
    return true;
  }

  // ================================================================= THIẾT BỊ

  /** @param {number} deviceId @returns {Promise<object|null>} */
  async timThietBiTheoId(deviceId) {
    return this.thietBis.find((t) => t.device_id === deviceId) || null;
  }

  /** @param {string} serialNo @returns {Promise<object|null>} */
  async timThietBiTheoSerial(serialNo) {
    return this.thietBis.find((t) => t.serial_no === serialNo) || null;
  }

  /** @param {object} duLieu @returns {Promise<object>} */
  async taoThietBi(duLieu) {
    const deviceId = this.thietBis.reduce((max, t) => Math.max(max, t.device_id), 0) + 1;
    const thietBi = { device_id: deviceId, ...duLieu };
    this.thietBis.push(thietBi);
    return thietBi;
  }

  /**
   * Thiết bị của một khách (màn hình tiếp nhận).
   *
   * @param {number} customerId
   * @returns {Promise<object[]>} Mảng rỗng nếu khách chưa có thiết bị.
   */
  async lietKeThietBiTheoKhachHang(customerId) {
    return this.thietBis.filter((t) => t.customer_id === customerId);
  }

  // =================================================================== DANH MỤC

  /** @param {number} categoryId @returns {Promise<object|null>} */
  async timNhomSuCo(categoryId) {
    return this.nhomSuCos.find((n) => n.category_id === categoryId && n.is_active !== false) || null;
  }

  /** @returns {Promise<object[]>} */
  async lietKeNhomSuCo() {
    return [...this.nhomSuCos];
  }

  /** @param {number} centerId @returns {Promise<object|null>} */
  async timTrungTam(centerId) {
    return this.trungTams.find((t) => t.center_id === centerId) || null;
  }

  /** @returns {Promise<object[]>} */
  async lietKeTrungTam() {
    return [...this.trungTams];
  }

  /** @returns {Promise<object[]>} Chế độ bộ nhớ không có dữ liệu kỹ thuật viên. */
  async lietKeKyThuatVien() {
    return [];
  }

  // ===================================================================== PHIẾU

  /**
   * Gắn tên khách/trung tâm/nhóm sự cố/serial vào phiếu.
   *
   * Vì sao làm ở repository bộ nhớ: bản PostgreSQL dùng JOIN để trả cùng một
   * hình dạng dữ liệu. Nếu bản bộ nhớ trả thiếu trường, giao diện sẽ hiện
   * "undefined" khi chạy test mà vẫn đúng khi chạy Docker — đúng loại lỗi hợp
   * đồng mà buổi 9 cảnh báo.
   *
   * @param {object} phieu Bản ghi phiếu thô.
   * @returns {object} Bản sao có thêm các trường tra cứu.
   * @private
   */
  _moRongPhieu(phieu) {
    const khachHang = this.khachHangs.find((k) => k.customer_id === phieu.customer_id);
    const trungTam = this.trungTams.find((t) => t.center_id === phieu.center_id);
    const nhomSuCo = this.nhomSuCos.find((n) => n.category_id === phieu.category_id);
    const thietBi = this.thietBis.find((t) => t.device_id === phieu.device_id);
    return {
      ...phieu,
      customer_name: khachHang?.full_name ?? null,
      customer_phone: khachHang?.phone ?? null,
      center_name: trungTam?.center_name ?? null,
      category_name: nhomSuCo?.category_name ?? null,
      serial_no: thietBi?.serial_no ?? null,
      purchase_date: thietBi?.purchase_date ?? null,
      warranty_months: thietBi?.warranty_months ?? null,
    };
  }

  /** @param {number} ticketId @returns {Promise<object|null>} */
  async timPhieuTheoId(ticketId) {
    const phieu = this.phieus.find((p) => p.ticket_id === ticketId);
    return phieu ? this._moRongPhieu(phieu) : null;
  }

  /** @param {string} requestId @returns {Promise<object|null>} */
  async timPhieuTheoRequestId(requestId) {
    return this.phieus.find((p) => p.request_id === requestId) || null;
  }

  /**
   * Tìm phiếu đang mở của thiết bị — QD-01.
   * @param {string} serialNo
   * @returns {Promise<object|null>}
   */
  async timPhieuDangMoTheoSerial(serialNo) {
    const thietBi = await this.timThietBiTheoSerial(serialNo);
    if (!thietBi) return null;
    return this.phieus.find(
      (p) => p.device_id === thietBi.device_id
        && !['HOAN_TAT', 'DA_DONG', 'DA_HUY'].includes(p.status),
    ) || null;
  }

  /**
   * Lọc và phân trang trong bộ nhớ, giữ đúng thứ tự sắp xếp như bản SQL
   * (hạn cam kết tăng dần) để kết quả demo ở hai chế độ giống nhau.
   *
   * @param {object} [boLoc]
   * @returns {Promise<{rows: object[], total: number}>}
   */
  async lietKePhieu({ status, dueBefore, centerId, page = 1, pageSize = 20 } = {}) {
    let ds = this.phieus.filter((p) => p.is_active !== false);
    if (status) ds = ds.filter((p) => p.status === status);
    if (dueBefore) ds = ds.filter((p) => new Date(p.due_date) < new Date(`${dueBefore}T23:59:59`));
    if (centerId) ds = ds.filter((p) => p.center_id === centerId);
    ds = [...ds].sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
    const total = ds.length;
    const batDau = (page - 1) * pageSize;
    return { rows: ds.slice(batDau, batDau + pageSize).map((p) => this._moRongPhieu(p)), total };
  }

  /**
   * Tạo phiếu và log trạng thái đầu tiên — NFR3.
   *
   * Ở đây hai thao tác không cần transaction vì JavaScript chạy đơn luồng:
   * không request nào chen vào giữa hai lệnh push.
   *
   * @param {object} duLieu
   * @returns {Promise<object>}
   */
  async taoPhieu(duLieu) {
    const ticketId = this.phieus.reduce((max, p) => Math.max(max, p.ticket_id), 0) + 1;
    const nam = new Date(duLieu.received_at).getFullYear();
    const phieu = {
      ticket_id: ticketId,
      ticket_code: `BH-${String(ticketId).padStart(6, '0')}/${nam}`,
      status: 'MOI',
      is_active: true,
      ...duLieu,
    };
    this.phieus.push(phieu);
    this.lichSus.push({
      log_id: this.lichSus.length + 1,
      ticket_id: ticketId,
      from_status: null,
      to_status: 'MOI',
      changed_at: duLieu.received_at,
      changed_by: 1,
      note: 'Tiep nhan phieu moi',
    });
    return phieu;
  }

  /**
   * Cập nhật nội dung phiếu, bỏ qua trường null/undefined để giữ giá trị cũ
   * (tương đương COALESCE ở bản SQL).
   *
   * @param {number} ticketId
   * @param {object} duLieu
   * @returns {Promise<object|null>}
   */
  async capNhatPhieu(ticketId, duLieu) {
    const viTri = this.phieus.findIndex((p) => p.ticket_id === ticketId);
    if (viTri < 0) return null;
    const capNhat = Object.fromEntries(Object.entries(duLieu).filter(([, v]) => v !== undefined && v !== null));
    this.phieus[viTri] = { ...this.phieus[viTri], ...capNhat, ticket_id: ticketId };
    return this.phieus[viTri];
  }

  /**
   * Chuyển trạng thái và ghi log — QT-06.
   *
   * Trả mã lỗi thay vì ném, giống bản PostgreSQL, để Service là nơi duy nhất
   * quyết định thông báo nghiệp vụ.
   *
   * @param {number} ticketId
   * @param {{toStatus: string, note?: string, changedBy?: number, expectedStatus?: string}} duLieu
   * @returns {Promise<{phieu?: object, tuTrangThai?: string, loi?: string}>}
   */
  async chuyenTrangThai(ticketId, { toStatus, note, changedBy, expectedStatus }) {
    const phieu = this.phieus.find((p) => p.ticket_id === ticketId);
    if (!phieu) return { loi: 'KHONG_TIM_THAY' };
    if (expectedStatus && phieu.status !== expectedStatus) {
      return { loi: 'TRANG_THAI_DA_THAY_DOI', phieu };
    }
    const tuTrangThai = phieu.status;
    phieu.status = toStatus;
    // Chỉ DA_DONG mới có thời điểm đóng; các trạng thái khác phải là null để
    // không báo cáo nhầm phiếu đã hoàn tất.
    if (toStatus === 'DA_DONG') phieu.closed_at = new Date().toISOString();
    this.lichSus.push({
      log_id: this.lichSus.length + 1,
      ticket_id: ticketId,
      from_status: tuTrangThai,
      to_status: toStatus,
      changed_at: new Date().toISOString(),
      changed_by: changedBy || 1,
      note: note || null,
    });
    return { phieu, tuTrangThai };
  }

  /** @param {number} ticketId @returns {Promise<object[]>} */
  async lietKeLichSuTrangThai(ticketId) {
    return this.lichSus.filter((l) => l.ticket_id === ticketId);
  }

  /** @returns {Promise<boolean>} Bộ nhớ luôn "kết nối được". */
  async kiemTraKetNoi() {
    return true;
  }
}

module.exports = { BoNhoRepository };
