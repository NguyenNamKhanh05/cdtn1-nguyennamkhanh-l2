const { AppError } = require('../errors/AppError');
const { SLA_GIO, tinhHanCamKet, kiemTraConBaoHanh } = require('../domain/sla');
const { coTheChuyen, laTrangThaiHopLe, danhSachTrangThaiKeTiep } = require('../domain/ticket-status');

/**
 * Service nghiệp vụ của phiếu bảo hành (UC3, UC4, UC5, UC6).
 *
 * Vì sao đặt quy tắc ở đây thay vì ở route: route chỉ biết HTTP, repository
 * chỉ biết SQL. Nếu nhét QT vào route thì không test được bằng unit test và
 * không tái sử dụng được khi thêm giao diện khác (mobile, job định kỳ).
 *
 * Lớp này KHÔNG biết `req`, `res`, mã HTTP hay câu SQL nào.
 */
class DichVuPhieu {
  /**
   * @param {object} repository Cài đặt repository (PostgreSQL hoặc bộ nhớ).
   * @param {() => Date} [dongHo] Hàm lấy thời gian hiện tại. Tách ra để test
   *   có thể cố định thời gian, tránh test "lúc chạy được lúc không" vào Chủ nhật.
   */
  constructor(repository, dongHo = () => new Date()) {
    this.repository = repository;
    this.dongHo = dongHo;
  }

  /**
   * Sinh hạn cam kết theo QT-04 (CAO 24h, TRUNG_BINH 72h, THAP 120h).
   *
   * @param {Date} ngayTiepNhan Thời điểm tiếp nhận phiếu.
   * @param {'CAO'|'TRUNG_BINH'|'THAP'} mucUuTien Mức ưu tiên.
   * @returns {Date} Hạn cam kết, đã loại ngày Chủ nhật.
   * @throws {AppError} `UU_TIEN_KHONG_HOP_LE` khi mức ưu tiên sai — route đổi
   *   thành HTTP 400 để client biết sửa dữ liệu.
   */
  tinhHanCamKet(ngayTiepNhan, mucUuTien) {
    try {
      return tinhHanCamKet(ngayTiepNhan, mucUuTien);
    } catch (loi) {
      // Chuyển lỗi domain thành AppError để lớp route dịch được sang HTTP.
      if (loi.code === 'UU_TIEN_KHONG_HOP_LE') {
        throw new AppError('UU_TIEN_KHONG_HOP_LE', 'Mức độ ưu tiên không hợp lệ.');
      }
      throw loi;
    }
  }

  /**
   * Kiểm tra thiết bị còn bảo hành tại thời điểm tiếp nhận (QT-05).
   *
   * @param {object} thietBi Bản ghi thiết bị, cần `purchase_date` và `warranty_months`.
   * @param {Date} ngayTiepNhan Ngày tiếp nhận.
   * @returns {{conBaoHanh: boolean|null, lyDo: string}} `null` = chưa xác minh.
   */
  kiemTraConBaoHanh(thietBi, ngayTiepNhan) {
    return kiemTraConBaoHanh(thietBi, ngayTiepNhan);
  }

