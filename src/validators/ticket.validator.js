const { AppError } = require('../errors/AppError');
const { chuanHoaSoDienThoai } = require('../domain/phone');

/**
 * Validator đầu vào của luồng L2.
 *
 * Vì sao kiểm tra ở đây thay vì trong Service: validator chỉ lo hình thức
 * (kiểu, độ dài, định dạng) nên không cần CSDL, chạy rất nhanh và test được
 * độc lập. Những kiểm tra cần đọc dữ liệu (trùng số điện thoại, thiết bị có
 * tồn tại) thuộc về Service.
 *
 * Quy ước trả lỗi: ném AppError với `code = 'DU_LIEU_KHONG_HOP_LE'` và
 * `chiTiet` là mảng { truong, lyDo } để route dựng được thông báo theo từng
 * trường cho giao diện.
 */

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// QT-03: serial/IMEI gồm chữ, số, gạch ngang; 6..50 ký tự theo cột VARCHAR(50).
const MA_SERIAL = /^[A-Za-z0-9-]{6,50}$/;

// QT-06: danh sách trạng thái dùng chung cho lọc và chuyển trạng thái.
const TRANG_THAI = ['MOI', 'DA_PHAN_CONG', 'DANG_XU_LY', 'CHO_LINH_KIEN', 'HOAN_TAT', 'DA_DONG', 'DA_HUY'];

/**
 * Tạo một mục lỗi theo trường.
 * @param {string} truong Tên trường trong request.
 * @param {string} lyDo Giải thích ngắn cho người dùng.
 * @returns {{truong: string, lyDo: string}}
 */
function loi(truong, lyDo) {
  return { truong, lyDo };
}

/**
 * Kiểm tra một giá trị có phải số nguyên dương.
 * @param {*} giaTri Giá trị cần kiểm tra.
 * @returns {boolean}
 */
function kiemTraSoNguyenDuong(giaTri) {
  return Number.isInteger(giaTri) && giaTri > 0;
}

/**
 * Kiểm tra và chuẩn hóa dữ liệu khách hàng (QT-01, QT-02).
 *
 * @param {object} [duLieu] Body của request.
 * @param {object} [tuyChon]
 * @param {boolean} [tuyChon.batBuoc=true] true khi tạo mới (bắt buộc họ tên và
 *   số điện thoại); false khi cập nhật (chỉ kiểm tra trường nào được gửi).
 * @returns {{full_name?: string, phone?: string, email?: string|null, address?: string|null}}
 *   Dữ liệu đã trim và chuẩn hóa số điện thoại, sẵn sàng ghi CSDL.
 * @throws {AppError} `DU_LIEU_KHONG_HOP_LE` với `chiTiet` liệt kê từng trường sai.
 */
function kiemTraKhachHang(duLieu = {}, { batBuoc = true } = {}) {
  const dsLoi = [];
  const ketQua = {};

  if (duLieu.full_name !== undefined || batBuoc) {
    const hoTen = typeof duLieu.full_name === 'string' ? duLieu.full_name.trim() : '';
    if (hoTen.length === 0) dsLoi.push(loi('full_name', 'bắt buộc, không được rỗng'));
    else if (hoTen.length > 120) dsLoi.push(loi('full_name', 'tối đa 120 ký tự'));
    else ketQua.full_name = hoTen;
  }

  if (duLieu.phone !== undefined || batBuoc) {
    // QT-02: chuẩn hóa trước khi kiểm tra, nhờ vậy "+8490..." vẫn hợp lệ.
    const soDienThoai = chuanHoaSoDienThoai(duLieu.phone);
    if (!soDienThoai) dsLoi.push(loi('phone', 'phải là 10 chữ số bắt đầu bằng 0'));
    else ketQua.phone = soDienThoai;
  }

  if (duLieu.email !== undefined && duLieu.email !== null && duLieu.email !== '') {
    const email = String(duLieu.email).trim();
    if (email.length > 120) dsLoi.push(loi('email', 'tối đa 120 ký tự'));
    else if (!EMAIL.test(email)) dsLoi.push(loi('email', 'sai định dạng email'));
    else ketQua.email = email;
  } else if (duLieu.email === '' || duLieu.email === null) {
    // Gửi chuỗi rỗng là ý định xóa email, khác với không gửi trường.
    ketQua.email = null;
  }

  if (duLieu.address !== undefined && duLieu.address !== null) {
    const diaChi = String(duLieu.address).trim();
    if (diaChi.length > 255) dsLoi.push(loi('address', 'tối đa 255 ký tự'));
    else ketQua.address = diaChi || null;
  }

  if (dsLoi.length > 0) {
    throw new AppError('DU_LIEU_KHONG_HOP_LE', 'Dữ liệu khách hàng không hợp lệ.', dsLoi);
  }
  return ketQua;
}

