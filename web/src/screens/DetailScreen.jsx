import React, { useEffect, useState } from 'react';
import DataState from '../components/DataState';
import { layChiTietPhieu, chuyenTrangThai } from '../api/tickets';
import { lopTrangThai, lopUuTien, moTaHan, ngayGio, ngayThang } from '../format';

/**
 * Màn hình chi tiết phiếu — cho người dùng thấy "vì sao phiếu này đang ở đây"
 * và "bước tiếp theo được phép làm gì" (Buổi 9).
 *
 * Các bước chuyển trạng thái lấy từ `chuyen_tiep_duoc_phep` do backend trả về,
 * không tự suy ra từ danh sách trạng thái — QT-06 chỉ có một nguồn là
 * `src/domain/ticket-status.js`.
 *
 * @param {object} props
 * @param {number} props.ticketId Mã phiếu lấy từ hash URL.
 * @returns {React.ReactElement}
 */
export default function DetailScreen({ ticketId }) {
  const [phieu, setPhieu] = useState(null);
  const [dangTai, setDangTai] = useState(true);
  const [loi, setLoi] = useState(null);
  const [lanThu, setLanThu] = useState(0);
  const [ghiChu, setGhiChu] = useState('');
  const [dangChuyen, setDangChuyen] = useState(false);
  const [loiChuyen, setLoiChuyen] = useState(null);

  useEffect(() => {
    let huy = false;
    setDangTai(true);
    setLoi(null);
    layChiTietPhieu(ticketId)
      .then((kq) => { if (!huy) setPhieu(kq); })
      .catch((e) => { if (!huy) setLoi(e); })
      .finally(() => { if (!huy) setDangTai(false); });
    return () => { huy = true; };
  }, [ticketId, lanThu]);

  const doiTrangThai = async (toStatus) => {
    setDangChuyen(true);
    setLoiChuyen(null);
    try {
      await chuyenTrangThai(ticketId, toStatus, ghiChu.trim() || null);
      setGhiChu('');
      // Tải lại từ server thay vì tự sửa state: lịch sử và các bước chuyển
      // tiếp theo phải do backend quyết định, tránh giao diện tự đoán sai.
      setLanThu((n) => n + 1);
    } catch (e) {
      setLoiChuyen(e);
    } finally {
      setDangChuyen(false);
    }
  };

  const quayLai = <a className="lien-ket-quay-lai" href="#/tickets">← Danh sách phiếu</a>;

  return (
    <section>
      {quayLai}

      <DataState
        dangTai={dangTai}
        loi={loi}
        onThuLai={() => setLanThu((n) => n + 1)}
      >
        {phieu && (
          <>
            <div className="dau-trang">
              <div>
                <p className="nhan-nho">{phieu.center_name || 'Trung tâm bảo hành'}</p>
                <h1>{phieu.ticket_code}</h1>
                <p className="mo-ta">{phieu.issue_desc}</p>
              </div>
              <div className="nhom-badge">
                <span className={lopTrangThai(phieu.status)}>{phieu.status_label}</span>
                <span className={lopUuTien(phieu.priority)}>Ưu tiên {phieu.priority_label}</span>
              </div>
            </div>

            {phieu.is_overdue && (
              <div className="canh-bao canh-bao-do" role="alert">
                <strong>Phiếu đã quá hạn cam kết.</strong> Hạn {ngayGio(phieu.due_date)} —
                cần xử lý hoặc báo quản lý ngay (QT-04).
              </div>
            )}

            {phieu.warranty_status === 'CHUA_XAC_MINH' && (
              <div className="canh-bao canh-bao-vang" role="alert">
                <strong>Chưa xác minh bảo hành.</strong> Thiết bị không có ngày mua nên
                không kết luận được còn hay hết hạn — cần quản lý phê duyệt trước khi
                từ chối bảo hành (QT-05).
              </div>
            )}

            <div className="luoi-thong-tin">
              <div className="o-thong-tin">
                <span className="nhan">Khách hàng</span>
                <strong>{phieu.customer_name || '—'}</strong>
                <span className="phu">{phieu.customer_phone || '—'}</span>
              </div>
              <div className="o-thong-tin">
                <span className="nhan">Thiết bị</span>
                <strong>{phieu.serial_no || '—'}</strong>
                <span className="phu">
                  Mua {ngayThang(phieu.purchase_date)} · bảo hành {phieu.warranty_months ?? '—'} tháng
                </span>
              </div>
              <div className="o-thong-tin">
                <span className="nhan">Nhóm sự cố</span>
                <strong>{phieu.category_name || '—'}</strong>
                <span className="phu">{phieu.status_label}</span>
              </div>
              <div className="o-thong-tin">
                <span className="nhan">Thời gian</span>
                <strong>{ngayGio(phieu.received_at)}</strong>
                <span className={`phu ${phieu.is_overdue ? 'muc-qua-han' : ''}`}>
                  Hạn {ngayGio(phieu.due_date)} · {moTaHan(phieu.due_date, phieu.closed_at !== null).text}
                </span>
              </div>
            </div>

            <div className="hai-cot">
              <div className="the">
                <h2>Bước tiếp theo</h2>
                {phieu.chuyen_tiep_duoc_phep.length === 0 ? (
                  <p className="phu">Phiếu đã ở trạng thái kết thúc, không chuyển tiếp được (QT-06).</p>
                ) : (
                  <>
                    <label htmlFor="ghiChu">Ghi chú xử lý (không bắt buộc)</label>
                    <input
                      id="ghiChu"
                      type="text"
                      maxLength={255}
                      value={ghiChu}
                      onChange={(e) => setGhiChu(e.target.value)}
                      placeholder="Ví dụ: đã gọi khách, hẹn 15h"
                    />
                    <div className="nhom-nut">
                      {phieu.chuyen_tiep_duoc_phep.map((buoc) => (
                        <button
                          key={buoc.status}
                          type="button"
                          className="btn btn-chinh"
                          disabled={dangChuyen}
                          onClick={() => doiTrangThai(buoc.status)}
                        >
                          {dangChuyen ? 'Đang chuyển…' : `Chuyển sang: ${buoc.label}`}
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {loiChuyen && (
                  <div className="canh-bao canh-bao-do" role="alert">
                    <strong>Không chuyển được trạng thái.</strong> {loiChuyen.message}
                    <code className="ma-loi">{loiChuyen.code}</code>
                  </div>
                )}
              </div>

              <div className="the">
                <h2>Lịch sử trạng thái</h2>
                {phieu.lich_su.length === 0 ? (
                  <p className="phu">Chưa có ghi nhận chuyển trạng thái.</p>
                ) : (
                  <ol className="dong-thoi-gian">
                    {phieu.lich_su.slice().reverse().map((dong) => (
                      <li key={dong.log_id}>
                        <div className="moc" />
                        <div>
                          <strong>
                            {dong.from_label ? `${dong.from_label} → ` : ''}{dong.to_label}
                          </strong>
                          <div className="phu">{ngayGio(dong.changed_at)}</div>
                          {dong.note && <div className="ghi-chu">{dong.note}</div>}
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </div>
          </>
        )}
      </DataState>
    </section>
  );
}
