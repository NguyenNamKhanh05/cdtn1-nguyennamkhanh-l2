/**
 * Lỗi nghiệp vụ có mã, để lớp route dịch sang HTTP.
 *
 * Vì sao không ném thẳng `Error` kèm câu tiếng Việt rồi bắt theo `message`:
 * thông báo có thể đổi câu chữ, còn `code` là hợp đồng ổn định giữa Service và
 * route. Nhờ vậy sửa lời nhắn cho thân thiện hơn không làm vỡ logic trả mã HTTP.
 */
class AppError extends Error {
  /**
   * @param {string} maLoi Mã lỗi dạng SNAKE_CASE, ví dụ `PHIEU_KHONG_TON_TAI`.
   * @param {string} thongBao Câu thông báo hiển thị cho người dùng cuối.
   * @param {*} [chiTiet] Dữ liệu bổ sung (thường là mảng lỗi theo trường hoặc
   *   danh sách trạng thái được phép). Tùy chọn: không truyền thì không có
   *   thuộc tính này, giúp response gọn khi không cần.
   */
  constructor(maLoi, thongBao, chiTiet = undefined) {
    super(thongBao);
    this.name = 'AppError';
    this.code = maLoi;
    if (chiTiet !== undefined) this.chiTiet = chiTiet;
  }
}

module.exports = { AppError };
