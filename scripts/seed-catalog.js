const fs = require('node:fs');
const path = require('node:path');
const { Client } = require('pg');
const { cauHinh } = require('../src/config/env');
const { docCsv } = require('./lib/csv');

/**
 * Nạp dữ liệu danh mục (trung tâm, nhóm sự cố, kỹ thuật viên, tay nghề).
 *
 * Vì sao cần script riêng: đây là dữ liệu THAM CHIẾU, không phải dữ liệu giao
 * dịch. Trộn vào `seeds/001_seed_demo.sql` sẽ khiến mỗi lần reset dữ liệu demo
 * phải nạp lại cả trăm dòng danh mục. Tách ra thì `npm run seed` chạy nhanh và
 * danh mục có thể cập nhật độc lập.
 *
 * Đặc điểm quan trọng: dùng `ON CONFLICT DO UPDATE` nên chạy lại nhiều lần
 * KHÔNG nhân đôi dữ liệu — yêu cầu bắt buộc để `npm run setup` an toàn.
 *
 * Dùng: `npm run seed:catalog` (được gọi trong `npm run seed`).
 */

const GOC = path.resolve(__dirname, '..');

// Ưu tiên bộ dữ liệu đầy đủ nếu có (máy dev), sau đó mới đến mẫu nhỏ đã commit
// (máy giảng viên chỉ clone repo). Nhờ vậy cùng một script chạy được ở cả hai nơi.
const THU_MUC_DU_LIEU = [
  path.join(GOC, 'dataset'),
  path.join(GOC, 'data', 'sample'),
];

/**
 * Tìm file CSV theo tên, lần lượt trong các thư mục dữ liệu.
 * @param {string} tenFile Tên file, ví dụ `service_centers.csv`.
 * @returns {string|null} Đường dẫn đầu tiên tìm thấy, hoặc null.
 */
function timFile(tenFile) {
  for (const thuMuc of THU_MUC_DU_LIEU) {
    const duongDan = path.join(thuMuc, tenFile);
    if (fs.existsSync(duongDan)) return duongDan;
  }
  return null;
}

/**
 * Chuyển chuỗi CSV sang boolean.
 * @param {string} giaTri Chuỗi `true`/`false` (không phân biệt hoa thường).
 * @returns {boolean}
 */
function sangBool(giaTri) {
  return String(giaTri).trim().toLowerCase() === 'true';
}

/**
 * Chuyển chuỗi CSV sang số nguyên.
 * @param {string} giaTri Chuỗi số.
 * @returns {number|null} null nếu không phải số — để cột nullable nhận NULL
 *   thay vì NaN (pg sẽ báo lỗi khi gặp NaN).
 */
function soNguyen(giaTri) {
  const so = Number.parseInt(String(giaTri).trim(), 10);
  return Number.isNaN(so) ? null : so;
}

/**
 * Nạp toàn bộ danh mục trong một transaction.
 *
 * Thứ tự nạp có phụ thuộc: `technician` tham chiếu `service_center`, và
 * `technician_skill` tham chiếu cả `technician` lẫn `issue_category`. Nếu đảo
 * thứ tự, khóa ngoại sẽ chặn và script thất bại.
 *
 * @param {import('pg').Client} client Kết nối đang trong transaction.
 * @returns {Promise<object>} Số dòng đã nạp theo từng bảng, dùng để in log.
 */
