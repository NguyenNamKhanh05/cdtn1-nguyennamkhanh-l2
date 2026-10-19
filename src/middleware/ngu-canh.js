const { cheSoDienThoai } = require('../domain/phone');

/**
 * Ngữ cảnh người dùng cho QT-14 và QT-15.
 *
 * Vì sao dùng header thay vì JWT: BT2 mới hiện thực luồng nghiệp vụ, chưa có
 * module đăng nhập. Header cho phép chứng minh quy tắc phân quyền hoạt động mà
 * không phải dựng cả hệ thống xác thực. Khi có JWT, chỉ cần thay hàm
 * `docNguCanh` — các hàm kiểm tra bên dưới giữ nguyên.
 */

const VAI_TRO = ['nhan_vien', 'quan_ly', 'ban_giam_doc'];

/**
 * Đọc vai trò và trung tâm từ header của request.
 *
 * @param {import('express').Request} req Request Express.
 * @returns {{vaiTro: 'nhan_vien'|'quan_ly'|'ban_giam_doc', centerId: number|null}}
 *   Giá trị lạ được quy về `nhan_vien` (quyền thấp nhất) theo nguyên tắc
 *   "mặc định từ chối".
 */
function docNguCanh(req) {
  const vaiTro = String(req.get('x-user-role') || 'nhan_vien').trim().toLowerCase();
  const centerIdRaw = req.get('x-center-id');
  const centerId = centerIdRaw ? Number(centerIdRaw) : null;

  return {
    vaiTro: VAI_TRO.includes(vaiTro) ? vaiTro : 'nhan_vien',
    centerId: Number.isInteger(centerId) && centerId > 0 ? centerId : null,
  };
}

/**
 * Kiểm tra người dùng có được xem dữ liệu của một trung tâm hay không (QT-14).
 *
 * Nhân viên chỉ xem trung tâm mình; quản lý và ban giám đốc xem rộng hơn.
 * Khi request không khai báo trung tâm, hàm cho qua để không chặn demo —
 * đánh đổi có chủ ý, sẽ siết lại khi có đăng nhập thật.
 *
 * @param {{vaiTro: string, centerId: number|null}} nguCanh Ngữ cảnh người dùng.
 * @param {number} centerId Trung tâm của dữ liệu cần xem.
 * @returns {boolean} true nếu được phép.
 */
function coTheXemTrungTam(nguCanh, centerId) {
  if (!centerId) return true;
  if (nguCanh.vaiTro === 'ban_giam_doc') return true;
  if (nguCanh.vaiTro === 'quan_ly') return true;
  if (nguCanh.centerId === null) return true;
  return nguCanh.centerId === centerId;
}

/**
 * Kiểm tra người dùng có được xem số điện thoại đầy đủ (QT-15).
 *
 * @param {{vaiTro: string}} nguCanh Ngữ cảnh người dùng.
 * @returns {boolean} true chỉ với Quản lý và Ban giám đốc.
 */
function duocXemSoDayDu(nguCanh) {
  return nguCanh.vaiTro === 'quan_ly' || nguCanh.vaiTro === 'ban_giam_doc';
}

/**
 * Che số điện thoại theo quyền của người xem (QT-15).
 *
 * @param {{vaiTro: string}} nguCanh Ngữ cảnh người dùng.
 * @param {object|null} khachHang Bản ghi khách hàng.
 * @returns {object|null} Bản sao đã che số nếu không đủ quyền.
 */
function cheTheoQuyen(nguCanh, khachHang) {
  if (!khachHang || duocXemSoDayDu(nguCanh)) return khachHang;
  return { ...khachHang, phone: cheSoDienThoai(khachHang.phone) };
}

/**
 * Middleware gắn ngữ cảnh người dùng vào request.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {void}
 */
function ganNguCanh(req, res, next) {
  req.nguCanh = docNguCanh(req);
  next();
}

module.exports = {
  VAI_TRO,
  docNguCanh,
  coTheXemTrungTam,
  duocXemSoDayDu,
  cheTheoQuyen,
  ganNguCanh,
};
