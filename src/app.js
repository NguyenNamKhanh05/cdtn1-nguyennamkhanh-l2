const express = require('express');
const { BoNhoRepository } = require('./repositories/memory.repository');
const { DichVuPhieu } = require('./services/ticket.service');
const { DichVuKhachHang } = require('./services/customer.service');
const { taoRouteKhachHang } = require('./routes/customer.routes');
const { taoRoutePhieu } = require('./routes/ticket.routes');

function createApp({ repository = null } = {}) {
  const app = express();
  const duLieu = repository || new BoNhoRepository({
    khachHangs: [{ customer_id: 1, full_name: 'Nguyen Van Binh', phone: '0901234567' }],
    thietBis: [{ device_id: 10, customer_id: 1, serial_no: 'SN-10293', purchase_date: '2026-03-01', warranty_months: 12 }],
  });
  const dichVuPhieu = new DichVuPhieu(duLieu);
  const dichVuKhachHang = new DichVuKhachHang(duLieu);

  app.use(express.json());

  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/v1', taoRouteKhachHang(dichVuKhachHang));
  app.use('/api/v1', taoRoutePhieu(dichVuPhieu));

  app.use((loi, req, res, next) => {
    if (res.headersSent) return next(loi);
    console.error(loi);
    return res.status(500).json({ error: 'LOI_HE_THONG', message: 'He thong dang gap su co. Vui long thu lai sau.' });
  });

  return app;
}

module.exports = { createApp };
