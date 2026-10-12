const assert = require('node:assert/strict');
const { BoNhoRepository } = require('../src/repositories/memory.repository');
const { DichVuPhieu } = require('../src/services/ticket.service');
const { kiemTraTiepNhan } = require('../src/validators/ticket.validator');

function taoDichVu(phieus = []) {
  const repository = new BoNhoRepository({
    khachHangs: [{ customer_id: 1, full_name: 'Nguyen Van Binh', phone: '0901234567' }],
    thietBis: [{ device_id: 10, customer_id: 1, serial_no: 'SN-10293', purchase_date: '2026-03-01', warranty_months: 12 }],
    phieus,
  });
  return new DichVuPhieu(repository, () => new Date('2026-09-28T10:00:00.000Z'));
}

async function chay() {
  const duLieuCoBan = {
    customerId: 1,
    deviceId: 10,
    centerId: 2,
    categoryId: 1,
    serialNo: 'SN-10293',
    priority: 'CAO',
    purchaseDate: '2026-03-01',
    warrantyMonths: 12,
    issueDesc: 'May khong sac duoc',
  };

  // TC-01: luong dung - thiet bi con bao hanh tao duoc phieu.
  const dichVu = taoDichVu();
  const phieu = await dichVu.taoPhieu(kiemTraTiepNhan(duLieuCoBan));
  assert.equal(phieu.is_warranty, true);
  assert.equal(phieu.status, 'MOI');
  assert.equal(phieu.priority, 'CAO');

  // TC-02: gia tri bien - ngay tiep nhan dung ngay het han van con bao hanh.
  const dichVuBien = taoDichVu();
  const thietBi = await dichVuBien.repository.timThietBiTheoId(10);
  assert.equal(dichVuBien.kiemTraConBaoHanh(thietBi, new Date('2027-03-01T00:00:00.000Z')).conBaoHanh, true);
  assert.equal(dichVuBien.kiemTraConBaoHanh(thietBi, new Date('2027-03-02T00:00:00.000Z')).conBaoHanh, false);

  // TC-03: du lieu sai - serial dang co phieu mo bi tu choi theo QT-09.
  const dichVuTrung = taoDichVu([{ serial_no: 'SN-10293', status: 'DANG_XU_LY' }]);
  await assert.rejects(
    () => dichVuTrung.taoPhieu(kiemTraTiepNhan(duLieuCoBan)),
    { code: 'PHIEU_DANG_MO' },
  );

  console.log('Service tests passed: TC-01, TC-02, TC-03');
}

chay().catch((loi) => {
  console.error(loi);
  process.exitCode = 1;
});
