const { spawnSync } = require('node:child_process');

/**
 * Bọc lệnh `docker compose` để thông báo tiến trình hiển thị như văn bản bình
 * thường thay vì lỗi đỏ.
 *
 * Vì sao cần: Docker Compose ghi tiến trình ("Container ... Running") ra
 * stderr. PowerShell hiển thị stderr của tiến trình ngoài bằng chữ đỏ kèm
 * "NativeCommandError", khiến người chấm tưởng `npm run setup` thất bại dù
 * container đã lên bình thường. Script này gộp hai luồng và tự quyết định
 * thành công/thất bại dựa trên mã thoát thật.
 *
 * Dùng: `node scripts/db.js up|down|reset`
 */

/** Ánh xạ tham số dòng lệnh sang tham số của docker compose. */
const LENH = {
  up: ['up', '-d'],
  down: ['down'],
  reset: null, // xử lý riêng: down -v rồi up -d
};

/**
 * Chạy một lệnh và trả về kết quả.
 *
 * @param {string} lenh Tên chương trình, ở đây là `docker`.
 * @param {string[]} thamSo Tham số truyền cho chương trình.
 * @returns {{ok: boolean, output: string}} `output` gồm cả stdout và stderr.
 */
function chay(lenh, thamSo) {
  const ketQua = spawnSync(lenh, thamSo, { encoding: 'utf8', shell: false });
  const output = `${ketQua.stdout || ''}${ketQua.stderr || ''}`.trim();

  // ENOENT = không tìm thấy docker trong PATH (chưa cài Docker Desktop).
  if (ketQua.error && ketQua.error.code === 'ENOENT') {
    return { ok: false, output: 'Khong tim thay lenh "docker" trong PATH.' };
  }
  return { ok: ketQua.status === 0, output };
}

/**
 * In hướng dẫn khi Docker chưa sẵn sàng.
 *
 * Phân biệt hai trường hợp rất khác nhau: chưa cài Docker và đã cài nhưng
 * Docker Desktop chưa bật. Gộp chung sẽ khiến người dùng đi sai hướng.
 *
 * @param {string} output Nội dung lỗi Docker trả về.
 * @returns {void}
 */
function huongDan(output) {
  console.error('Khong khoi dong duoc PostgreSQL bang Docker.');
  if (output.includes('Khong tim thay lenh')) {
    console.error('- Chua cai Docker Desktop. Tai: https://www.docker.com/products/docker-desktop/');
    console.error('- Hoac chay khong can Docker: npm test && $env:CHE_DO_DU_LIEU="memory"; npm start');
    return;
  }
  if (/cannot connect|is the docker daemon running|pipe/i.test(output)) {
    console.error('- Docker Desktop chua chay. Mo Docker Desktop, doi bieu tuong het xoay roi chay lai.');
    return;
  }
  if (/port is already allocated|bind for/i.test(output)) {
    console.error('- Cong 5434 dang bi chiem. Sua DB_PORT trong .env sang cong khac (vi du 5435).');
    return;
  }
  console.error(output);
}

const lenh = process.argv[2];

if (!LENH.hasOwnProperty(lenh)) {
  console.error('Su dung: node scripts/db.js up|down|reset');
  process.exitCode = 1;
} else {
  const danhSach = lenh === 'reset'
    ? [['down', '-v'], ['up', '-d']]
    : [LENH[lenh]];

  let thanhCong = true;
  for (const thamSo of danhSach) {
    const ketQua = chay('docker', ['compose', ...thamSo]);
    if (ketQua.output) console.log(ketQua.output);
    if (!ketQua.ok) {
      huongDan(ketQua.output);
      thanhCong = false;
      break;
    }
  }

  if (thanhCong) {
    console.log(lenh === 'down'
      ? 'Da tat container PostgreSQL.'
      : 'PostgreSQL dang chay tai cong 5434 (container mekong_mobile_db).');
  } else {
    process.exitCode = 1;
  }
}
