/**
 * Chuẩn hóa và che số điện thoại khách hàng — QT-02 và QT-15.
 *
 * Vì sao tách riêng khỏi validator: cùng một quy tắc được dùng ở ba nơi
 * (tra cứu, tạo mới, hiển thị). Nếu viết lại ở mỗi nơi, chỉ cần một chỗ quên
 * là dữ liệu bị lưu sai định dạng và QT-01 (duy nhất) sẽ bị vô hiệu.
 */

/**
 * Chuẩn hóa số điện thoại về dạng 10 chữ số bắt đầu bằng 0 (QT-02).
 *
 * Chấp nhận các dạng người dùng thường nhập:
 * - `0901234567` (đã chuẩn)
 * - `090 123 4567`, `090.123.4567`, `090-123-4567`
 * - `+84901234567`, `84901234567` (tiền tố quốc tế)
 *
 * @param {string} dauVao Chuỗi số điện thoại thô từ người dùng.
 * @returns {string|null} Số đã chuẩn hóa, hoặc `null` nếu không hợp lệ.
 *   Trả `null` thay vì ném lỗi để validator tự quyết định thông báo nào
 *   hiển thị cho người dùng.
 */
function chuanHoaSoDienThoai(dauVao) {
  if (typeof dauVao !== 'string') return null;

  // Bỏ khoảng trắng, dấu chấm, gạch ngang và ngoặc — những ký tự người dùng
  // hay dùng khi đọc số qua điện thoại.
  let so = dauVao.trim().replace(/[\s.\-()]/g, '');
  if (!so) return null;

  // QT-02: +84... và 84... đều phải quy về 0...
  if (so.startsWith('+84')) so = `0${so.slice(3)}`;
  else if (so.startsWith('84') && so.length === 11) so = `0${so.slice(2)}`;

  // Kiểm tra sau khi chuẩn hóa: đúng 10 chữ số và bắt đầu bằng 0.
  return /^0\d{9}$/.test(so) ? so : null;
}

/**
 * Che 4 chữ số cuối của số điện thoại khi hiển thị (QT-15).
 *
 * QT-15 yêu cầu mọi vai trò trừ Quản lý và Ban giám đốc chỉ thấy dạng che,
 * ví dụ `090****567`. Hàm này chỉ xử lý phần hiển thị; quyết định ai được
 * xem đầy đủ nằm ở middleware `ngu-canh`.
 *
 * @param {string} phone Số điện thoại (đã chuẩn hóa hoặc thô).
 * @returns {string} Số đã che, hoặc giữ nguyên nếu không chuẩn hóa được.
 */
function cheSoDienThoai(phone) {
  const so = chuanHoaSoDienThoai(phone);
  if (!so) return phone;

  // QT-15: giữ 3 số đầu và 3 số cuối, che 4 số giữa — đúng ví dụ `090****567`.
  // Không che 4 số cuối vì như vậy vẫn lộ 6/10 chữ số, trong khi quy tắc chỉ
  // cho phép nhận diện đầu số và đuôi để đối chiếu với khách.
  return `${so.slice(0, 3)}****${so.slice(-3)}`;
}

module.exports = { chuanHoaSoDienThoai, cheSoDienThoai };