  /**
   * Tạo phiếu bảo hành mới (UC3), lưu phân loại (UC4) và sinh hạn cam kết (US5).
   *
   * Thứ tự kiểm tra có chủ đích: khách hàng -> thiết bị -> quyền sở hữu ->
   * trùng request -> danh mục -> trùng phiếu mở. Kiểm tra cái rẻ và phổ biến
   * trước để tránh truy vấn CSDL không cần thiết khi dữ liệu sai.
   *
   * @param {object} duLieu Dữ liệu đã được validator chuẩn hóa.
   * @param {number} duLieu.customer_id Mã khách hàng đã tồn tại.
   * @param {number|null} duLieu.device_id Mã thiết bị (nếu client biết trước).
   * @param {string|null} duLieu.serial_no Serial/IMEI (dùng khi chưa có device_id).
   * @param {number} duLieu.center_id Trung tâm tiếp nhận.
   * @param {number} duLieu.category_id Nhóm sự cố đang active.
   * @param {string} duLieu.issue_desc Mô tả lỗi, 1..2000 ký tự.
   * @param {'CAO'|'TRUNG_BINH'|'THAP'} duLieu.priority Mức ưu tiên.
   * @param {'BAO_HANH'|'DOI_TRA'} [duLieu.request_type] Mặc định `BAO_HANH`.
   * @param {string|null} [duLieu.request_id] Khóa chống tạo trùng (NFR4).
   * @param {boolean} [duLieu.is_warranty] Ghi đè kết quả QT-05 (quản lý phê duyệt).
   * @returns {Promise<object>} Bản ghi phiếu vừa tạo, `status = 'MOI'`.
   *   Nếu `request_id` đã xử lý, trả phiếu cũ kèm cờ `la_phieu_cu = true`.
   *   Nếu thiếu ngày mua (QT-05), kèm `canh_bao_bao_hanh = 'CHUA_XAC_MINH_BAO_HANH'`
   *   và `can_quan_ly_phe_duyet = true` để giao diện biết cần duyệt.
   * @throws {AppError} `KHACH_KHONG_TON_TAI`, `THIET_BI_KHONG_TON_TAI`,
   *   `THIET_BI_KHONG_THUOC_KHACH`, `NHOM_SU_CO_KHONG_TON_TAI`,
   *   `TRUNG_TAM_KHONG_TON_TAI`, `PHIEU_DANG_MO`, `UU_TIEN_KHONG_HOP_LE`.
   */
  async taoPhieu(duLieu) {
    const khachHang = await this.repository.timKhachHangTheoId(duLieu.customer_id);
    if (!khachHang) {
      throw new AppError('KHACH_KHONG_TON_TAI', 'Không tìm thấy khách hàng với mã đã cho.');
    }

    // QT-03: thiết bị được xác định duy nhất bằng serial hoặc IMEI, nên chấp
    // nhận cả hai cách tra: theo khóa nội bộ hoặc theo serial khách đọc trên máy.
    let thietBi = null;
    if (duLieu.device_id) {
      thietBi = await this.repository.timThietBiTheoId(duLieu.device_id);
    } else if (duLieu.serial_no) {
      thietBi = await this.repository.timThietBiTheoSerial(duLieu.serial_no);
    }
    if (!thietBi) {
      throw new AppError('THIET_BI_KHONG_TON_TAI', 'Không tìm thấy thiết bị.');
    }

    // QT-03: một thiết bị chỉ thuộc một khách hàng tại một thời điểm.
    if (thietBi.customer_id !== khachHang.customer_id) {
      throw new AppError('THIET_BI_KHONG_THUOC_KHACH', 'Thiết bị không thuộc về khách hàng này.');
    }

    // NFR4: client gửi lại cùng request_id (do mất mạng) phải nhận lại đúng
    // phiếu cũ, không được tạo phiếu thứ hai. Kiểm tra trước khi ghi để không
    // phải dựa vào bắt lỗi UNIQUE của CSDL.
    if (duLieu.request_id) {
      const daXuLy = await this.repository.timPhieuTheoRequestId(duLieu.request_id);
      if (daXuLy) {
        return { ...daXuLy, la_phieu_cu: true };
      }
    }

    // NFR4/QT-08 nền tảng: nhóm sự cố phải tồn tại và đang active. Kiểm tra
    // is_active để danh mục ngừng dùng không bị gán vào phiếu mới.
    const nhomSuCo = await this.repository.timNhomSuCo(duLieu.category_id);
    if (!nhomSuCo) {
      throw new AppError('NHOM_SU_CO_KHONG_TON_TAI', 'Nhóm sự cố không tồn tại hoặc đã ngừng sử dụng.');
    }

    const trungTam = await this.repository.timTrungTam(duLieu.center_id);
    if (!trungTam) {
      throw new AppError('TRUNG_TAM_KHONG_TON_TAI', 'Không tìm thấy trung tâm bảo hành.');
    }

    // QD-01 (quy định bổ sung, không thuộc QT-01..QT-15): một thiết bị không nên
    // có hai phiếu đang mở cùng lúc. Nếu không chặn, kỹ thuật viên có thể sửa
    // trùng một máy ở hai phiếu và lịch sử bảo hành sẽ sai.
    const phieuDangMo = await this.repository.timPhieuDangMoTheoSerial(thietBi.serial_no);
    if (phieuDangMo) {
      throw new AppError('PHIEU_DANG_MO', `Thiết bị ${thietBi.serial_no} đã có phiếu đang xử lý.`);
    }

    const ngayTiepNhan = this.dongHo();
    const ketQuaBaoHanh = this.kiemTraConBaoHanh(thietBi, ngayTiepNhan);
    const dueDate = this.tinhHanCamKet(ngayTiepNhan, duLieu.priority);

    // QT-05: thiếu ngày mua -> chưa xác minh. Cột is_warranty là NOT NULL nên
    // phải quy null về false, nhưng ý nghĩa "chưa xác minh" vẫn được giữ ở
    // ketQuaBaoHanh.lyDo để lớp trên yêu cầu quản lý phê duyệt.
    const isWarranty = duLieu.is_warranty !== undefined
      ? duLieu.is_warranty
      : ketQuaBaoHanh.conBaoHanh;

    const phieu = await this.repository.taoPhieu({
      customer_id: khachHang.customer_id,
      device_id: thietBi.device_id,
      center_id: trungTam.center_id,
      request_type: duLieu.request_type || 'BAO_HANH',
      issue_desc: duLieu.issue_desc,
      category_id: nhomSuCo.category_id,
      priority: duLieu.priority,
      received_at: ngayTiepNhan.toISOString(),
      due_date: dueDate.toISOString(),
      is_warranty: isWarranty === null ? false : isWarranty,
      request_id: duLieu.request_id || null,
    });

    // QT-05: thiếu ngày mua thì KHÔNG được im lặng coi là hết bảo hành. Trả
    // thêm cờ cảnh báo để giao diện biết cần quản lý phê duyệt. Cột is_warranty
    // vẫn là false vì DDL đặt NOT NULL; cờ này giữ lại ngữ nghĩa "chưa xác minh".
    if (ketQuaBaoHanh.conBaoHanh === null) {
      return {
        ...phieu,
        canh_bao_bao_hanh: ketQuaBaoHanh.lyDo,
        can_quan_ly_phe_duyet: true,
      };
    }
    return phieu;
  }

