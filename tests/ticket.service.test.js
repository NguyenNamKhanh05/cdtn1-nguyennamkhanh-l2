const assert = require('node:assert/strict');
const { BoNhoRepository } = require('../src/repositories/memory.repository');
const { DichVuPhieu } = require('../src/services/ticket.service');
const { kiemTraTiepNhan, kiemTraKhachHang } = require('../src/validators/ticket.validator');
const { tinhHanCamKet } = require('../src/domain/sla');
const { chuanHoaSoDienThoai, cheSoDienThoai } = require('../src/domain/phone');
const { coTheChuyen } = require('../src/domain/ticket-status');

/**
 * Unit test cho các quy tắc nghiệp vụ của L2 (TC-01 .. TC-13).
 *
 * Vì sao dùng repository bộ nhớ thay vì PostgreSQL: test phải chạy được trên
 * máy không cài Docker, và phải chạy trong vài mili giây. Quy tắc nghiệp vụ
 * không phụ thuộc CSDL, nên kiểm tra qua bộ nhớ là đủ; phần SQL được kiểm tra
 * riêng bằng `npm run demo` trên dữ liệu thật.
 *
 * Chạy: `npm test`.
 */

/**
 * Tạo Service phiếu với dữ liệu mẫu cố định.
 *
 * `dongHo` được cố định ở thứ Hai 28/09/2026 để test QT-04 không phụ thuộc ngày
 * chạy thật — nếu dùng `new Date()` thì cùng một test có thể đỏ vào Chủ nhật.
 *
 * @param {object[]} [phieus] Phiếu có sẵn trong kho.
 * @param {() => Date} [dongHo] Hàm lấy thời gian hiện tại.
 * @returns {DichVuPhieu}
 */
function taoDichVu(phieus = [], dongHo = () => new Date('2026-09-28T10:00:00.000Z')) {
  const repository = new BoNhoRepository({
    khachHangs: [{ customer_id: 1, full_name: 'Nguyen Van Binh', phone: '0901234567' }],
    thietBis: [{ device_id: 10, customer_id: 1, serial_no: 'SN-10293', purchase_date: '2026-03-01', warranty_months: 12 }],
    phieus,
  });
  return new DichVuPhieu(repository, dongHo);
}

// Dữ liệu hợp lệ tối thiểu; từng test chỉ ghi đè trường cần kiểm tra.
const duLieuCoBan = {
  customer_id: 1,
  device_id: 10,
  center_id: 1,
  category_id: 1,
  issue_desc: 'May khong sac duoc',
  priority: 'CAO',
};

/**
 * Chạy tuần tự toàn bộ test case.
 *
 * Dùng `assert` của Node (không cần framework) để giảng viên chạy `npm test`
 * mà không phải cài thêm gói nào.
 *
 * @returns {Promise<void>}
 */
