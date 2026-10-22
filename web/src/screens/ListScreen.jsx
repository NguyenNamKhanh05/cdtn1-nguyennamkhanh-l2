import React, { useEffect, useMemo, useState } from 'react';
import DataState from '../components/DataState';
import { layDanhSachPhieu, layDanhMuc } from '../api/tickets';
import { docPhien } from '../auth';
import { lopTrangThai, lopUuTien, moTaHan, ngayGio } from '../format';

const TRANG_THAI_LOC = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'MOI', label: 'Mới tiếp nhận' },
  { value: 'DA_PHAN_CONG', label: 'Đã phân công' },
  { value: 'DANG_XU_LY', label: 'Đang xử lý' },
  { value: 'CHO_LINH_KIEN', label: 'Chờ linh kiện' },
  { value: 'HOAN_TAT', label: 'Hoàn tất' },
  { value: 'DA_DONG', label: 'Đã đóng' },
  { value: 'DA_HUY', label: 'Đã hủy' },
];

/**
 * Màn hình danh sách phiếu — trả lời câu hỏi "hôm nay tôi phải xử lý phiếu nào
 * trước?" (Buổi 9).
 *
 * Danh sách đã được backend sắp theo hạn cam kết tăng dần (QT-04). Giao diện
 * không sắp lại để tránh hai thứ tự khác nhau giữa API và màn hình.
 *
 * @returns {React.ReactElement}
 */
export default function ListScreen() {
  const phien = docPhien();
  const [boLoc, setBoLoc] = useState({ status: '', centerId: '' });
  const [duLieu, setDuLieu] = useState({ data: [], meta: { total: 0 } });
  const [dangTai, setDangTai] = useState(true);
  const [loi, setLoi] = useState(null);
  const [lanThu, setLanThu] = useState(0);
  const [trungTam, setTrungTam] = useState([]);

  // Danh mục trung tâm chỉ cần cho quản lý/ban giám đốc; nhân viên bị QT-14
  // giới hạn sẵn ở backend nên không hiện bộ lọc này.
  useEffect(() => {
    if (phien?.vaiTro === 'nhan_vien') return undefined;
    let huy = false;
    layDanhMuc()
      .then((kq) => { if (!huy) setTrungTam(kq.trungTam); })
      .catch(() => { /* lỗi danh mục không chặn danh sách; bộ lọc chỉ là phụ */ });
    return () => { huy = true; };
  }, [phien?.vaiTro]);

  useEffect(() => {
    let huy = false;
    setDangTai(true);
    setLoi(null);
    layDanhSachPhieu({
      status: boLoc.status || undefined,
      centerId: boLoc.centerId ? Number(boLoc.centerId) : undefined,
    })
      .then((kq) => { if (!huy) setDuLieu(kq); })
      .catch((e) => { if (!huy) setLoi(e); })
      .finally(() => { if (!huy) setDangTai(false); });
    return () => { huy = true; };
  }, [boLoc.status, boLoc.centerId, lanThu]);

  const soQuaHan = useMemo(
    () => duLieu.data.filter((p) => p.is_overdue).length,
    [duLieu.data],
  );

  const xoaBoLoc = () => setBoLoc({ status: '', centerId: '' });

  return (
    <section>
      <div className="dau-trang">
        <div>
          <p className="nhan-nho">Hàng đợi tiếp nhận</p>
          <h1>Phiếu bảo hành</h1>
          <p className="mo-ta">
            {dangTai ? (
              'Đang tải danh sách phiếu…'
            ) : loi ? (
              'Không tải được danh sách phiếu.'
            ) : (
              <>
                Sắp theo hạn cam kết. {duLieu.meta.total} phiếu khớp bộ lọc
                {soQuaHan > 0 && (
                  <> · <span className="chu-do">{soQuaHan} phiếu quá hạn</span></>
                )}
                .
              </>
            )}
          </p>
        </div>
        <a className="btn btn-chinh" href="#/tiep-nhan">+ Tiếp nhận phiếu</a>
      </div>

      <div className="bo-loc">
        <label>
          Trạng thái
          <select
            value={boLoc.status}
            onChange={(e) => setBoLoc((cu) => ({ ...cu, status: e.target.value }))}
          >
            {TRANG_THAI_LOC.map((tt) => (
              <option key={tt.value} value={tt.value}>{tt.label}</option>
            ))}
          </select>
        </label>

        {phien?.vaiTro !== 'nhan_vien' && trungTam.length > 0 && (
          <label>
            Trung tâm
            <select
              value={boLoc.centerId}
              onChange={(e) => setBoLoc((cu) => ({ ...cu, centerId: e.target.value }))}
            >
              <option value="">Tất cả trung tâm</option>
              {trungTam.map((tt) => (
                <option key={tt.center_id} value={tt.center_id}>{tt.center_name}</option>
              ))}
            </select>
          </label>
        )}

        {(boLoc.status || boLoc.centerId) && (
          <button type="button" className="btn btn-phu" onClick={xoaBoLoc}>Xóa bộ lọc</button>
        )}
      </div>

      <DataState
        dangTai={dangTai}
        loi={loi}
        rong={!dangTai && !loi && duLieu.data.length === 0}
        onThuLai={() => setLanThu((n) => n + 1)}
        tieuDeRong="Không có phiếu nào khớp bộ lọc"
        goiYRong="Thử bỏ bộ lọc trạng thái hoặc chọn khoảng thời gian khác."
        hanhDongRong={(
          <button type="button" className="btn btn-phu" onClick={xoaBoLoc}>
            Xóa bộ lọc
          </button>
        )}
      >
        <div className="bang-cuon">
          <table className="bang">
            <thead>
              <tr>
                <th>Mã phiếu</th>
                <th>Khách hàng</th>
                <th>Thiết bị / lỗi</th>
                <th>Ưu tiên</th>
                <th>Trạng thái</th>
                <th>Hạn cam kết</th>
                <th>Trung tâm</th>
              </tr>
            </thead>
            <tbody>
              {duLieu.data.map((phieu) => {
                const daKetThuc = ['HOAN_TAT', 'DA_DONG', 'DA_HUY'].includes(phieu.status);
                const han = moTaHan(phieu.due_date, daKetThuc);
                return (
                  <tr key={phieu.ticket_id} className={phieu.is_overdue ? 'dong-qua-han' : ''}>
                    <td>
                      <a className="ma-phieu" href={`#/tickets/${phieu.ticket_id}`}>
                        {phieu.ticket_code}
                      </a>
                    </td>
                    <td>
                      <div className="ten-khach">{phieu.customer_name || '(không rõ)'}</div>
                      <div className="phu">{phieu.customer_phone || '—'}</div>
                    </td>
                    <td>
                      <div>{phieu.issue_desc}</div>
                      <div className="phu">{phieu.serial_no || '—'} · {phieu.category_name || '—'}</div>
                    </td>
                    <td><span className={lopUuTien(phieu.priority)}>{phieu.priority_label}</span></td>
                    <td><span className={lopTrangThai(phieu.status)}>{phieu.status_label}</span></td>
                    <td>
                      <div>{ngayGio(phieu.due_date)}</div>
                      <div className={`phu muc-${han.mucDo}`}>{han.text}</div>
                    </td>
                    <td>{phieu.center_name || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </DataState>
    </section>
  );
}
