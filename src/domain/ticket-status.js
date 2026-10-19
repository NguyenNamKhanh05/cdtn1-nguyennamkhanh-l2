/**
 * Vòng đời trạng thái phiếu bảo hành — QT-06.
 *
 * QT-06 quy định phiếu chỉ được chuyển theo đúng vòng đời và KHÔNG được quay
 * lại trạng thái trước. Bảng chuyển đổi dưới đây là nguồn duy nhất cho quy tắc
 * này, cả Service lẫn test đều đọc từ đây để tránh hai bản logic lệch nhau.
 */

/**
 * Danh sách trạng thái hợp lệ, đúng thứ tự vòng đời trong SRS.
 * @type {string[]}
 */
const TRANG_THAI = [
  'MOI',
  'DA_PHAN_CONG',
  'DANG_XU_LY',
  'CHO_LINH_KIEN',
  'HOAN_TAT',
  'DA_DONG',
  'DA_HUY',
];

/**
 * Bảng chuyển đổi hợp lệ: từ trạng thái khóa -> các trạng thái được phép đến.
 *
 * Vì sao không dùng ma trận NxN: bảng kề chỉ liệt kê cạnh có thật, đọc nhanh
 * hơn và không tạo ảo giác về những chuyển đổi không tồn tại.
 *
 * Lưu ý nghiệp vụ: DA_HUY chỉ đi từ các trạng thái còn đang xử lý; HOAN_TAT
 * không hủy được nữa vì hàng đã sửa xong, và DA_DONG/DA_HUY là trạng thái cuối.
 */
const CHUYEN_HOP_LE = {
  MOI: ['DA_PHAN_CONG', 'DA_HUY'],
  DA_PHAN_CONG: ['DANG_XU_LY', 'DA_HUY'],
  DANG_XU_LY: ['CHO_LINH_KIEN', 'HOAN_TAT', 'DA_HUY'],
  // CHO_LINH_KIEN quay lại DANG_XU_LY là hợp lệ vì linh kiện đã về, phiếu tiếp tục xử lý.
  CHO_LINH_KIEN: ['DANG_XU_LY', 'HOAN_TAT', 'DA_HUY'],
  HOAN_TAT: ['DA_DONG'],
  DA_DONG: [],
  DA_HUY: [],
};

/**
 * Kiểm tra một chuỗi có phải trạng thái hợp lệ hay không.
 *
 * @param {string} trangThai Giá trị cần kiểm tra.
 * @returns {boolean} true nếu thuộc danh sách trạng thái của QT-06.
 */
function laTrangThaiHopLe(trangThai) {
  return TRANG_THAI.includes(trangThai);
}

/**
 * Kiểm tra một bước chuyển trạng thái có được phép theo QT-06 hay không.
 *
 * @param {string} tuTrangThai Trạng thái hiện tại của phiếu.
 * @param {string} denTrangThai Trạng thái muốn chuyển tới.
 * @returns {boolean} true nếu là bước chuyển hợp lệ.
 */
function coTheChuyen(tuTrangThai, denTrangThai) {
  return (CHUYEN_HOP_LE[tuTrangThai] || []).includes(denTrangThai);
}

/**
 * Liệt kê các trạng thái kế tiếp hợp lệ, dùng để trả về trong thông báo lỗi
 * giúp người dùng biết nên chọn gì thay vì chỉ báo "không hợp lệ".
 *
 * @param {string} tuTrangThai Trạng thái hiện tại.
 * @returns {string[]} Mảng trạng thái kế tiếp; rỗng nếu là trạng thái cuối.
 */
function danhSachTrangThaiKeTiep(tuTrangThai) {
  return CHUYEN_HOP_LE[tuTrangThai] || [];
}

module.exports = {
  TRANG_THAI,
  CHUYEN_HOP_LE,
  laTrangThaiHopLe,
  coTheChuyen,
  danhSachTrangThaiKeTiep,
};