async function napDanhMuc(client) {
  const ketQua = {};

  const fileTrungTam = timFile('service_centers.csv');
  if (fileTrungTam) {
    const dong = docCsv(fileTrungTam);
    for (const o of dong) {
      await client.query(
        `INSERT INTO service_center (center_id, center_code, center_name, city)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (center_id) DO UPDATE
           SET center_code = EXCLUDED.center_code,
               center_name = EXCLUDED.center_name,
               city = EXCLUDED.city`,
        [soNguyen(o.center_id), o.center_code, o.center_name, o.thanh_pho],
      );
    }
    ketQua.service_center = dong.length;
  }

  const fileNhomSuCo = timFile('issue_categories.csv');
  if (fileNhomSuCo) {
    const dong = docCsv(fileNhomSuCo);
    for (const o of dong) {
      await client.query(
        `INSERT INTO issue_category (category_id, category_name, default_priority, is_active)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (category_id) DO UPDATE
           SET category_name = EXCLUDED.category_name,
               default_priority = EXCLUDED.default_priority,
               is_active = EXCLUDED.is_active`,
        [soNguyen(o.category_id), o.category_name, o.default_priority, sangBool(o.is_active)],
      );
    }
    ketQua.issue_category = dong.length;
  }

  const fileKyThuatVien = timFile('technicians.csv');
  if (fileKyThuatVien) {
    const dong = docCsv(fileKyThuatVien);
    for (const o of dong) {
      await client.query(
        `INSERT INTO technician (technician_id, technician_code, full_name, center_id, level, is_active)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (technician_id) DO UPDATE
           SET technician_code = EXCLUDED.technician_code,
               full_name = EXCLUDED.full_name,
               center_id = EXCLUDED.center_id,
               level = EXCLUDED.level,
               is_active = EXCLUDED.is_active`,
        [
          soNguyen(o.technician_id),
          o.technician_code,
          o.ho_ten,
          soNguyen(o.center_id),
          o.level,
          sangBool(o.is_active),
        ],
      );
    }
    ketQua.technician = dong.length;
  }

  const fileTayNghe = timFile('technician_skills.csv');
  if (fileTayNghe) {
    const dong = docCsv(fileTayNghe);
    for (const o of dong) {
      await client.query(
        `INSERT INTO technician_skill (technician_id, category_id, proficiency)
         VALUES ($1, $2, $3)
         ON CONFLICT (technician_id, category_id) DO UPDATE
           SET proficiency = EXCLUDED.proficiency`,
        [soNguyen(o.technician_id), soNguyen(o.category_id), soNguyen(o.proficiency)],
      );
    }
    ketQua.technician_skill = dong.length;
  }

  // Lưới an toàn: nếu bộ dữ liệu không có file kỹ thuật viên thì vẫn phải có
  // danh mục tối thiểu, nếu không màn hình phân công ở L4 sẽ trống và người
  // chấm tưởng API hỏng.
  const { rows } = await client.query('SELECT count(*)::int AS so_luong FROM technician');
  if (rows[0].so_luong === 0) {
    await client.query(
      `INSERT INTO technician (technician_code, full_name, center_id, level)
       SELECT 'KT-DEMO-' || c.center_id, 'Ky thuat vien ' || c.center_id, c.center_id, 'TRUNG_CAP'
       FROM service_center c
       ON CONFLICT (technician_code) DO NOTHING`,
    );
    ketQua.technician = 'demo';
  }

  // CẢNH BÁO: các INSERT trên ghi ID lấy từ CSV (1, 2, 3...) nên sequence của
  // BIGSERIAL không tự tăng. Không setval thì bản ghi tạo qua API sau này sẽ
  // nhận nextval = 1 và vi phạm khóa chính. Đây là lỗi chỉ lộ ra khi dùng thật.
  for (const [bang, cot] of [
    ['service_center', 'center_id'],
    ['issue_category', 'category_id'],
    ['technician', 'technician_id'],
  ]) {
    await client.query(
      `SELECT setval(
         pg_get_serial_sequence('${bang}', '${cot}'),
         GREATEST((SELECT COALESCE(max(${cot}), 1) FROM ${bang}), 1),
         true
       )`,
    );
  }

  return ketQua;
}

/**
 * Điểm vào: mở kết nối, nạp danh mục trong một transaction, đóng kết nối.
 * @returns {Promise<void>}
 */
async function chay() {
  const client = new Client(cauHinh.db);
  await client.connect();
  try {
    await client.query('BEGIN');
    const ketQua = await napDanhMuc(client);
    await client.query('COMMIT');
    console.log('Da nap du lieu danh muc:', JSON.stringify(ketQua));
  } catch (loi) {
    // Rollback để không để lại danh mục nạp dở (ví dụ có trung tâm nhưng
    // chưa có kỹ thuật viên).
    await client.query('ROLLBACK');
    throw loi;
  } finally {
    await client.end();
  }
}

chay().catch((loi) => {
  console.error(`Loi nap danh muc: ${loi.message}`);
  process.exitCode = 1;
});
