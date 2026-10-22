const { spawnSync } = require('node:child_process');
const path = require('node:path');

/**
 * Chạy toàn bộ test theo thứ tự và in tổng số test PASS.
 *
 * Vì sao có tệp này thay vì ghép lệnh bằng `&&` trong package.json: giảng viên
 * cần thấy MỘT dòng tổng kết "bao nhiêu test đã qua" đúng như checklist Buổi 10.
 * Tệp này cũng dừng ngay khi một nhóm test lỗi, thay vì chạy tiếp các nhóm sau
 * trên trạng thái đã hỏng.
 *
 * Quy ước: mỗi tệp test in một dòng `[SO-TEST] N` ở cuối. Không dùng cách đếm
 * số dòng `[PASS]` vì một test có thể có nhiều assert.
 */

const CAC_TEP = [
  'tests/smoke-test.js',
  'tests/ticket.service.test.js',
  'tests/ticket.contract.test.js',
  'tests/api.e2e.test.js',
];

let tongTest = 0;

for (const tep of CAC_TEP) {
  const duongDan = path.join(__dirname, '..', tep);
  const ketQua = spawnSync(process.execPath, [duongDan], {
    encoding: 'utf8',
    // Ép chế độ bộ nhớ: test không được phụ thuộc Docker/PostgreSQL.
    env: { ...process.env, CHE_DO_DU_LIEU: 'memory' },
  });

  if (ketQua.stdout) process.stdout.write(ketQua.stdout);
  if (ketQua.stderr) process.stderr.write(ketQua.stderr);

  if (ketQua.status !== 0) {
    console.error(`\n[FAIL] ${tep} dung lai voi ma ${ketQua.status}.`);
    process.exit(1);
  }

  const khop = /\[SO-TEST\]\s+(\d+)/.exec(ketQua.stdout || '');
  if (!khop) {
    console.error(`\n[FAIL] ${tep} khong in dong [SO-TEST] N.`);
    process.exit(1);
  }
  tongTest += Number(khop[1]);
}

console.log(`\nTong ket: ${tongTest} test PASS (${CAC_TEP.length} nhom test).`);
