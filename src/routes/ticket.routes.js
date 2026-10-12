const express = require('express');
const { kiemTraTiepNhan } = require('../validators/ticket.validator');

const MA_HTTP = {
  DU_LIEU_KHONG_HOP_LE: 400,
  KHACH_KHONG_TON_TAI: 404,
  THIET_BI_KHONG_TON_TAI: 404,
  THIET_BI_KHONG_THUOC_KHACH: 409,
  PHIEU_DANG_MO: 409,
  UU_TIEN_KHONG_HOP_LE: 400,
};

// Routes chi dich HTTP sang loi nghiep vu, khong tu quyet dinh quy tac.
function taoRoutePhieu(dichVuPhieu) {
  const router = express.Router();

  router.post('/tickets', async (req, res, next) => {
    try {
      const duLieu = kiemTraTiepNhan(req.body);
      const phieu = await dichVuPhieu.taoPhieu(duLieu);
      res.status(201).json({ data: phieu });
    } catch (loi) {
      if (loi.code && MA_HTTP[loi.code]) {
        return res.status(MA_HTTP[loi.code]).json({
          error: loi.code,
          message: loi.message,
          chi_tiet: loi.chiTiet,
        });
      }
      return next(loi);
    }
  });

  router.get('/tickets', async (req, res, next) => {
    try {
      const phieus = await dichVuPhieu.lietKePhieu();
      return res.json({ data: phieus, meta: { total: phieus.length } });
    } catch (loi) {
      return next(loi);
    }
  });

  router.get('/tickets/:ticketId', async (req, res, next) => {
    try {
      const phieu = await dichVuPhieu.timPhieuTheoId(Number(req.params.ticketId));
      return res.json({ data: phieu });
    } catch (loi) {
      if (loi.code === 'PHIEU_KHONG_TON_TAI') return res.status(404).json({ error: loi.code, message: loi.message });
      return next(loi);
    }
  });

  router.put('/tickets/:ticketId', async (req, res, next) => {
    try {
      const phieu = await dichVuPhieu.capNhatPhieu(Number(req.params.ticketId), req.body || {});
      return res.json({ data: phieu });
    } catch (loi) {
      if (loi.code === 'PHIEU_KHONG_TON_TAI') return res.status(404).json({ error: loi.code, message: loi.message });
      return next(loi);
    }
  });

  router.delete('/tickets/:ticketId', async (req, res, next) => {
    try {
      await dichVuPhieu.xoaPhieu(Number(req.params.ticketId));
      return res.status(204).send();
    } catch (loi) {
      if (loi.code === 'PHIEU_KHONG_TON_TAI') return res.status(404).json({ error: loi.code, message: loi.message });
      return next(loi);
    }
  });

  return router;
}

module.exports = { taoRoutePhieu };
