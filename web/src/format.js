/**
 * Hàm định dạng dùng chung cho giao diện.
 *
 * Vì sao tách khỏi component: cùng một ngày được hiển thị ở danh sách, chi tiết
 * và lịch sử. Nếu mỗi nơi tự gọi `toLocaleString` thì chỉ cần một chỗ quên
 * `vi-VN` là giao diện trộn định dạng Mỹ/Việt, rất khó phát hiện khi chấm.
 */

const dinhDangNgay = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const dinhDangNgayGio = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

/**
 * Định dạng ngày kèm giờ theo kiểu Việt Nam.
 *
 * @param {string|null} iso Chuỗi ISO 8601 từ hợp đồng API.
 * @returns {string} Chuỗi hiển thị, hoặc `—` khi không có ngày.
 */
export function ngayGio(iso) {
  if (!iso) return '—';
  const ngay = new Date(iso);
  return Number.isNaN(ngay.getTime()) ? '—' : dinhDangNgayGio.format(ngay);
}

/**
 * Định dạng chỉ ngày (dùng cho ngày mua, hạn cam kết).
 *
 * @param {string|null} iso Chuỗi ISO 8601.
 * @returns {string} `dd/mm/yyyy`, hoặc `—`.
 */
export function ngayThang(iso) {
  if (!iso) return '—';
  const ngay = new Date(iso);
  return Number.isNaN(ngay.getTime()) ? '—' : dinhDangNgay.format(ngay);
}

/**
 * Mô tả khoảng cách tới hạn cam kết bằng lời, để người dùng biết mức khẩn.
 *
 * @param {string} iso Hạn cam kết dạng ISO.
 * @param {boolean} daKetThuc Phiếu đã ở trạng thái kết thúc hay chưa.
 * @returns {{text: string, mucDo: 'qua-han'|'sap-den'|'binh-thuong'|'ket-thuc'}}
 */
export function moTaHan(iso, daKetThuc = false) {
  if (daKetThuc) return { text: 'Đã kết thúc', mucDo: 'ket-thuc' };
  if (!iso) return { text: 'Chưa có hạn', mucDo: 'binh-thuong' };

  // QT-04: hạn cam kết tính bằng giờ, nên hiển thị theo giờ sẽ dễ hành động
  // hơn là chỉ hiện ngày — nhân viên cần biết còn 3 giờ hay còn 3 ngày.
  const conLaiMs = new Date(iso).getTime() - Date.now();
  const conLaiGio = Math.round(conLaiMs / (3600 * 1000));

  if (conLaiMs < 0) {
    const quaHan = Math.abs(conLaiGio);
    return { text: `Quá hạn ${quaHan} giờ`, mucDo: 'qua-han' };
  }
  if (conLaiGio < 1) return { text: 'Còn dưới 1 giờ', mucDo: 'sap-den' };
  if (conLaiGio <= 8) return { text: `Còn ${conLaiGio} giờ`, mucDo: 'sap-den' };
  // Dưới một ngày thì hiện giờ, không hiện "Còn 0 ngày" — con số 0 gây hiểu
  // nhầm là đã hết hạn trong khi phiếu vẫn còn gần một ngày.
  if (conLaiGio < 24) return { text: `Còn ${conLaiGio} giờ`, mucDo: 'binh-thuong' };
  return { text: `Còn ${Math.floor(conLaiGio / 24)} ngày`, mucDo: 'binh-thuong' };
}

/**
 * Lớp CSS của trạng thái để màu sắc nhất quán giữa danh sách và chi tiết.
 *
 * @param {string} status Mã trạng thái (MOI, DANG_XU_LY...).
 * @returns {string} Tên lớp CSS.
 */
export function lopTrangThai(status) {
  return `badge badge-${String(status || '').toLowerCase()}`;
}

/**
 * Lớp CSS của mức ưu tiên.
 *
 * @param {string} priority CAO | TRUNG_BINH | THAP.
 * @returns {string} Tên lớp CSS.
 */
export function lopUuTien(priority) {
  return `badge badge-priority-${String(priority || '').toLowerCase()}`;
}
