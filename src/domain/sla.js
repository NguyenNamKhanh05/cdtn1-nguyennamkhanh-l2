/**
 * Quy tắc tính hạn cam kết và kiểm tra bảo hành (QT-04, QT-05).
 *
 * Module này là "domain thuần": không truy cập cơ sở dữ liệu, không biết HTTP,
 * nên có thể kiểm thử bằng unit test mà không cần PostgreSQL.
 */

/**
 * Số giờ cam kết theo mức ưu tiên — QT-04.
 *
 * Vì sao dùng hằng số thay vì đọc từ CSDL: QT-04 là quy tắc nghiệp vụ cố định,
 * nằm trong SRS. Nếu sau này cần thay đổi theo hợp đồng dịch vụ thì đây là
 * điểm sửa duy nhất, và mọi test sẽ phát hiện nếu giá trị bị lệch.
 */
const SLA_GIO = { CAO: 24, TRUNG_BINH: 72, THAP: 120 };

const UU_TIEN_HOP_LE = Object.keys(SLA_GIO);

/**
 * Kiểm tra một mốc thời gian có rơi vào Chủ nhật hay không.
 *
 * @param {Date} ngay Mốc thời gian cần kiểm tra.
 * @returns {boolean} true nếu là Chủ nhật.
 */
function laChuNhat(ngay) {
  // getDay(): 0 = Chủ nhật. Dùng giờ địa phương vì nghiệp vụ tính theo lịch Việt Nam.
  return ngay.getDay() === 0;
}

/**
 * Sinh hạn cam kết từ thời điểm tiếp nhận theo QT-04.
 *
 * Quy tắc: CAO = 24 giờ, TRUNG_BINH = 72 giờ, THAP = 120 giờ.
 * "Chỉ tính ngày làm việc (thứ Hai đến thứ Bảy)" được hiện thực bằng cách
 * cộng từng giờ và KHÔNG đếm những giờ rơi vào Chủ nhật.
 *
 * Ví dụ: tiếp nhận 10:00 thứ Bảy, mức CAO (24 giờ) -> 10:00 thứ Hai, vì
 * 24 giờ đó bị đẩy qua ngày Chủ nhật không làm việc.
 *
 * @param {Date} ngayTiepNhan Thời điểm tiếp nhận phiếu.
 * @param {'CAO'|'TRUNG_BINH'|'THAP'} mucUuTien Mức ưu tiên của phiếu.
 * @returns {Date} Thời điểm chậm nhất phải hoàn tất phiếu.
 * @throws {Error} Lỗi có `code = 'UU_TIEN_KHONG_HOP_LE'` khi mức ưu tiên
 *   không thuộc ba giá trị hợp lệ. Đây là lỗi dữ liệu, không phải lỗi hệ thống.
 */
function tinhHanCamKet(ngayTiepNhan, mucUuTien) {
  const soGio = SLA_GIO[mucUuTien];
  if (!soGio) {
    const loi = new Error('Mức độ ưu tiên không hợp lệ.');
    loi.code = 'UU_TIEN_KHONG_HOP_LE';
    throw loi;
  }

  // Bản sao để không làm thay đổi Date đầu vào của người gọi.
  const han = new Date(ngayTiepNhan.getTime());
  let conLai = soGio;

  // CẢNH BÁO: vòng lặp cộng từng giờ là O(số giờ) — tối đa 120 vòng nên rẻ.
  // Nếu sau này SLA tính theo tháng/năm thì phải đổi sang thuật toán theo ngày,
  // nếu không sẽ chậm và khó kiểm soát giờ nghỉ.
  while (conLai > 0) {
    han.setTime(han.getTime() + 60 * 60 * 1000);
    if (!laChuNhat(han)) conLai -= 1;
  }
  return han;
}

/**
 * Kiểm tra thiết bị còn trong thời hạn bảo hành hay không (QT-05).
 *
 * Quy tắc: còn bảo hành nếu (ngày tiếp nhận − ngày mua) ≤ số tháng bảo hành.
 *
 * @param {{purchase_date?: string|null, warranty_months?: number}} thietBi
 *   Bản ghi thiết bị. `purchase_date` là chuỗi `YYYY-MM-DD` hoặc null.
 * @param {Date} ngayTiepNhan Ngày tiếp nhận, dùng làm mốc so sánh.
 * @returns {{conBaoHanh: boolean|null, lyDo: string}}
 *   `conBaoHanh = null` khi CHƯA XÁC MINH được vì thiếu ngày mua; khi đó
 *   `lyDo = 'CHUA_XAC_MINH_BAO_HANH'` và phiếu cần quản lý phê duyệt.
 * @throws {RangeError} Khi `warranty_months` là số âm — dữ liệu hỏng.
 */
function kiemTraConBaoHanh(thietBi, ngayTiepNhan) {
  const soThang = Number(thietBi.warranty_months ?? 12);
  if (!Number.isFinite(soThang) || soThang < 0) {
    throw new RangeError('Số tháng bảo hành không hợp lệ.');
  }

  // QT-05: thiếu ngày mua thì không kết luận được, phải trả null thay vì false.
  // Trả false sẽ khiến hệ thống coi như hết hạn và từ chối oan cho khách.
  if (!thietBi.purchase_date) {
    return { conBaoHanh: null, lyDo: 'CHUA_XAC_MINH_BAO_HANH' };
  }

  const ngayHetHan = new Date(thietBi.purchase_date);
  ngayHetHan.setMonth(ngayHetHan.getMonth() + soThang);

  // Dùng "≤" vì SRS ghi rõ ngày cuối cùng vẫn còn bảo hành (biên TC-02).
  const conBaoHanh = ngayTiepNhan <= ngayHetHan;
  return { conBaoHanh, lyDo: conBaoHanh ? 'CON_BAO_HANH' : 'HET_BAO_HANH' };
}

module.exports = { SLA_GIO, UU_TIEN_HOP_LE, tinhHanCamKet, kiemTraConBaoHanh, laChuNhat };