  /**
   * Lấy danh sách phiếu có lọc và phân trang (UC5, US6).
   *
   * @param {object} [boLoc]
   * @param {string} [boLoc.status] Lọc theo trạng thái.
   * @param {string} [boLoc.dueBefore] Ngày `YYYY-MM-DD`; lấy phiếu hạn trước ngày này.
   * @param {number} [boLoc.centerId] Lọc theo trung tâm (QT-14).
   * @param {number} [boLoc.page] Trang, bắt đầu từ 1.
   * @param {number} [boLoc.pageSize] Số dòng mỗi trang, 1..100.
   * @returns {Promise<{rows: object[], total: number}>} Danh sách và tổng số dòng
   *   khớp điều kiện (cần cho phân trang ở giao diện).
   */
  async lietKePhieu(boLoc = {}) {
    return this.repository.lietKePhieu(boLoc);
  }

  /**
   * Lấy một phiếu theo mã; ném lỗi nếu không có.
   *
   * @param {number} ticketId Mã phiếu.
   * @returns {Promise<object>} Bản ghi phiếu.
   * @throws {AppError} `PHIEU_KHONG_TON_TAI`.
   */
  async timPhieuTheoId(ticketId) {
    const phieu = await this.repository.timPhieuTheoId(ticketId);
    if (!phieu) throw new AppError('PHIEU_KHONG_TON_TAI', 'Không tìm thấy phiếu.');
    return phieu;
  }

  /**
   * Lấy lịch sử chuyển trạng thái của một phiếu (UC6).
   *
   * @param {number} ticketId Mã phiếu.
   * @returns {Promise<object[]>} Các dòng log, cũ nhất trước.
   * @throws {AppError} `PHIEU_KHONG_TON_TAI` nếu phiếu không tồn tại.
   */
  async lichSuTrangThai(ticketId) {
    await this.timPhieuTheoId(ticketId);
    return this.repository.lietKeLichSuTrangThai(ticketId);
  }

  /**
   * Cập nhật các trường cho phép sửa của phiếu.
   *
   * Chỉ sửa nội dung mô tả/phân loại; KHÔNG cho sửa trạng thái ở đây vì mọi
   * chuyển trạng thái phải đi qua `chuyenTrangThai` để ghi log (QT-06).
   *
   * @param {number} ticketId Mã phiếu.
   * @param {object} duLieu Các trường cần cập nhật; trường bỏ trống giữ nguyên.
   * @returns {Promise<object>} Phiếu sau cập nhật.
   * @throws {AppError} `PHIEU_KHONG_TON_TAI`.
   */
  async capNhatPhieu(ticketId, duLieu) {
    await this.timPhieuTheoId(ticketId);
    const ketQua = await this.repository.capNhatPhieu(ticketId, duLieu);
    if (!ketQua) throw new AppError('PHIEU_KHONG_TON_TAI', 'Không tìm thấy phiếu.');
    return ketQua;
  }

