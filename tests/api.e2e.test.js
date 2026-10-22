const assert = require('node:assert/strict');
const { once } = require('node:events');
const { createApp } = require('../src/app');

/**
 * Test tích hợp đầu-cuối trên HTTP (Buổi 10).
 *
 * Vì sao cần: test service gọi thẳng hàm nên bỏ qua route, validator, middleware
 * và hợp đồng dữ liệu. Test này dựng app thật, chạy đúng luồng chính
 * "tra khách → thêm thiết bị → tạo phiếu → chuyển trạng thái → xem lịch sử"
 * bằng repository bộ nhớ, nên chạy được trên máy không có Docker.
 *
 * Chạy: `npm test` (được gọi từ tests/run-all.js).
 */

const PHONE_MOI = '0909999999';
const SERIAL_MOI = 'SN-E2E-0001';

/**
 * Gọi API và trả về mã HTTP + body đã parse.
 *
 * @param {number} port Cổng server test đang nghe.
 * @param {string} duongDan Đường dẫn bắt đầu bằng `/`.
 * @param {object} [tuyChon]
 * @param {string} [tuyChon.method='GET']
 * @param {object} [tuyChon.body] Body JSON.
 * @param {Record<string,string>} [tuyChon.headers] Header bổ sung (vai trò...).
 * @param {boolean} [tuyChon.api=true] true thì thêm tiền tố `/api/v1`; false cho
 *   các đường dẫn không thuộc phiên bản như `/health`.
 * @returns {Promise<{status: number, body: any}>}
 */
