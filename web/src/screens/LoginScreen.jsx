import React, { useEffect, useState } from 'react';
import DataState from '../components/DataState';
import { layDanhMuc } from '../api/tickets';
import { nhanVaiTro } from '../auth';

/**
 * Màn hình chọn vai trò — thay cho đăng nhập thật ở giai đoạn BT2.
 *
 * Vì sao vẫn làm màn hình này: QT-14/QT-15 chỉ chứng minh được khi giao diện
 * gửi đúng vai trò. Đây cũng là chỗ duy nhất để đổi vai trò khi chấm bài, thay
 * vì sửa tay header trong Postman.
 *
 * @param {object} props
 * @param {() => void} props.onDangNhap Gọi sau khi đã lưu phiên.
 * @returns {React.ReactElement}
 */
export default function LoginScreen({ onDangNhap }) {
  const [vaiTro, setVaiTro] = useState('nhan_vien');
  const [centerId, setCenterId] = useState(1);
  const [trungTam, setTrungTam] = useState([]);
  const [dangTai, setDangTai] = useState(true);
  const [loi, setLoi] = useState(null);

  const taiDanhMuc = () => {
    setDangTai(true);
    setLoi(null);
    layDanhMuc()
      .then((kq) => {
        setTrungTam(kq.trungTam);
        if (kq.trungTam.length > 0) setCenterId(kq.trungTam[0].center_id);
      })
      .catch((e) => setLoi(e))
      .finally(() => setDangTai(false));
  };

  useEffect(() => {
    taiDanhMuc();
  }, []);

  const gui = (suKien) => {
    suKien.preventDefault();
    onDangNhap({
      vaiTro,
      centerId: vaiTro === 'ban_giam_doc' ? null : Number(centerId),
      tenHienThi: nhanVaiTro(vaiTro),
    });
  };

  return (
    <div className="trang-dang-nhap">
      <div className="the-dang-nhap">
        <p className="nhan-nho">Mekong Mobile · L2</p>
        <h1>Tiếp nhận và phân loại yêu cầu bảo hành</h1>
        <p className="mo-ta">
          Chọn vai trò để xem giao diện đúng quyền. Đây là đăng nhập mô phỏng:
          backend chưa có JWT nên vai trò được gửi qua header, thay được bằng
          đăng nhập thật mà không phải sửa màn hình nghiệp vụ.
        </p>

        <DataState dangTai={dangTai} loi={loi} onThuLai={taiDanhMuc}>
          <form onSubmit={gui} className="form-doc">
            <label htmlFor="vaiTro">Vai trò</label>
            <select
              id="vaiTro"
              value={vaiTro}
              onChange={(e) => setVaiTro(e.target.value)}
            >
              <option value="nhan_vien">Nhân viên tiếp nhận (QT-14: chỉ trung tâm mình)</option>
              <option value="quan_ly">Quản lý trung tâm (thấy số điện thoại đầy đủ)</option>
              <option value="ban_giam_doc">Ban giám đốc (thấy toàn công ty)</option>
            </select>

            {vaiTro !== 'ban_giam_doc' && (
              <>
                <label htmlFor="centerId">Trung tâm làm việc</label>
                <select
                  id="centerId"
                  value={centerId}
                  onChange={(e) => setCenterId(e.target.value)}
                >
                  {trungTam.map((tt) => (
                    <option key={tt.center_id} value={tt.center_id}>
                      {tt.center_name}
                    </option>
                  ))}
                </select>
              </>
            )}

            <button type="submit" className="btn btn-chinh btn-rong">
              Vào hệ thống
            </button>
          </form>
        </DataState>

        <p className="ghi-chu-chan">
          Gợi ý khi chấm: đăng nhập <strong>Nhân viên</strong> để thấy số điện
          thoại bị che, sau đó đổi sang <strong>Quản lý</strong> để thấy số đầy đủ
          (QT-15).
        </p>
      </div>
    </div>
  );
}