/**
 * Kiểm tra dữ liệu tạo phiếu bảo hành (UC3, UC4).
 *
 * Chấp nhận cả snake_case (theo docs/api-contract.md) và camelCase (để không
 * phá vỡ client cũ đã viết theo bản trước). Thiết bị có thể chỉ định bằng
 * `device_id` hoặc `serial_no` — cả hai đều hợp lệ theo QT-03.
 *
 * @param {object} [duLieu] Body của request.
 * @returns {object} Dữ liệu chuẩn hóa với khóa snake_case.
 * @throws {AppError} `DU_LIEU_KHONG_HOP_LE` kèm danh sách trường sai.
 */
function kiemTraTiepNhan(duLieu = {}) {
  const dsLoi = [];
  const lay = (...ten) => {
    for (const khoa of ten) {
      if (duLieu[khoa] !== undefined && duLieu[khoa] !== null && duLieu[khoa] !== '') {
        return duLieu[khoa];
      }
    }
    return undefined;
  };

  const customerId = Number(lay('customer_id', 'customerId'));
  const centerId = Number(lay('center_id', 'centerId'));
  const categoryId = Number(lay('category_id', 'categoryId'));

  if (!kiemTraSoNguyenDuong(customerId)) dsLoi.push(loi('customer_id', 'phải là số nguyên dương'));
  if (!kiemTraSoNguyenDuong(centerId)) dsLoi.push(loi('center_id', 'phải là số nguyên dương'));
  if (!kiemTraSoNguyenDuong(categoryId)) dsLoi.push(loi('category_id', 'phải là số nguyên dương'));

  // QT-03: thiết bị xác định bằng device_id (khách đã có hồ sơ thiết bị) hoặc
  // serial_no (nhân viên đọc serial trên máy). Thiếu cả hai là lỗi dữ liệu.
  const deviceIdRaw = lay('device_id', 'deviceId');
  const serialRaw = lay('serial_no', 'serialNo');
  let deviceId = null;
  let serialNo = null;

  if (deviceIdRaw !== undefined) {
    const so = Number(deviceIdRaw);
    if (!kiemTraSoNguyenDuong(so)) dsLoi.push(loi('device_id', 'phải là số nguyên dương'));
    else deviceId = so;
  } else if (serialRaw !== undefined) {
    if (typeof serialRaw !== 'string' || !MA_SERIAL.test(serialRaw.trim())) {
      dsLoi.push(loi('serial_no', 'chữ, số, gạch ngang; dài 6-50 ký tự'));
    } else {
      serialNo = serialRaw.trim();
    }
  } else {
    dsLoi.push(loi('device_id', 'bắt buộc device_id hoặc serial_no'));
  }

  const issueDesc = lay('issue_desc', 'issueDesc');
  if (typeof issueDesc !== 'string' || issueDesc.trim().length === 0) {
    dsLoi.push(loi('issue_desc', 'bắt buộc, không được rỗng'));
  } else if (issueDesc.trim().length > 2000) {
    dsLoi.push(loi('issue_desc', 'tối đa 2000 ký tự'));
  }

  // QT-04: mức ưu tiên chỉ nhận ba giá trị vì mỗi giá trị ứng với một SLA khác nhau.
  const priority = lay('priority');
  if (!['CAO', 'TRUNG_BINH', 'THAP'].includes(priority)) {
    dsLoi.push(loi('priority', 'chỉ nhận CAO, TRUNG_BINH hoặc THAP'));
  }

  // NFR4: loại yêu cầu là dữ liệu cấu hình, hiện hỗ trợ hai giá trị.
  const requestType = lay('request_type', 'requestType') || 'BAO_HANH';
  if (!['BAO_HANH', 'DOI_TRA'].includes(requestType)) {
    dsLoi.push(loi('request_type', 'chỉ nhận BAO_HANH hoặc DOI_TRA'));
  }

  const requestId = lay('request_id', 'requestId');
  if (requestId !== undefined) {
    if (typeof requestId !== 'string' || requestId.trim().length === 0) {
      dsLoi.push(loi('request_id', 'không được rỗng nếu được gửi'));
    } else if (requestId.trim().length > 100) {
      dsLoi.push(loi('request_id', 'tối đa 100 ký tự'));
    }
  }

  if (dsLoi.length > 0) {
    throw new AppError(
      'DU_LIEU_KHONG_HOP_LE',
      `Dữ liệu vào không hợp lệ ở các trường: ${dsLoi.map((muc) => muc.truong).join(', ')}`,
      dsLoi,
    );
  }

  const isWarranty = lay('is_warranty', 'isWarranty');

  return {
    customer_id: customerId,
    device_id: deviceId,
    serial_no: serialNo,
    center_id: centerId,
    category_id: categoryId,
    issue_desc: issueDesc.trim(),
    priority,
    request_type: requestType,
    request_id: requestId ? requestId.trim() : null,
    // Chỉ nhận boolean thật; chuỗi "true" sẽ bị coi là không gửi để tránh
    // hiểu nhầm do client gửi form-data.
    is_warranty: typeof isWarranty === 'boolean' ? isWarranty : undefined,
  };
}

