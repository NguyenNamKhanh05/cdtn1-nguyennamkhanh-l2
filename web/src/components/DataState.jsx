import React from 'react';

/**
 * Khung hiển thị ba trạng thái bắt buộc của mọi màn hình (Buổi 9):
 * đang tải · rỗng · lỗi.
 *
 * Vì sao dùng chung một component: nếu mỗi màn hình tự vẽ, sẽ có màn hình quên
 * trạng thái rỗng (bảng trống trơn) hoặc quên nút thử lại khi lỗi. Gom vào một
 * chỗ thì ba trạng thái luôn đi cùng nhau và câu chữ thống nhất.
 *
 * @param {object} props
 * @param {boolean} props.dangTai Đang chờ dữ liệu.
 * @param {Error & {code?: string}|null} props.loi Lỗi đã chuẩn hóa từ `goiApi`.
 * @param {boolean} [props.rong=false] Dữ liệu tải xong nhưng không có dòng nào.
 * @param {() => void} [props.onThuLai] Hành động thử lại khi lỗi.
 * @param {string} [props.tieuDeRong='Không có dữ liệu'] Câu giải thích vì sao rỗng.
 * @param {string} [props.goiYRong] Gợi ý hành động tiếp theo.
 * @param {React.ReactNode} [props.hanhDongRong] Nút hành động cho trạng thái rỗng.
 * @param {React.ReactNode} props.children Nội dung khi có dữ liệu.
 * @returns {React.ReactElement}
 */
export default function DataState({
  dangTai,
  loi,
  rong = false,
  onThuLai,
  tieuDeRong = 'Không có dữ liệu',
  goiYRong,
  hanhDongRong,
  children,
}) {
  if (dangTai) {
    return (
      <div className="state state-loading" aria-busy="true" aria-live="polite">
        <div className="skeleton skeleton-title" />
        <div className="skeleton" />
        <div className="skeleton" />
        <div className="skeleton skeleton-short" />
        <p className="state-mo">Đang tải dữ liệu…</p>
      </div>
    );
  }

  if (loi) {
    // Buổi 9: thông báo lỗi phải nói chuyện gì · vì sao · làm gì tiếp, và
    // KHÔNG hiện chi tiết kỹ thuật (tên bảng, câu SQL). Mã lỗi chỉ hiện nhỏ để
    // người chấm đối chiếu tài liệu.
    return (
      <div className="state state-error" role="alert">
        <h3>Không tải được dữ liệu</h3>
        <p>{loi.message}</p>
        <p className="state-mo">
          {loi.code === 'MAT_KET_NOI'
            ? 'Kiểm tra server đang chạy (npm start) rồi thử lại.'
            : 'Đây là lỗi từ hệ thống. Nếu lặp lại, ghi lại mã bên dưới để báo giảng viên.'}
        </p>
        <div className="state-hanh-dong">
          {onThuLai && (
            <button type="button" className="btn btn-chinh" onClick={onThuLai}>
              Thử lại
            </button>
          )}
          {loi.code && <code className="ma-loi">{loi.code}</code>}
        </div>
      </div>
    );
  }

  if (rong) {
    return (
      <div className="state state-empty">
        <h3>{tieuDeRong}</h3>
        {goiYRong && <p>{goiYRong}</p>}
        {hanhDongRong && <div className="state-hanh-dong">{hanhDongRong}</div>}
      </div>
    );
  }

  return children;
}
