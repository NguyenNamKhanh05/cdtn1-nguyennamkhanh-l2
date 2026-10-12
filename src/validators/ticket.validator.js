const { AppError } = require('../errors/AppError');

const UU_TIEN_HOP_LE = ['CAO', 'TRUNG_BINH', 'THAP'];
const MA_SERIAL = /^[A-Za-z0-9-]{6,50}$/;

// Kiem tra dinh dang dau vao, khong truy cap co so du lieu.
function kiemTraTiepNhan(duLieu = {}) {
  const loi = [];
  const truongSoNguyenDuong = ['customerId', 'deviceId', 'centerId', 'categoryId'];

  for (const truong of truongSoNguyenDuong) {
    if (!Number.isInteger(duLieu[truong]) || duLieu[truong] <= 0) {
      loi.push({ truong, lyDo: 'phai la so nguyen duong' });
    }
  }

  const serialNo = typeof duLieu.serialNo === 'string' ? duLieu.serialNo.trim() : '';
  if (!MA_SERIAL.test(serialNo)) {
    loi.push({ truong: 'serialNo', lyDo: 'chu, so, gach ngang; dai 6-50 ky tu' });
  }

  if (!UU_TIEN_HOP_LE.includes(duLieu.priority)) {
    loi.push({ truong: 'priority', lyDo: 'phai la CAO, TRUNG_BINH hoac THAP' });
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(duLieu.purchaseDate || '') || Number.isNaN(Date.parse(duLieu.purchaseDate))) {
    loi.push({ truong: 'purchaseDate', lyDo: 'phai theo dinh dang YYYY-MM-DD' });
  }

  if (!Number.isInteger(duLieu.warrantyMonths) || duLieu.warrantyMonths < 0) {
    loi.push({ truong: 'warrantyMonths', lyDo: 'phai la so nguyen khong am' });
  }

  if (typeof duLieu.issueDesc !== 'string' || duLieu.issueDesc.trim().length === 0 || duLieu.issueDesc.length > 2000) {
    loi.push({ truong: 'issueDesc', lyDo: 'bat buoc va toi da 2000 ky tu' });
  }

  if (loi.length > 0) {
    throw new AppError(
      'DU_LIEU_KHONG_HOP_LE',
      `Du lieu vao khong hop le o cac truong: ${loi.map((muc) => muc.truong).join(', ')}`,
      loi,
    );
  }

  return { ...duLieu, serialNo };
}

module.exports = { kiemTraTiepNhan };