async function chay() {
  // TC-01 (QT-05, UC3): thiết bị còn bảo hành tạo được phiếu ở trạng thái MOI.
  const dichVu = taoDichVu();
  const phieu = await dichVu.taoPhieu(kiemTraTiepNhan(duLieuCoBan));
  assert.equal(phieu.is_warranty, true);
  assert.equal(phieu.status, 'MOI');
  assert.equal(phieu.priority, 'CAO');
  assert.match(phieu.ticket_code, /^BH-\d{6}\/\d{4}$/);

  // TC-02 (QT-05, biên): ngày tiếp nhận ĐÚNG ngày hết hạn vẫn còn bảo hành.
  // Đây là biên dễ sai nhất: dùng "<" thay vì "<=" sẽ từ chối oan khách.
  const dichVuBien = taoDichVu();
  const thietBi = await dichVuBien.repository.timThietBiTheoId(10);
  assert.equal(dichVuBien.kiemTraConBaoHanh(thietBi, new Date('2027-03-01T00:00:00.000Z')).conBaoHanh, true);
  assert.equal(dichVuBien.kiemTraConBaoHanh(thietBi, new Date('2027-03-02T00:00:00.000Z')).conBaoHanh, false);

  // TC-03 (QT-03): khách hàng không tồn tại bị từ chối trước khi xét thiết bị.
  const dichVuSaiKhach = taoDichVu();
  await assert.rejects(
    () => dichVuSaiKhach.taoPhieu(kiemTraTiepNhan({ ...duLieuCoBan, customer_id: 2 })),
    { code: 'KHACH_KHONG_TON_TAI' },
  );

  // TC-04 (dữ liệu sai): serial rỗng bị validator chặn trước khi chạm Service.
  assert.throws(
    () => kiemTraTiepNhan({ ...duLieuCoBan, device_id: undefined, serial_no: '' }),
    { code: 'DU_LIEU_KHONG_HOP_LE' },
  );

  // TC-05 (QT-04): CAO 24 giờ, TRUNG_BINH 72 giờ, THAP 120 giờ.
  const moc = new Date('2026-09-28T10:00:00.000Z'); // thứ Hai
  assert.equal(tinhHanCamKet(moc, 'CAO').getTime() - moc.getTime(), 24 * 3600 * 1000);
  assert.equal(tinhHanCamKet(moc, 'TRUNG_BINH').getTime() - moc.getTime(), 72 * 3600 * 1000);
  assert.equal(tinhHanCamKet(moc, 'THAP').getTime() - moc.getTime(), 120 * 3600 * 1000);

  // TC-06 (QT-04): bỏ qua Chủ nhật. Thứ Bảy 10:00 + 24 giờ -> thứ Hai 10:00.
  const thuBay = new Date('2026-10-03T10:00:00.000Z');
  const han = tinhHanCamKet(thuBay, 'CAO');
  assert.equal(han.getUTCDay(), 1, 'Han phai roi vao thu Hai');
  assert.equal(han.toISOString(), '2026-10-05T10:00:00.000Z');

  // TC-07 (QT-02): chuẩn hóa số điện thoại về 10 chữ số bắt đầu bằng 0.
  assert.equal(chuanHoaSoDienThoai('+84901234567'), '0901234567');
  assert.equal(chuanHoaSoDienThoai('84901234567'), '0901234567');
  assert.equal(chuanHoaSoDienThoai('090 123 4567'), '0901234567');
  assert.equal(chuanHoaSoDienThoai('090.123.4567'), '0901234567');
  assert.equal(chuanHoaSoDienThoai('12345'), null);

  // TC-08 (QT-15): che 4 số giữa, giữ đầu số và đuôi để đối chiếu.
  assert.equal(cheSoDienThoai('0901234567'), '090****567');

  // TC-09 (QT-06): vòng đời trạng thái không quay lui, không nhảy cóc.
  assert.equal(coTheChuyen('MOI', 'DA_PHAN_CONG'), true);
  assert.equal(coTheChuyen('DA_PHAN_CONG', 'MOI'), false);
  assert.equal(coTheChuyen('DA_DONG', 'DANG_XU_LY'), false);

  // TC-10 (QT-06): chuyển hợp lệ ghi log; chuyển không hợp lệ bị từ chối.
  const dichVuChuyen = taoDichVu([{ ticket_id: 1, ticket_code: 'BH-000001/2026', status: 'MOI', device_id: 10, due_date: '2026-10-01T00:00:00.000Z' }]);
  const ketQua = await dichVuChuyen.chuyenTrangThai(1, { toStatus: 'DA_PHAN_CONG', note: 'Da tiep nhan' });
  assert.equal(ketQua.from_status, 'MOI');
  assert.equal(ketQua.to_status, 'DA_PHAN_CONG');
  const lichSu = await dichVuChuyen.lichSuTrangThai(1);
  assert.equal(lichSu.length, 1);

  await assert.rejects(
    () => dichVuChuyen.chuyenTrangThai(1, { toStatus: 'MOI' }),
    { code: 'CHUYEN_TRANG_THAI_KHONG_HOP_LE' },
  );

  // TC-11 (NFR4): cùng request_id không tạo phiếu thứ hai (chống trùng khi
  // client mất mạng rồi gửi lại).
  const dichVuIdempotent = taoDichVu();
  const lan1 = await dichVuIdempotent.taoPhieu(kiemTraTiepNhan({ ...duLieuCoBan, request_id: 'req-001' }));
  const lan2 = await dichVuIdempotent.taoPhieu(kiemTraTiepNhan({ ...duLieuCoBan, request_id: 'req-001' }));
  assert.equal(lan1.ticket_id, lan2.ticket_id);
  assert.equal(lan2.la_phieu_cu, true);

  // TC-12 (QT-01): số điện thoại đã tồn tại thì không tạo hồ sơ trùng, kể cả
  // khi nhập khác định dạng ("090 123 4567" đã được chuẩn hóa).
  const { DichVuKhachHang } = require('../src/services/customer.service');
  const khoKhachHang = new BoNhoRepository({
    khachHangs: [{ customer_id: 1, full_name: 'Nguyen Van Binh', phone: '0901234567' }],
  });
  const dichVuKhachHang = new DichVuKhachHang(khoKhachHang);
  await assert.rejects(
    () => dichVuKhachHang.tao(kiemTraKhachHang({ full_name: 'Nguyen Van Binh', phone: '090 123 4567' })),
    { code: 'SO_DIEN_THOAI_DA_TON_TAI' },
  );

  // TC-13 (QT-05): thiếu ngày mua -> chưa xác minh được bảo hành.
  // Cột is_warranty là NOT NULL nên lưu false, nhưng ý nghĩa "chưa xác minh"
  // vẫn phải được giữ để quản lý phê duyệt (không được coi là hết hạn).
  const dichVuKhongNgayMua = taoDichVu();
  dichVuKhongNgayMua.repository.thietBis[0].purchase_date = null;
  const phieuChuaXacMinh = await dichVuKhongNgayMua.taoPhieu(kiemTraTiepNhan(duLieuCoBan));
  assert.equal(phieuChuaXacMinh.is_warranty, false);
  assert.equal(phieuChuaXacMinh.canh_bao_bao_hanh, 'CHUA_XAC_MINH_BAO_HANH');
  assert.equal(phieuChuaXacMinh.can_quan_ly_phe_duyet, true);

  console.log('[SO-TEST] 13');
  console.log('Service tests passed: TC-01 .. TC-13');
}

chay().catch((loi) => {
  console.error(loi);
  process.exitCode = 1;
});
