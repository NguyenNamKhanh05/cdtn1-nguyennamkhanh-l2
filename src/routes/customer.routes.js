const express = require('express');
const { kiemTraKhachHang } = require('../validators/ticket.validator');
const { chuanHoaSoDienThoai } = require('../domain/phone');
const { cheTheoQuyen } = require('../middleware/ngu-canh');

/**
 * Route khách hàng (UC1, UC2).
 *
 * Quy tắc trùng số điện thoại (QT-01) nằm ở Service, không ở đây, vì cần đọc
 * dữ liệu hiện có. Route chỉ chuẩn hóa tham số và dịch lỗi sang HTTP.
 *
 * @param {import('../services/customer.service').DichVuKhachHang} dichVuKhachHang
 * @returns {import('express').Router}
 */
function taoRouteKhachHang(dichVuKhachHang) {
  const router = express.Router();

  /**
   * GET /customers?phone=... — tra cứu khách theo số điện thoại (US1).
   *
   * QT-02 được áp ngay ở đây: số "+8490..." hay "090 123 4567" đều được chuẩn
   * hóa trước khi tra, nhờ vậy nhân viên không phải gõ đúng một định dạng.
   * QT-15: số trả về bị che nếu người xem không đủ quyền.
   */
  router.get('/customers', async (req, res, next) => {
    try {
      const phone = chuanHoaSoDienThoai(req.query.phone);
      if (!phone) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Dữ liệu không hợp lệ',
            fields: { phone: 'Số điện thoại phải có 10 chữ số và bắt đầu bằng 0.' },
          },
        });
      }

      // QT-01: số đã tồn tại thì trả hồ sơ cũ để nhân viên dùng lại.
      const khachHang = await dichVuKhachHang.timTheoSoDienThoai(phone);
      return res.json({ data: cheTheoQuyen(req.nguCanh || {}, khachHang) });
    } catch (loi) {
      if (loi.code === 'KHACH_KHONG_TON_TAI') {
        return res.status(404).json({ error: { code: 'CUSTOMER_NOT_FOUND', message: loi.message } });
      }
      return next(loi);
    }
  });

  /**
   * POST /customers — tạo khách hàng mới (US2).
   * QT-01: nếu số đã tồn tại trả 409 kèm mã PHONE_ALREADY_EXISTS để giao diện
   * hiển thị hồ sơ có sẵn thay vì tạo bản ghi thứ hai.
   */
  router.post('/customers', async (req, res, next) => {
    try {
      const duLieu = kiemTraKhachHang(req.body || {});
      const khachHang = await dichVuKhachHang.tao(duLieu);
      return res.status(201).json({ data: cheTheoQuyen(req.nguCanh || {}, khachHang) });
    } catch (loi) {
      if (loi.code === 'DU_LIEU_KHONG_HOP_LE') {
        return res.status(400).json({
          error: { code: 'VALIDATION_ERROR', message: loi.message, fields: loi.chiTiet },
        });
      }
      if (loi.code === 'SO_DIEN_THOAI_DA_TON_TAI') {
        return res.status(409).json({ error: { code: 'PHONE_ALREADY_EXISTS', message: loi.message } });
      }
      return next(loi);
    }
  });

  /**
   * GET /customers/:customerId — xem hồ sơ khách hàng.
   */
  router.get('/customers/:customerId', async (req, res, next) => {
    try {
      const khachHang = await dichVuKhachHang.timTheoId(Number(req.params.customerId));
      return res.json({ data: cheTheoQuyen(req.nguCanh || {}, khachHang) });
    } catch (loi) {
      if (loi.code === 'KHACH_KHONG_TON_TAI') {
        return res.status(404).json({ error: { code: 'CUSTOMER_NOT_FOUND', message: loi.message } });
      }
      return next(loi);
    }
  });

  /**
   * PUT /customers/:customerId — cập nhật hồ sơ.
   * Cho phép gửi một phần trường; trường không gửi giữ nguyên.
   */
  router.put('/customers/:customerId', async (req, res, next) => {
    try {
      const duLieu = kiemTraKhachHang(req.body || {}, { batBuoc: false });
      const khachHang = await dichVuKhachHang.capNhat(Number(req.params.customerId), duLieu);
      return res.json({ data: cheTheoQuyen(req.nguCanh || {}, khachHang) });
    } catch (loi) {
      if (loi.code === 'DU_LIEU_KHONG_HOP_LE') {
        return res.status(400).json({
          error: { code: 'VALIDATION_ERROR', message: loi.message, fields: loi.chiTiet },
        });
      }
      if (loi.code === 'KHACH_KHONG_TON_TAI') {
        return res.status(404).json({ error: { code: 'CUSTOMER_NOT_FOUND', message: loi.message } });
      }
      if (loi.code === 'SO_DIEN_THOAI_DA_TON_TAI') {
        return res.status(409).json({ error: { code: 'PHONE_ALREADY_EXISTS', message: loi.message } });
      }
      return next(loi);
    }
  });

  /**
   * DELETE /customers/:customerId — ngừng sử dụng hồ sơ (QT-13).
   * Trả 204 vì không có nội dung; dữ liệu vẫn còn trong bảng với is_active = false.
   */
  router.delete('/customers/:customerId', async (req, res, next) => {
    try {
      await dichVuKhachHang.xoa(Number(req.params.customerId));
      return res.status(204).send();
    } catch (loi) {
      if (loi.code === 'KHACH_KHONG_TON_TAI') {
        return res.status(404).json({ error: { code: 'CUSTOMER_NOT_FOUND', message: loi.message } });
      }
      return next(loi);
    }
  });

  return router;
}

module.exports = { taoRouteKhachHang };