  /**
   * Chuyển trạng thái phiếu theo QT-06 và ghi lịch sử.
   *
   * Kiểm tra vòng đời ở Service (không phải ở CSDL) vì đây là quy tắc nghiệp
   * vụ, và thông báo lỗi cần nêu rõ trạng thái kế tiếp hợp lệ cho người dùng.
   *
   * @param {number} ticketId Mã phiếu.
   * @param {object} duLieu
   * @param {string} duLieu.toStatus Trạng thái muốn chuyển tới.
   * @param {string|null} [duLieu.note] Ghi chú xử lý, tối đa 255 ký tự.
   * @param {number|null} [duLieu.changedBy] Mã người thực hiện.
   * @param {string|null} [duLieu.expectedStatus] Nếu client gửi kèm, hệ thống
   *   kiểm tra trạng thái hiện tại vẫn đúng như client thấy (chống ghi đè khi
   *   hai người cùng thao tác) — trả `TRANG_THAI_DA_THAY_DOI`.
   * @returns {Promise<{ticket_id: number, from_status: string, to_status: string,
   *   changed_at: string, changed_by: number}>} Kết quả chuyển trạng thái.
   * @throws {AppError} `PHIEU_KHONG_TON_TAI`, `TRANG_THAI_KHONG_HOP_LE`,
   *   `CHUYEN_TRANG_THAI_KHONG_HOP_LE`, `TRANG_THAI_DA_THAY_DOI`.
   */
  async chuyenTrangThai(ticketId, duLieu) {
    const phieu = await this.timPhieuTheoId(ticketId);

    if (!laTrangThaiHopLe(duLieu.toStatus)) {
      throw new AppError('TRANG_THAI_KHONG_HOP_LE', 'Trạng thái đích không hợp lệ.');
    }

    // QT-06: không được quay lại trạng thái trước và không được nhảy cóc.
    if (!coTheChuyen(phieu.status, duLieu.toStatus)) {
      throw new AppError(
        'CHUYEN_TRANG_THAI_KHONG_HOP_LE',
        `Không thể chuyển từ ${phieu.status} sang ${duLieu.toStatus}.`,
        { tu_trang_thai: phieu.status, trang_thai_ke_tiep: danhSachTrangThaiKeTiep(phieu.status) },
      );
    }

    const ketQua = await this.repository.chuyenTrangThai(ticketId, {
      toStatus: duLieu.toStatus,
      note: duLieu.note,
      changedBy: duLieu.changedBy || 1,
      expectedStatus: duLieu.expectedStatus,
    });

    // Repository trả mã lỗi thay vì ném, vì nó đã rollback transaction và
    // không nên quyết định thông báo nghiệp vụ.
    if (ketQua.loi === 'KHONG_TIM_THAY') {
      throw new AppError('PHIEU_KHONG_TON_TAI', 'Không tìm thấy phiếu.');
    }
    if (ketQua.loi === 'TRANG_THAI_DA_THAY_DOI') {
      throw new AppError('TRANG_THAI_DA_THAY_DOI', 'Trạng thái phiếu đã thay đổi bởi request khác.');
    }

    return {
      ticket_id: ketQua.phieu.ticket_id,
      from_status: ketQua.tuTrangThai,
      to_status: ketQua.phieu.status,
      changed_at: new Date().toISOString(),
      changed_by: duLieu.changedBy || 1,
    };
  }

  /**
   * Từ chối xóa phiếu — QT-13.
   *
   * Cố ý không có tham số "xóa mềm": QT-13 chỉ cho đánh dấu ngừng sử dụng, và
   * với phiếu thì cách đúng là chuyển sang `DA_HUY`, việc đó đã có trong QT-06.
   * Giữ hàm này để endpoint DELETE trả lỗi rõ ràng thay vì 404 khó hiểu.
   *
   * @param {number} ticketId Mã phiếu.
   * @throws {AppError} `PHIEU_KHONG_TON_TAI` hoặc `KHONG_DUOC_XOA_PHIEU`.
   */
  async xoaPhieu(ticketId) {
    await this.timPhieuTheoId(ticketId);
    throw new AppError('KHONG_DUOC_XOA_PHIEU', 'Không được xóa vật lý phiếu; hãy chuyển sang DA_HUY.');
  }

  /**
   * Danh mục nhóm sự cố đang hoạt động.
   *
   * @returns {Promise<object[]>} Danh sách nhóm sự cố sắp theo mã.
   */
  async lietKeNhomSuCo() {
    return this.repository.lietKeNhomSuCo();
  }

  /**
   * Danh mục trung tâm bảo hành.
   *
   * @returns {Promise<object[]>} Danh sách trung tâm sắp theo mã.
   */
  async lietKeTrungTam() {
    return this.repository.lietKeTrungTam();
  }

  /**
   * Danh mục kỹ thuật viên đang hoạt động (dữ liệu tham chiếu cho luồng L4).
   *
   * @returns {Promise<object[]>} Kỹ thuật viên kèm tên trung tâm.
   */
  async lietKeKyThuatVien() {
    return this.repository.lietKeKyThuatVien();
  }
}

module.exports = { DichVuPhieu, SLA_GIO };
