const express = require('express');
const { AppError } = require('../errors/AppError');
const { MA_SERIAL } = require('../validators/ticket.validator');

/**
 * Route danh mục và thiết bị.
 *
 * Vì sao danh mục nằm trong API: NFR4 yêu cầu thêm nhóm sự cố hoặc loại yêu
 * cầu chỉ bằng dữ liệu cấu hình. Giao diện cần đọc danh mục từ CSDL thay vì
 * hard-code trong mã, nếu không mỗi lần thêm nhóm sự cố lại phải sửa và build lại.
 *
 * @param {import('../services/ticket.service').DichVuPhieu} dichVuPhieu
 * @param {object} repository Repository dùng chung (đọc/ghi thiết bị).
 * @returns {import('express').Router}
 */
function taoRouteDanhMuc(dichVuPhieu, repository) {
  const router = express.Router();

  /**
   * GET /issue-categories — danh mục nhóm sự cố (UC4).
   */
  router.get('/issue-categories', async (req, res, next) => {
    try {
      return res.json({ data: await dichVuPhieu.lietKeNhomSuCo() });
    } catch (loi) {
      return next(loi);
    }
  });

  /**
   * GET /service-centers — danh mục trung tâm bảo hành.
   */
  router.get('/service-centers', async (req, res, next) => {
    try {
      return res.json({ data: await dichVuPhieu.lietKeTrungTam() });
    } catch (loi) {
      return next(loi);
    }
  });

  /**
   * GET /technicians — danh mục kỹ thuật viên (dữ liệu tham chiếu cho L4).
   */
  router.get('/technicians', async (req, res, next) => {
    try {
      return res.json({ data: await dichVuPhieu.lietKeKyThuatVien() });
    } catch (loi) {
      return next(loi);
    }
  });

  /**
   * GET /customers/:customerId/devices — thiết bị của một khách (UC3, QT-03).
   *
   * Vì sao tách khỏi `GET /customers/:customerId`: màn hình tiếp nhận cần danh
   * sách thiết bị để chọn, và phải phân biệt "khách chưa có thiết bị" (mảng
   * rỗng, giao diện hiện trạng thái rỗng) với "khách không tồn tại" (404).
   *
   * @returns {Promise<void>}
   */
  router.get('/customers/:customerId/devices', async (req, res, next) => {
    try {
      const customerId = Number(req.params.customerId);
      const khachHang = await repository.timKhachHangTheoId(customerId);
      if (!khachHang) throw new AppError('KHACH_KHONG_TON_TAI', 'Không tìm thấy khách hàng.');
      const thietBis = await repository.lietKeThietBiTheoKhachHang(customerId);
      return res.json({ data: thietBis });
    } catch (loi) {
      if (loi.code === 'KHACH_KHONG_TON_TAI') {
        return res.status(404).json({ error: { code: 'CUSTOMER_NOT_FOUND', message: loi.message } });
      }
      return next(loi);
    }
  });

  /**
   * GET /devices/:deviceId — xem thông tin thiết bị.
   */
  router.get('/devices/:deviceId', async (req, res, next) => {
    try {
      const thietBi = await repository.timThietBiTheoId(Number(req.params.deviceId));
      if (!thietBi) throw new AppError('THIET_BI_KHONG_TON_TAI', 'Không tìm thấy thiết bị.');
      return res.json({ data: thietBi });
    } catch (loi) {
      if (loi.code === 'THIET_BI_KHONG_TON_TAI') {
        return res.status(404).json({ error: { code: 'RESOURCE_NOT_FOUND', message: loi.message } });
      }
      return next(loi);
    }
  });

  /**
   * POST /devices — ghi nhận thiết bị trước khi lập phiếu (UC3).
   *
   * Vì sao cần endpoint riêng: một khách có thể mang nhiều thiết bị, và thiết
   * bị được dùng lại qua nhiều phiếu. Tách ra giúp không phải nhập lại serial
   * mỗi lần bảo hành, đồng thời giữ QT-03 (serial duy nhất) ở một chỗ.
   */
  router.post('/devices', async (req, res, next) => {
    try {
      const duLieu = req.body || {};
      const dsLoi = [];

      const customerId = Number(duLieu.customer_id ?? duLieu.customerId);
      if (!Number.isInteger(customerId) || customerId <= 0) {
        dsLoi.push({ truong: 'customer_id', lyDo: 'phải là số nguyên dương' });
      }

      const serialNo = typeof (duLieu.serial_no ?? duLieu.serialNo) === 'string'
        ? (duLieu.serial_no ?? duLieu.serialNo).trim()
        : '';
      if (!MA_SERIAL.test(serialNo)) {
        dsLoi.push({ truong: 'serial_no', lyDo: 'chữ, số, gạch ngang; dài 6-50 ký tự' });
      }

      const purchaseDate = duLieu.purchase_date ?? duLieu.purchaseDate ?? null;
      if (purchaseDate !== null && purchaseDate !== '') {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(purchaseDate) || Number.isNaN(Date.parse(purchaseDate))) {
          dsLoi.push({ truong: 'purchase_date', lyDo: 'phải theo định dạng YYYY-MM-DD' });
        }
      }

      const warrantyMonths = Number(duLieu.warranty_months ?? duLieu.warrantyMonths ?? 12);
      if (!Number.isInteger(warrantyMonths) || warrantyMonths <= 0) {
        dsLoi.push({ truong: 'warranty_months', lyDo: 'phải là số nguyên dương' });
      }

      if (dsLoi.length > 0) {
        throw new AppError('DU_LIEU_KHONG_HOP_LE', 'Dữ liệu thiết bị không hợp lệ.', dsLoi);
      }

      const khachHang = await repository.timKhachHangTheoId(customerId);
      if (!khachHang) throw new AppError('KHACH_KHONG_TON_TAI', 'Không tìm thấy khách hàng.');

      // QT-03: serial/IMEI là duy nhất trên toàn hệ thống. Kiểm tra trước để
      // trả 409 kèm serial bị trùng, thay vì để CSDL ném lỗi UNIQUE khó đọc.
      const daCo = await repository.timThietBiTheoSerial(serialNo);
      if (daCo) {
        return res.status(409).json({
          error: { code: 'SERIAL_ALREADY_EXISTS', message: `Serial ${serialNo} đã thuộc thiết bị khác.` },
        });
      }

      const thietBi = await repository.taoThietBi({
        customer_id: customerId,
        serial_no: serialNo,
        purchase_date: purchaseDate || null,
        warranty_months: warrantyMonths,
      });
      return res.status(201).json({ data: thietBi });
    } catch (loi) {
      if (loi.code === 'DU_LIEU_KHONG_HOP_LE') {
        return res.status(400).json({
          error: { code: 'DU_LIEU_KHONG_HOP_LE', message: loi.message, fields: loi.chiTiet },
        });
      }
      if (loi.code === 'KHACH_KHONG_TON_TAI') {
        return res.status(404).json({ error: { code: 'RESOURCE_NOT_FOUND', message: loi.message } });
      }
      return next(loi);
    }
  });

  return router;
}

module.exports = { taoRouteDanhMuc };
