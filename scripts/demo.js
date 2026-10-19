/**
 * Script demo: gọi lần lượt các kịch bản chính của L2 và in kết quả.
 *
 * Vì sao cần script này: khi bảo vệ đồ án, chỉ cần chạy `npm run demo` là thấy
 * toàn bộ luồng hoạt động (tra cứu, tạo lỗi, chuyển trạng thái, phân quyền) mà
 * không phải mở Postman bấm tay từng request.
 *
 * Dùng: `npm run demo` — server phải đang chạy (`npm start`) ở terminal khác.
 * Đổi địa chỉ bằng biến `DEMO_BASE_URL`.
 */

const BASE = process.env.DEMO_BASE_URL || 'http://localhost:3000';

/**
 * Gọi một endpoint và trả về mã HTTP kèm body đã phân tích.
 *
 * @param {'GET'|'POST'|'PUT'|'DELETE'} method Phương thức HTTP.
 * @param {string} duongDan Đường dẫn, ví dụ `/tickets`.
 * @param {object} [body] Body JSON; bỏ trống với GET.
 * @param {Record<string,string>} [headers] Header bổ sung (dùng để giả lập vai trò).
 * @returns {Promise<{status: number, duLieu: *}>} `duLieu` là JSON nếu parse được,
 *   ngược lại là chuỗi thô (ví dụ response 204 rỗng).
 */
async function goi(method, duongDan, body, headers = {}) {
  const tuyChon = { method, headers: { ...headers } };
  if (body !== undefined) {
    tuyChon.headers['Content-Type'] = 'application/json';
    tuyChon.body = JSON.stringify(body);
  }
  const res = await fetch(`${BASE}${duongDan}`, tuyChon);
  const noiDung = await res.text();
  let duLieu;
  try {
    duLieu = JSON.parse(noiDung);
  } catch {
    // Response 204 hoặc lỗi HTML đều không phải JSON; giữ nguyên chuỗi để in ra.
    duLieu = noiDung;
  }
  return { status: res.status, duLieu };
}

/**
 * In kết quả một lần gọi theo định dạng dễ đọc khi demo.
 * @param {string} tieuDe Mô tả kịch bản.
 * @param {{status: number, duLieu: *}} ketQua Kết quả từ `goi`.
 * @returns {void}
 */
function inKetQua(tieuDe, ketQua) {
  console.log(`\n=== ${tieuDe} ===`);
  console.log(`HTTP ${ketQua.status}`);
  console.log(JSON.stringify(ketQua.duLieu, null, 2));
}

/**
 * Chạy toàn bộ kịch bản demo theo thứ tự.
 *
 * Thứ tự có chủ ý: các thao tác ĐỌC chạy trước để thấy dữ liệu gốc, sau đó mới
 * chuyển trạng thái phiếu 1 — nếu đảo lại, các bước đọc phía sau sẽ thấy dữ
 * liệu đã bị thay đổi và khó đối chiếu với ảnh chụp màn hình.
 *
 * @returns {Promise<void>}
 */
async function chay() {
  inKetQua('1. Kiem tra he thong', await goi('GET', '/health'));

  inKetQua('2. Danh sach phieu (3 phieu seed)', await goi('GET', '/tickets'));

  inKetQua('3. Tra cuu khach hang theo so dien thoai (QT-02 chuan hoa +84)', await goi('GET', '/customers?phone=%2B84901234567'));

  inKetQua('4. Du lieu sai: serial rong -> 400', await goi('POST', '/tickets', { serialNo: '' }));

  inKetQua('5. Du lieu sai: thieu truong bat buoc -> 400', await goi('POST', '/tickets', { customer_id: 1 }));

  inKetQua('6. Danh muc nhom su co', await goi('GET', '/issue-categories'));

  inKetQua('7. Danh muc trung tam bao hanh', await goi('GET', '/service-centers'));

  inKetQua('8. Danh muc ky thuat vien', await goi('GET', '/technicians'));

  inKetQua('9. QT-15: che so dien thoai voi vai tro nhan vien', await goi('GET', '/customers?phone=0901234567'));

  inKetQua('10. QT-15: quan ly xem duoc so day du', await goi('GET', '/customers?phone=0901234567', undefined, { 'X-User-Role': 'quan_ly' }));

  // Chọn phiếu đang MOI thay vì hard-code /tickets/1: sau lần demo đầu, phiếu 1
  // đã sang DA_PHAN_CONG nên chạy lại sẽ báo lỗi. Tìm động giúp script chạy
  // được nhiều lần mà không cần reset dữ liệu.
  const dsMoi = await goi('GET', '/tickets?status=MOI');
  const phieuMoi = Array.isArray(dsMoi.duLieu?.data) ? dsMoi.duLieu.data[0] : null;

  if (phieuMoi) {
    const id = phieuMoi.ticket_id;
    inKetQua(`11. QT-06: chuyen trang thai hop le (phieu ${id})`, await goi('POST', `/tickets/${id}/transitions`, { to_status: 'DA_PHAN_CONG', note: 'Demo chuyen trang thai' }));

    // Lần này phiếu đã ở DA_PHAN_CONG, nên DA_PHAN_CONG -> DA_PHAN_CONG là
    // bước không hợp lệ theo QT-06 — đúng ý đồ minh họa.
    inKetQua('12. QT-06: chuyen trang thai khong hop le -> 400', await goi('POST', `/tickets/${id}/transitions`, { to_status: 'DA_PHAN_CONG' }));

    inKetQua(`13. Lich su trang thai phieu ${id}`, await goi('GET', `/tickets/${id}/history`));
  } else {
    console.log('\n=== 11-13. Bo qua: khong con phieu nao o trang thai MOI ===');
    console.log('Chay "npm run db:reset && npm run setup" de dua du lieu ve ban goc.');
  }

  inKetQua('14. Loc phieu theo trang thai', await goi('GET', '/tickets?status=MOI'));
}

chay().catch((loi) => {
  // Lỗi hay gặp nhất là chưa bật server, nên nói rõ thay vì in stack trace.
  console.error('Khong goi duoc API. Hay chay "npm start" o terminal khac truoc.');
  console.error(loi.message);
  process.exitCode = 1;
});
