const express = require('express');
const { AppError } = require('../errors/AppError');

// Routes khach hang chi dich HTTP, quy tac trung so dien thoai nam o service.
function taoRouteKhachHang(dichVuKhachHang) {
  const router = express.Router();

  router.get('/customers', async (req, res, next) => {
    try {
      const phone = typeof req.query.phone === 'string' ? req.query.phone.trim() : '';
      if (!/^0\d{9}$/.test(phone)) {
        throw new AppError('DU_LIEU_KHONG_HOP_LE', 'So dien thoai phai co 10 chu so va bat dau bang 0.');
      }
      const khachHang = await dichVuKhachHang.timTheoSoDienThoai(phone);
      return res.json({ data: khachHang });
    } catch (loi) {
      if (loi.code === 'DU_LIEU_KHONG_HOP_LE') return res.status(400).json({ error: loi.code, message: loi.message });
      if (loi.code === 'KHACH_KHONG_TON_TAI') return res.status(404).json({ error: loi.code, message: loi.message });
      return next(loi);
    }
  });

  router.post('/customers', async (req, res, next) => {
    try {
      const { fullName, phone, email, address } = req.body || {};
      if (typeof fullName !== 'string' || fullName.trim().length === 0 || !/^0\d{9}$/.test(phone || '')) {
        throw new AppError('DU_LIEU_KHONG_HOP_LE', 'Ho ten va so dien thoai la bat buoc.');
      }
      const khachHang = await dichVuKhachHang.tao({ full_name: fullName.trim(), phone, email, address });
      return res.status(201).json({ data: khachHang });
    } catch (loi) {
      if (loi.code === 'DU_LIEU_KHONG_HOP_LE') return res.status(400).json({ error: loi.code, message: loi.message });
      if (loi.code === 'SO_DIEN_THOAI_DA_TON_TAI') return res.status(409).json({ error: loi.code, message: loi.message });
      return next(loi);
    }
  });

  router.get('/customers/:customerId', async (req, res, next) => {
    try {
      const khachHang = await dichVuKhachHang.timTheoId(Number(req.params.customerId));
      return res.json({ data: khachHang });
    } catch (loi) {
      if (loi.code === 'KHACH_KHONG_TON_TAI') return res.status(404).json({ error: loi.code, message: loi.message });
      return next(loi);
    }
  });

  router.put('/customers/:customerId', async (req, res, next) => {
    try {
      const khachHang = await dichVuKhachHang.capNhat(Number(req.params.customerId), req.body || {});
      return res.json({ data: khachHang });
    } catch (loi) {
      if (loi.code === 'KHACH_KHONG_TON_TAI') return res.status(404).json({ error: loi.code, message: loi.message });
      if (loi.code === 'SO_DIEN_THOAI_DA_TON_TAI') return res.status(409).json({ error: loi.code, message: loi.message });
      return next(loi);
    }
  });

  router.delete('/customers/:customerId', async (req, res, next) => {
    try {
      await dichVuKhachHang.xoa(Number(req.params.customerId));
      return res.status(204).send();
    } catch (loi) {
      if (loi.code === 'KHACH_KHONG_TON_TAI') return res.status(404).json({ error: loi.code, message: loi.message });
      return next(loi);
    }
  });

  return router;
}

module.exports = { taoRouteKhachHang };