async function goi(port, duongDan, { method = 'GET', body, headers = {}, api = true } = {}) {
  const phanHoi = await fetch(`http://127.0.0.1:${port}${api ? '/api/v1' : ''}${duongDan}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const duLieu = await phanHoi.json().catch(() => null);
  return { status: phanHoi.status, body: duLieu };
}

async function chay() {
  const app = createApp({ cheDoDuLieu: 'memory' });
  const server = app.listen(0);
  await once(server, 'listening');
  const { port } = server.address();

  try {
    // E2E-01: health phải xanh trước khi kiểm tra nghiệp vụ.
    const health = await goi(port, '/health', { api: false });
    assert.equal(health.status, 200);
    assert.equal(health.body.database, 'memory');
    console.log('[PASS] E2E-01 health tra 200');

    // E2E-02: danh sách đúng 3 phiếu seed, có metadata và hợp đồng đầy đủ.
    const danhSach = await goi(port, '/tickets');
    assert.equal(danhSach.status, 200);
    assert.equal(danhSach.body.meta.total, 3);
    assert.equal(danhSach.body.data.length, 3);
    assert.ok(danhSach.body.data[0].ticket_code);
    assert.ok(danhSach.body.data[0].customer_name);
    console.log('[PASS] E2E-02 GET /tickets tra 3 phieu kem ten khach');

    // E2E-03 (QT-15): nhân viên thấy số che; quản lý thấy số đầy đủ.
    assert.match(danhSach.body.data[0].customer_phone, /^\d{3}\*{4}\d{3}$/);
    const danhSachQuanLy = await goi(port, '/tickets', { headers: { 'X-User-Role': 'quan_ly' } });
    assert.match(danhSachQuanLy.body.data[0].customer_phone, /^0\d{9}$/);
    console.log('[PASS] E2E-03 QT-15 che so theo vai tro tren danh sach');

    // E2E-04 (QT-06): chi tiết trả kèm lịch sử và các bước chuyển hợp lệ.
    const chiTiet = await goi(port, '/tickets/1');
    assert.equal(chiTiet.status, 200);
    assert.equal(chiTiet.body.data.status, 'MOI');
    assert.ok(chiTiet.body.data.lich_su.length >= 1);
    assert.deepEqual(
      chiTiet.body.data.chuyen_tiep_duoc_phep.map((x) => x.status),
      ['DA_PHAN_CONG', 'DA_HUY'],
    );
    console.log('[PASS] E2E-04 chi tiet kem lich su va buoc chuyen QT-06');

    // E2E-05 (QT-02): tra khách bằng số có khoảng trắng vẫn ra hồ sơ.
    const khach = await goi(port, '/customers?phone=090%20123%204567');
    assert.equal(khach.status, 200);
    assert.equal(khach.body.data.customer_id, 1);
    console.log('[PASS] E2E-05 QT-02 chuan hoa so khi tra cuu');

    // E2E-06: tạo khách mới, rồi gửi trùng số phải bị chặn (QT-01).
    const taoKhach = await goi(port, '/customers', {
      method: 'POST',
      body: { full_name: 'Khach Test E2E', phone: PHONE_MOI, address: 'Can Tho' },
    });
    assert.equal(taoKhach.status, 201);
    const trungSo = await goi(port, '/customers', {
      method: 'POST',
      body: { full_name: 'Khach Trung So', phone: PHONE_MOI },
    });
    assert.equal(trungSo.status, 409);
    assert.equal(trungSo.body.error.code, 'PHONE_ALREADY_EXISTS');
    console.log('[PASS] E2E-06 QT-01 chan so dien thoai trung');

    // E2E-07: serial sai định dạng bị validator chặn ở ranh giới (không vào Service).
    const serialSai = await goi(port, '/devices', {
      method: 'POST',
      body: { customer_id: 1, serial_no: 'abc', purchase_date: '2026-09-01' },
    });
    assert.equal(serialSai.status, 400);
    assert.equal(serialSai.body.error.code, 'DU_LIEU_KHONG_HOP_LE');
    console.log('[PASS] E2E-07 serial sai bi chan voi ma DU_LIEU_KHONG_HOP_LE');

    // E2E-08 (QT-03): tạo thiết bị mới cho khách 1.
    const taoThietBi = await goi(port, '/devices', {
      method: 'POST',
      body: {
        customer_id: 1,
        serial_no: SERIAL_MOI,
        purchase_date: '2026-09-01',
        warranty_months: 12,
      },
    });
    assert.equal(taoThietBi.status, 201);
    const deviceId = taoThietBi.body.data.device_id;
    assert.ok(deviceId);
    console.log('[PASS] E2E-08 tao thiet bi moi theo QT-03');

    // E2E-09: tạo phiếu — hạn cam kết CAO phải đúng 24 giờ (QT-04).
    const taoPhieu = await goi(port, '/tickets', {
      method: 'POST',
      body: {
        customer_id: 1,
        device_id: deviceId,
        center_id: 1,
        category_id: 3,
        issue_desc: 'May tu tat nguon sau khi sac',
        priority: 'CAO',
        request_id: 'e2e-001',
      },
    });
    assert.equal(taoPhieu.status, 201);
    const phieu = taoPhieu.body.data;
    assert.match(phieu.ticket_code, /^BH-\d{6}\/\d{4}$/);
    assert.equal(phieu.warranty_status, 'CON_BAO_HANH');
    assert.equal(
      new Date(phieu.due_date).getTime() - new Date(phieu.received_at).getTime(),
      24 * 3600 * 1000,
    );
    console.log('[PASS] E2E-09 tao phieu, QT-04 tinh han 24 gio');

    // E2E-10 (NFR4): gửi lại cùng request_id trả 200 và đúng phiếu cũ.
    const guiLai = await goi(port, '/tickets', {
      method: 'POST',
      body: {
        customer_id: 1,
        device_id: deviceId,
        center_id: 1,
        category_id: 3,
        issue_desc: 'May tu tat nguon sau khi sac',
        priority: 'CAO',
        request_id: 'e2e-001',
      },
    });
    assert.equal(guiLai.status, 200);
    assert.equal(guiLai.body.data.la_phieu_cu, true);
    assert.equal(guiLai.body.data.ticket_id, phieu.ticket_id);
    console.log('[PASS] E2E-10 NFR4 gui lai request_id khong tao trung');

    // E2E-11 (QT-06): chuyển MOI -> DA_PHAN_CONG, lịch sử tăng thêm một dòng.
    const chuyen = await goi(port, `/tickets/${phieu.ticket_id}/transitions`, {
      method: 'POST',
      body: { to_status: 'DA_PHAN_CONG', note: 'Da tiep nhan va phan cong' },
    });
    assert.equal(chuyen.status, 200);
    assert.equal(chuyen.body.data.from_status, 'MOI');
    assert.equal(chuyen.body.data.to_status, 'DA_PHAN_CONG');

    const sauChuyen = await goi(port, `/tickets/${phieu.ticket_id}`);
    assert.equal(sauChuyen.body.data.status, 'DA_PHAN_CONG');
    assert.equal(sauChuyen.body.data.lich_su.length, 2);
    console.log('[PASS] E2E-11 QT-06 chuyen trang thai va ghi log');

    // E2E-12 (QT-06): chuyển lùi phải bị từ chối với mã INVALID_TRANSITION.
    const chuyenLui = await goi(port, `/tickets/${phieu.ticket_id}/transitions`, {
      method: 'POST',
      body: { to_status: 'MOI' },
    });
    assert.equal(chuyenLui.status, 400);
    assert.equal(chuyenLui.body.error.code, 'INVALID_TRANSITION');
    console.log('[PASS] E2E-12 QT-06 tu choi chuyen lui');

    // E2E-13 (QT-13): xóa phiếu luôn bị chặn, không xóa vật lý.
    const xoa = await goi(port, `/tickets/${phieu.ticket_id}`, { method: 'DELETE' });
    assert.equal(xoa.status, 409);
    assert.equal(xoa.body.error.code, 'KHONG_DUOC_XOA_PHIEU');
    console.log('[PASS] E2E-13 QT-13 khong cho xoa phieu');

    // E2E-14: bộ lọc không có dữ liệu trả mảng rỗng + total 0 (trạng thái RỖNG
    // của giao diện dựa vào đây, không dựa vào lỗi 404).
    const rong = await goi(port, '/tickets?status=HOAN_TAT');
    assert.equal(rong.status, 200);
    assert.deepEqual(rong.body.data, []);
    assert.equal(rong.body.meta.total, 0);
    console.log('[PASS] E2E-14 bo loc rong tra mang rong, total 0');

    // E2E-15: đường dẫn lạ trả 404 theo đúng định dạng lỗi chung.
    const khongTonTai = await goi(port, '/khong-ton-tai');
    assert.equal(khongTonTai.status, 404);
    assert.equal(khongTonTai.body.error.code, 'NOT_FOUND');
    console.log('[PASS] E2E-15 404 dung dinh dang loi chung');

    console.log('[SO-TEST] 15');
    console.log('E2E tests passed: E2E-01 .. E2E-15');
  } finally {
    server.close();
  }
}

chay().catch((loi) => {
  console.error(loi);
  process.exitCode = 1;
});
