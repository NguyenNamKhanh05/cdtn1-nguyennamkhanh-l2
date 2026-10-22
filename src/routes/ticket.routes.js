const express = require('express');
const { kiemTraTiepNhan, kiemTraBoLoc, kiemTraChuyenTrangThai } = require('../validators/ticket.validator');
const { coTheXemTrungTam } = require('../middleware/ngu-canh');
const {
  toTicketView,
  toTicketDetailView,
  toTicketPage,
  toHistoryView,
} = require('../contracts/ticket.contract');

/**
 * Route phiếu bảo hành.
 *
 * Vì sao route mỏng: route chỉ làm ba việc — kiểm tra hình thức, gọi Service,
 * dịch mã lỗi nghiệp vụ sang HTTP. Nếu route tự quyết định quy tắc thì quy tắc
 * bị trùng lặp giữa các endpoint và không test được nếu không dựng HTTP server.
 *
 * Bảng mã lỗi -> HTTP nằm ở hàm `guiLoi`, là nơi DUY NHẤT ánh xạ lỗi.
 */

/**
 * Dịch một AppError thành response HTTP tương ứng.
 *
 * @param {import('express').Response} res
 * @param {Error & {code?: string, chiTiet?: *}} loi Lỗi do Service ném ra.
 * @returns {import('express').Response|null} Response đã gửi, hoặc null nếu
 *   lỗi không thuộc danh sách đã biết (khi đó middleware lỗi xử lý thành 500).
 */
function guiLoi(res, loi) {
  const fields = Array.isArray(loi.chiTiet) ? loi.chiTiet : undefined;

  // 400: dữ liệu người dùng gửi sai định dạng hoặc vi phạm quy tắc nghiệp vụ
  // kiểm tra được ngay (không cần đọc thêm dữ liệu khác).
  if (loi.code === 'DU_LIEU_KHONG_HOP_LE') {
    return res.status(400).json({
      error: { code: 'DU_LIEU_KHONG_HOP_LE', message: loi.message, fields },
    });
  }
  if (loi.code === 'CHUYEN_TRANG_THAI_KHONG_HOP_LE' || loi.code === 'TRANG_THAI_KHONG_HOP_LE') {
    return res.status(400).json({ error: { code: 'INVALID_TRANSITION', message: loi.message, fields } });
  }
  if (loi.code === 'UU_TIEN_KHONG_HOP_LE') {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: loi.message } });
  }

  // 404: tài nguyên được tham chiếu không tồn tại.
  if (loi.code === 'KHACH_KHONG_TON_TAI' || loi.code === 'THIET_BI_KHONG_TON_TAI'
    || loi.code === 'NHOM_SU_CO_KHONG_TON_TAI' || loi.code === 'TRUNG_TAM_KHONG_TON_TAI'
    || loi.code === 'PHIEU_KHONG_TON_TAI') {
    return res.status(404).json({ error: { code: 'RESOURCE_NOT_FOUND', message: loi.message } });
  }

  // 409: dữ liệu hợp lệ nhưng xung đột với trạng thái hiện tại của hệ thống.
  if (loi.code === 'THIET_BI_KHONG_THUOC_KHACH' || loi.code === 'PHIEU_DANG_MO'
    || loi.code === 'TRANG_THAI_DA_THAY_DOI' || loi.code === 'KHONG_DUOC_XOA_PHIEU') {
    return res.status(409).json({ error: { code: loi.code, message: loi.message } });
  }

  return null;
}

/**
 * Tạo router cho các endpoint phiếu.
 *
 * @param {import('../services/ticket.service').DichVuPhieu} dichVuPhieu Service phiếu.
 * @returns {import('express').Router}
 */
