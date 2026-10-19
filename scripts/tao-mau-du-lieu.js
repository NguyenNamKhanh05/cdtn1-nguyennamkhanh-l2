const fs = require('node:fs');
const path = require('node:path');

/**
 * Tạo lại bộ CSV mẫu nhỏ trong `data/sample` từ bộ dữ liệu đầy đủ `dataset/`.
 *
 * Vì sao cần script: `dataset/` bị gitignore (dữ liệu lớn), nhưng repo vẫn phải
 * có đủ danh mục để `npm run seed` chạy được sau khi clone. Script này là cách
 * tái tạo `data/sample` một cách có kiểm soát, thay vì chép tay và làm sai encoding.
 *
 * Dùng: `node scripts/tao-mau-du-lieu.js` (chỉ khi có thư mục `dataset/`).
 */

const GOC = path.resolve(__dirname, '..');
const NGUON = path.join(GOC, 'dataset');
const DICH = path.join(GOC, 'data', 'sample');

/**
 * Đọc file thành mảng dòng, bỏ BOM và dòng trống.
 * @param {string} filePath Đường dẫn file.
 * @returns {string[]} Các dòng, dòng đầu là tiêu đề.
 */
function docDong(filePath) {
  const noiDung = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
  return noiDung.split(/\r?\n/).filter((dong) => dong.trim() !== '');
}

/**
 * Ghi mảng dòng ra file UTF-8, luôn kết thúc bằng một dòng trống cuối file.
 * @param {string} tenFile Tên file trong `data/sample`.
 * @param {string[]} dong Nội dung file (đã gồm tiêu đề).
 * @returns {void}
 */
function ghi(tenFile, dong) {
  const dich = path.join(DICH, tenFile);
  fs.writeFileSync(dich, `${dong.join('\n')}\n`, 'utf8');
  console.log(`Da ghi ${tenFile}: ${dong.length - 1} dong du lieu`);
}

/**
 * Lấy `soDong` dòng dữ liệu đầu tiên, GIỮ LẠI dòng tiêu đề.
 * @param {string} tenFile Tên file nguồn trong `dataset/`.
 * @param {number} soDong Số dòng dữ liệu muốn lấy.
 * @returns {string[]}
 */
function trich(tenFile, soDong) {
  const dong = docDong(path.join(NGUON, tenFile));
  return dong.slice(0, soDong + 1);
}

// Danh mục lấy toàn bộ (nhỏ); dữ liệu giao dịch chỉ lấy mẫu để repo gọn.
// Phần tử thứ ba là tên file đích khi khác tên nguồn.
const viec = [
  ['service_centers.csv', null],
  ['issue_categories.csv', null],
  ['technicians.csv', null],
  ['technician_skills.csv', null],
  ['customers_raw.csv', 100, 'customers_sample.csv'],
  ['tickets_history.csv', 100, 'tickets_history_sample.csv'],
  ['ticket_status_log.csv', 200, 'ticket_status_log_sample.csv'],
];

for (const [nguon, soDong, tenDich] of viec) {
  const duongDanNguon = path.join(NGUON, nguon);
  // Bỏ qua thay vì lỗi: người dùng có thể không có `dataset/` và chỉ cần xem mã.
  if (!fs.existsSync(duongDanNguon)) {
    console.warn(`Bo qua ${nguon}: khong tim thay`);
    continue;
  }
  const dong = soDong === null ? docDong(duongDanNguon) : trich(nguon, soDong);
  ghi(tenDich || nguon, dong);
}
