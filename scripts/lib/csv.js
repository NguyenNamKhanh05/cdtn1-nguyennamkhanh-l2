const fs = require('node:fs');
const path = require('node:path');

/**
 * Đọc CSV đơn giản, có hỗ trợ trường trong dấu ngoặc kép và BOM.
 *
 * Vì sao tự viết thay vì dùng thư viện: dữ liệu mẫu chỉ vài chục dòng, định dạng
 * cố định (dấu phẩy, UTF-8). Thêm phụ thuộc chỉ để đọc vài file là không đáng,
 * và giảng viên không phải `npm install` thêm gì khi chạy script này.
 *
 * CẢNH BÁO: hàm này KHÔNG hỗ trợ xuống dòng bên trong một trường có ngoặc kép.
 * Dữ liệu hiện tại không có trường hợp đó; nếu sau này có, phải thay bằng bộ
 * phân tích đầy đủ.
 *
 * @param {string} duongDan Đường dẫn tuyệt đối tới file CSV.
 * @returns {object[]} Mỗi phần tử là một dòng, khóa là tên cột ở dòng tiêu đề.
 *   Dòng trống bị bỏ qua. Giá trị luôn là chuỗi (đã trim), kể cả cột số.
 * @throws {Error} Khi không đọc được file (sai đường dẫn, thiếu quyền).
 */
function docCsv(duongDan) {
  // BOM (\uFEFF) thường xuất hiện khi file được lưu từ Excel; nếu không cắt,
  // tên cột đầu tiên sẽ có ký tự lạ và mọi truy vấn theo cột đó trả undefined.
  const noiDung = fs.readFileSync(duongDan, 'utf8').replace(/^\uFEFF/, '');
  const dong = [];
  let truong = '';
  let trongNgoac = false;
  let hang = [];

  for (let i = 0; i < noiDung.length; i += 1) {
    const kyTu = noiDung[i];
    if (trongNgoac) {
      if (kyTu === '"') {
        // Hai dấu nháy liên tiếp trong ngoặc kép nghĩa là một dấu nháy thật.
        if (noiDung[i + 1] === '"') {
          truong += '"';
          i += 1;
        } else {
          trongNgoac = false;
        }
      } else {
        truong += kyTu;
      }
      continue;
    }

    if (kyTu === '"') {
      trongNgoac = true;
    } else if (kyTu === ',') {
      hang.push(truong);
      truong = '';
    } else if (kyTu === '\n') {
      hang.push(truong);
      dong.push(hang);
      hang = [];
      truong = '';
    } else if (kyTu !== '\r') {
      // Bỏ \r để file lưu kiểu Windows (CRLF) cho kết quả giống file LF.
      truong += kyTu;
    }
  }

  // Dòng cuối có thể không kết thúc bằng \n — vẫn phải lấy.
  if (truong !== '' || hang.length > 0) {
    hang.push(truong);
    dong.push(hang);
  }

  if (dong.length === 0) return [];
  const tieuDe = dong[0].map((cot) => cot.trim());
  return dong.slice(1)
    .filter((giaTri) => giaTri.some((o) => o.trim() !== ''))
    .map((giaTri) => Object.fromEntries(tieuDe.map((cot, i) => [cot, (giaTri[i] || '').trim()])));
}

module.exports = { docCsv };