function taoRoutePhieu(dichVuPhieu) {
  const router = express.Router();

  /**
   * POST /tickets — tạo phiếu (US3, US4, US5).
   * Trả 201 khi tạo mới, 200 khi request_id đã được xử lý trước đó (NFR4).
   */
  router.post('/tickets', async (req, res, next) => {
    try {
      const duLieu = kiemTraTiepNhan(req.body);
      // QT-14: nhân viên chỉ được tạo phiếu cho trung tâm mình. Chặn ở đây thay
      // vì tin vào giao diện — gọi thẳng API vẫn phải bị giới hạn.
      if (req.nguCanh?.vaiTro === 'nhan_vien'
        && req.nguCanh.centerId !== null
        && duLieu.center_id !== req.nguCanh.centerId) {
        return res.status(403).json({
          error: { code: 'FORBIDDEN', message: 'Bạn chỉ được tạo phiếu cho trung tâm của mình.' },
        });
      }
      const phieu = await dichVuPhieu.taoPhieu(duLieu);
      const maHttp = phieu.la_phieu_cu ? 200 : 201;
      // Trả qua hợp đồng để giao diện không phụ thuộc tên cột CSDL; giữ nguyên
      // hai cờ cảnh báo QT-05 bằng cách trải chúng ra sau khi đã map.
      return res.status(maHttp).json({
        data: {
          ...toTicketView(phieu, { vaiTro: req.nguCanh?.vaiTro }),
          la_phieu_cu: Boolean(phieu.la_phieu_cu),
          ...(phieu.canh_bao_bao_hanh ? {
            canh_bao_bao_hanh: phieu.canh_bao_bao_hanh,
            can_quan_ly_phe_duyet: phieu.can_quan_ly_phe_duyet,
          } : {}),
        },
      });
    } catch (loi) {
      const daGui = guiLoi(res, loi);
      if (daGui) return daGui;
      return next(loi);
    }
  });

  /**
   * GET /tickets — danh sách phiếu có lọc và phân trang (US6, UC5).
   * QT-14 được áp ở đây: nhân viên bị giới hạn theo trung tâm của mình.
   */
  router.get('/tickets', async (req, res, next) => {
    try {
      const boLoc = kiemTraBoLoc(req.query);
      const nguCanh = req.nguCanh || {};

      // QT-14: nhân viên chỉ xem trung tâm mình. Nếu họ yêu cầu trung tâm khác
      // thì trả 403 thay vì âm thầm đổi điều kiện lọc — im lặng sẽ khiến người
      // dùng tưởng dữ liệu trống.
      if (nguCanh.vaiTro === 'nhan_vien' && nguCanh.centerId !== null) {
        if (boLoc.centerId && boLoc.centerId !== nguCanh.centerId) {
          return res.status(403).json({
            error: { code: 'FORBIDDEN', message: 'Bạn không thuộc trung tâm được yêu cầu.' },
          });
        }
        boLoc.centerId = nguCanh.centerId;
      }

      const { rows, total } = await dichVuPhieu.lietKePhieu(boLoc);
      return res.json(toTicketPage(
        { rows, total },
        { page: boLoc.page, pageSize: boLoc.pageSize },
        { vaiTro: nguCanh.vaiTro },
      ));
    } catch (loi) {
      const daGui = guiLoi(res, loi);
      if (daGui) return daGui;
      return next(loi);
    }
  });

  /**
   * GET /tickets/:ticketId — chi tiết phiếu (US6).
   * QT-14: không được xem phiếu của trung tâm khác.
   */
  router.get('/tickets/:ticketId', async (req, res, next) => {
    try {
      const phieu = await dichVuPhieu.timPhieuTheoId(Number(req.params.ticketId));
      if (!coTheXemTrungTam(req.nguCanh || {}, phieu.center_id)) {
        return res.status(403).json({
          error: { code: 'FORBIDDEN', message: 'Bạn không thuộc trung tâm của phiếu này.' },
        });
      }
      // Gộp lịch sử vào response chi tiết: màn hình chỉ cần một request, và
      // QT-06 (các bước chuyển hợp lệ) được trả từ domain thay vì để giao diện
      // tự đoán.
      const lichSu = await dichVuPhieu.lichSuTrangThai(phieu.ticket_id);
      return res.json({
        data: toTicketDetailView(phieu, lichSu, { vaiTro: req.nguCanh?.vaiTro }),
      });
    } catch (loi) {
      const daGui = guiLoi(res, loi);
      if (daGui) return daGui;
      return next(loi);
    }
  });

  /**
   * GET /tickets/:ticketId/history — lịch sử trạng thái (UC6).
   */
  router.get('/tickets/:ticketId/history', async (req, res, next) => {
    try {
      const lichSu = await dichVuPhieu.lichSuTrangThai(Number(req.params.ticketId));
      return res.json({ data: lichSu.map(toHistoryView) });
    } catch (loi) {
      const daGui = guiLoi(res, loi);
      if (daGui) return daGui;
      return next(loi);
    }
  });

  /**
   * POST /tickets/:ticketId/transitions — chuyển trạng thái (US7, QT-06).
   * Dùng POST vì đây là hành động tạo một bản ghi lịch sử, không phải thay
   * thế toàn bộ tài nguyên như PUT.
   */
  router.post('/tickets/:ticketId/transitions', async (req, res, next) => {
    try {
      const duLieu = kiemTraChuyenTrangThai(req.body || {});
      const ketQua = await dichVuPhieu.chuyenTrangThai(Number(req.params.ticketId), duLieu);
      return res.json({ data: ketQua });
    } catch (loi) {
      const daGui = guiLoi(res, loi);
      if (daGui) return daGui;
      return next(loi);
    }
  });

  /**
   * PUT /tickets/:ticketId — cập nhật nội dung phiếu (không đổi trạng thái).
   */
  router.put('/tickets/:ticketId', async (req, res, next) => {
    try {
      const phieu = await dichVuPhieu.capNhatPhieu(Number(req.params.ticketId), req.body || {});
      return res.json({ data: toTicketView(phieu, { vaiTro: req.nguCanh?.vaiTro }) });
    } catch (loi) {
      const daGui = guiLoi(res, loi);
      if (daGui) return daGui;
      return next(loi);
    }
  });

  /**
   * DELETE /tickets/:ticketId — luôn bị từ chối (QT-13).
   * Giữ endpoint để trả thông báo rõ ràng thay vì 404 khó hiểu.
   */
  router.delete('/tickets/:ticketId', async (req, res, next) => {
    try {
      await dichVuPhieu.xoaPhieu(Number(req.params.ticketId));
      return res.status(204).send();
    } catch (loi) {
      const daGui = guiLoi(res, loi);
      if (daGui) return daGui;
      return next(loi);
    }
  });

  return router;
}

module.exports = { taoRoutePhieu };