/**
 * Kiểm tra tham số lọc của `GET /tickets` (UC5).
 *
 * @param {object} [query] `req.query`.
 * @returns {{status?: string, dueBefore?: string, centerId?: number, page: number, pageSize: number}}
 * @throws {AppError} `DU_LIEU_KHONG_HOP_LE` khi tham số sai kiểu hoặc ngoài dải.
 */
function kiemTraBoLoc(query = {}) {
  const dsLoi = [];
  const ketQua = {};

  if (query.status !== undefined && query.status !== '') {
    if (!TRANG_THAI.includes(query.status)) dsLoi.push(loi('status', 'không thuộc danh sách trạng thái'));
    else ketQua.status = query.status;
  }

  if (query.due_before !== undefined && query.due_before !== '') {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(query.due_before) || Number.isNaN(Date.parse(query.due_before))) {
      dsLoi.push(loi('due_before', 'phải theo định dạng YYYY-MM-DD'));
    } else {
      ketQua.dueBefore = query.due_before;
    }
  }

  if (query.center_id !== undefined && query.center_id !== '') {
    const centerId = Number(query.center_id);
    if (!kiemTraSoNguyenDuong(centerId)) dsLoi.push(loi('center_id', 'phải là số nguyên dương'));
    else ketQua.centerId = centerId;
  }

  const page = query.page === undefined ? 1 : Number(query.page);
  if (!Number.isInteger(page) || page < 1) dsLoi.push(loi('page', 'phải là số nguyên >= 1'));
  else ketQua.page = page;

  // Chặn page_size = 1000 để một request không kéo cả bảng, giữ NFR1.
  const pageSize = query.page_size === undefined ? 20 : Number(query.page_size);
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) {
    dsLoi.push(loi('page_size', 'phải là số nguyên từ 1 đến 100'));
  } else {
    ketQua.pageSize = pageSize;
  }

  if (dsLoi.length > 0) {
    throw new AppError('DU_LIEU_KHONG_HOP_LE', 'Tham số lọc không hợp lệ.', dsLoi);
  }
  return ketQua;
}

/**
 * Kiểm tra dữ liệu chuyển trạng thái (UC6, QT-06).
 *
 * Chỉ kiểm tra hình thức; việc chuyển có hợp lệ theo vòng đời hay không do
 * Service quyết định vì cần biết trạng thái hiện tại trong CSDL.
 *
 * @param {object} [duLieu] Body của request.
 * @returns {{toStatus: string, note: string|null, expectedStatus: string|null, changedBy: number|null}}
 * @throws {AppError} `DU_LIEU_KHONG_HOP_LE`.
 */
function kiemTraChuyenTrangThai(duLieu = {}) {
  const dsLoi = [];
  const toStatus = duLieu.to_status || duLieu.toStatus;
  if (!TRANG_THAI.includes(toStatus)) {
    dsLoi.push(loi('to_status', 'không thuộc danh sách trạng thái'));
  }

  const note = duLieu.note;
  if (note !== undefined && note !== null && String(note).length > 255) {
    dsLoi.push(loi('note', 'tối đa 255 ký tự'));
  }

  // expected_status là tùy chọn: client gửi để bảo vệ khỏi ghi đè khi hai
  // người cùng mở một phiếu (optimistic locking).
  const expected = duLieu.expected_status || duLieu.expectedStatus;
  if (expected !== undefined && !TRANG_THAI.includes(expected)) {
    dsLoi.push(loi('expected_status', 'không thuộc danh sách trạng thái'));
  }

  if (dsLoi.length > 0) {
    throw new AppError('DU_LIEU_KHONG_HOP_LE', 'Dữ liệu chuyển trạng thái không hợp lệ.', dsLoi);
  }

  return {
    toStatus,
    note: note ? String(note).trim() : null,
    expectedStatus: expected || null,
    changedBy: duLieu.changed_by || duLieu.changedBy || null,
  };
}

module.exports = {
  kiemTraKhachHang,
  kiemTraTiepNhan,
  kiemTraBoLoc,
  kiemTraChuyenTrangThai,
  MA_SERIAL,
  TRANG_THAI,
};
