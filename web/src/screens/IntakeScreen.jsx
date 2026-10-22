import React, { useEffect, useRef, useState } from 'react';
import DataState from '../components/DataState';
import {
  layDanhMuc,
  layThietBiCuaKhach,
  taoKhachHang,
  taoPhieu,
  taoThietBi,
  traKhachTheoSo,
} from '../api/tickets';
import { docPhien } from '../auth';
import { ngayGio, ngayThang } from '../format';

/** Sinh khóa chống trùng cho một lần tiếp nhận (NFR4). */
function taoRequestId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback cho trình duyệt cũ; đủ duy nhất trong phạm vi một phiên demo.
  return `ui-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/**
 * Màn hình tiếp nhận phiếu — luồng chính của L2 (UC1 → UC4).
 *
 * Luồng: tra số điện thoại (QT-01/02) → chọn hoặc thêm thiết bị (QT-03) →
 * nhập lỗi, chọn nhóm và mức ưu tiên (QT-04) → tạo phiếu. Thiết bị chưa có
 * ngày mua vẫn tạo được nhưng hiện cảnh báo "chưa xác minh bảo hành" (QT-05).
 *
 * @returns {React.ReactElement}
 */
export default function IntakeScreen() {
  const phien = docPhien();

  const [danhMuc, setDanhMuc] = useState({ nhomSuCo: [], trungTam: [] });
  const [dangTaiDanhMuc, setDangTaiDanhMuc] = useState(true);
  const [loiDanhMuc, setLoiDanhMuc] = useState(null);
  const [lanThuDanhMuc, setLanThuDanhMuc] = useState(0);

  const [soDienThoai, setSoDienThoai] = useState('');
  const [dangTra, setDangTra] = useState(false);
  const [loiTra, setLoiTra] = useState(null);
  const [khachHang, setKhachHang] = useState(null);
  const [khongTimThay, setKhongTimThay] = useState(false);

  const [tenKhach, setTenKhach] = useState('');
  const [diaChi, setDiaChi] = useState('');
  const [dangTaoKhach, setDangTaoKhach] = useState(false);
  const [loiKhach, setLoiKhach] = useState(null);

  const [thietBis, setThietBis] = useState([]);
  const [dangTaiThietBi, setDangTaiThietBi] = useState(false);
  const [loiThietBi, setLoiThietBi] = useState(null);
  const [deviceId, setDeviceId] = useState('');

  const [hienFormThietBi, setHienFormThietBi] = useState(false);
  const [serial, setSerial] = useState('');
  const [ngayMua, setNgayMua] = useState('');
  const [soThang, setSoThang] = useState('12');
  const [dangTaoThietBi, setDangTaoThietBi] = useState(false);
  const [loiThietBiForm, setLoiThietBiForm] = useState(null);

  const [categoryId, setCategoryId] = useState('');
  const [centerId, setCenterId] = useState('');
  const [priority, setPriority] = useState('CAO');
  const [issueDesc, setIssueDesc] = useState('');
  const [dangGui, setDangGui] = useState(false);
  const [loiGui, setLoiGui] = useState(null);
  const [ketQua, setKetQua] = useState(null);

  // NFR4: giữ nguyên request_id giữa các lần bấm "Thử lại" để backend nhận ra
  // đây là cùng một yêu cầu, tránh tạo hai phiếu khi mạng chập chờn.
  const requestId = useRef(null);

  useEffect(() => {
    let huy = false;
    setDangTaiDanhMuc(true);
    setLoiDanhMuc(null);
    layDanhMuc()
      .then((kq) => {
        if (huy) return;
        setDanhMuc(kq);
        if (kq.nhomSuCo.length > 0) setCategoryId(String(kq.nhomSuCo[0].category_id));
        // Ưu tiên trung tâm của nhân viên đang đăng nhập (QT-14).
        const macDinh = phien?.centerId
          ? kq.trungTam.find((tt) => tt.center_id === phien.centerId)
          : null;
        setCenterId(String((macDinh || kq.trungTam[0])?.center_id || ''));
      })
      .catch((e) => { if (!huy) setLoiDanhMuc(e); })
      .finally(() => { if (!huy) setDangTaiDanhMuc(false); });
    return () => { huy = true; };
  }, [lanThuDanhMuc, phien?.centerId]);

  const taiThietBi = async (customerId) => {
    setDangTaiThietBi(true);
    setLoiThietBi(null);
    try {
      const ds = await layThietBiCuaKhach(customerId);
      setThietBis(ds);
      setDeviceId(ds.length > 0 ? String(ds[0].device_id) : '');
      return ds;
    } catch (e) {
      setLoiThietBi(e);
      return [];
    } finally {
      setDangTaiThietBi(false);
    }
  };

  const traCuu = async (suKien) => {
    suKien.preventDefault();
    setLoiTra(null);
    setKhongTimThay(false);
    setKhachHang(null);
    setKetQua(null);
    requestId.current = null;
    setDangTra(true);
    try {
      const kh = await traKhachTheoSo(soDienThoai);
      setKhachHang(kh);
      setTenKhach(kh.full_name);
      setDiaChi(kh.address || '');
      await taiThietBi(kh.customer_id);
    } catch (e) {
      if (e.code === 'CUSTOMER_NOT_FOUND') {
        // UC2: số chưa có thì mở form tạo khách ngay tại chỗ, không bắt người
        // dùng chuyển màn hình và nhập lại số.
        setKhongTimThay(true);
        setTenKhach('');
        setDiaChi('');
        setThietBis([]);
      } else {
        setLoiTra(e);
      }
    } finally {
      setDangTra(false);
    }
  };

  const taoKhach = async (suKien) => {
    suKien.preventDefault();
    setDangTaoKhach(true);
    setLoiKhach(null);
    try {
      const kh = await taoKhachHang({ full_name: tenKhach, phone: soDienThoai, address: diaChi });
      setKhachHang(kh);
      setKhongTimThay(false);
      await taiThietBi(kh.customer_id);
    } catch (e) {
      setLoiKhach(e);
    } finally {
      setDangTaoKhach(false);
    }
  };

  const themThietBi = async (suKien) => {
    suKien.preventDefault();
    setDangTaoThietBi(true);
    setLoiThietBiForm(null);
    try {
      const tb = await taoThietBi({
        customer_id: khachHang.customer_id,
        serial_no: serial.trim(),
        purchase_date: ngayMua || null,
        warranty_months: Number(soThang) || 12,
      });
      setSerial('');
      setNgayMua('');
      setHienFormThietBi(false);
      await taiThietBi(khachHang.customer_id);
      setDeviceId(String(tb.device_id));
    } catch (e) {
      setLoiThietBiForm(e);
    } finally {
      setDangTaoThietBi(false);
    }
  };

  const guiPhieu = async (suKien) => {
    suKien.preventDefault();
    setLoiGui(null);
    if (!requestId.current) requestId.current = taoRequestId();
    setDangGui(true);
    try {
      const phieu = await taoPhieu({
        customer_id: khachHang.customer_id,
        device_id: Number(deviceId),
        center_id: Number(centerId),
        category_id: Number(categoryId),
        issue_desc: issueDesc.trim(),
        priority,
        request_id: requestId.current,
      });
      setKetQua(phieu);
      requestId.current = null;
    } catch (e) {
      setLoiGui(e);
    } finally {
      setDangGui(false);
    }
  };

  const lamMoi = () => {
    setKetQua(null);
    setSoDienThoai('');
    setKhachHang(null);
    setKhongTimThay(false);
    setThietBis([]);
    setDeviceId('');
    setIssueDesc('');
    setPriority('CAO');
    setLoiGui(null);
    requestId.current = null;
  };

  if (ketQua) {
    return (
      <section>
        <div className="the the-thanh-cong">
          <p className="nhan-nho">Tiếp nhận thành công</p>
          <h1>{ketQua.ticket_code}</h1>
          <p className="mo-ta">
            Đã tạo phiếu cho <strong>{ketQua.customer_name}</strong> · hạn cam kết{' '}
            <strong>{ngayGio(ketQua.due_date)}</strong> (QT-04).
          </p>

          {ketQua.canh_bao_bao_hanh && (
            <div className="canh-bao canh-bao-vang" role="alert">
              <strong>Chưa xác minh bảo hành (QT-05).</strong> Thiết bị thiếu ngày mua.
              Phiếu vẫn được ghi nhận nhưng cần quản lý phê duyệt trước khi kết luận
              từ chối bảo hành.
            </div>
          )}

          <dl className="tom-tat">
            <div><dt>Khách hàng</dt><dd>{ketQua.customer_name} · {ketQua.customer_phone}</dd></div>
            <div><dt>Thiết bị</dt><dd>{ketQua.serial_no} · mua {ngayThang(ketQua.purchase_date)}</dd></div>
            <div><dt>Nhóm sự cố</dt><dd>{ketQua.category_name}</dd></div>
            <div><dt>Trạng thái</dt><dd>{ketQua.status_label}</dd></div>
          </dl>

          <div className="nhom-nut">
            <a className="btn btn-chinh" href={`#/tickets/${ketQua.ticket_id}`}>Xem chi tiết phiếu</a>
            <button type="button" className="btn btn-phu" onClick={lamMoi}>Tiếp nhận phiếu khác</button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="dau-trang">
        <div>
          <p className="nhan-nho">Luồng L2</p>
          <h1>Tiếp nhận phiếu bảo hành</h1>
          <p className="mo-ta">Tra khách → chọn thiết bị → mô tả lỗi → tạo phiếu.</p>
        </div>
      </div>

      <DataState
        dangTai={dangTaiDanhMuc}
        loi={loiDanhMuc}
        onThuLai={() => setLanThuDanhMuc((n) => n + 1)}
      >
        <div className="the">
          <h2>Bước 1 · Khách hàng</h2>
          <form className="hang-nhap" onSubmit={traCuu}>
            <label className="o-nhap-lon">
              Số điện thoại
              <input
                type="tel"
                value={soDienThoai}
                onChange={(e) => setSoDienThoai(e.target.value)}
                placeholder="0901234567 hoặc +84901234567"
                required
              />
            </label>
            <button type="submit" className="btn btn-chinh" disabled={dangTra}>
              {dangTra ? 'Đang tra…' : 'Tra cứu'}
            </button>
          </form>

          {loiTra && (
            <div className="canh-bao canh-bao-do" role="alert">
              {loiTra.message} <code className="ma-loi">{loiTra.code}</code>
            </div>
          )}

          {khongTimThay && (
            <div className="hop-phu">
              <h3>Số này chưa có hồ sơ</h3>
              <p className="phu">
                Tạo khách mới rồi tiếp tục. Nếu số đã tồn tại do vừa có người tạo,
                hệ thống sẽ báo để dùng lại hồ sơ cũ (QT-01).
              </p>
              <form className="form-doc" onSubmit={taoKhach}>
                <label>
                  Họ tên
                  <input
                    value={tenKhach}
                    onChange={(e) => setTenKhach(e.target.value)}
                    required
                  />
                </label>
                <label>
                  Địa chỉ (không bắt buộc)
                  <input value={diaChi} onChange={(e) => setDiaChi(e.target.value)} />
                </label>
                <button type="submit" className="btn btn-chinh" disabled={dangTaoKhach}>
                  {dangTaoKhach ? 'Đang tạo…' : 'Tạo khách và tiếp tục'}
                </button>
              </form>
              {loiKhach && (
                <div className="canh-bao canh-bao-do" role="alert">
                  {loiKhach.message} <code className="ma-loi">{loiKhach.code}</code>
                </div>
              )}
            </div>
          )}

          {khachHang && (
            <div className="hop-phu hop-khach">
              <div>
                <strong>{khachHang.full_name}</strong>
                <div className="phu">{khachHang.phone} · {khachHang.address || 'Chưa có địa chỉ'}</div>
              </div>
              <span className="badge badge-moi">QT-01: dùng hồ sơ hiện có</span>
            </div>
          )}

          {khachHang && (
            <>
              <h2>Bước 2 · Thiết bị</h2>
              <DataState
                dangTai={dangTaiThietBi}
                loi={loiThietBi}
                rong={!dangTaiThietBi && !loiThietBi && thietBis.length === 0}
                tieuDeRong="Khách chưa có thiết bị nào"
                goiYRong="Thêm serial trên máy để có thể lập phiếu (QT-03)."
                hanhDongRong={(
                  <button type="button" className="btn btn-chinh" onClick={() => setHienFormThietBi(true)}>
                    + Thêm thiết bị
                  </button>
                )}
              >
                <div className="danh-sach-thiet-bi">
                  {thietBis.map((tb) => (
                    <label key={tb.device_id} className={`the-thiet-bi ${String(tb.device_id) === deviceId ? 'dang-chon' : ''}`}>
                      <input
                        type="radio"
                        name="thietBi"
                        value={tb.device_id}
                        checked={String(tb.device_id) === deviceId}
                        onChange={(e) => setDeviceId(e.target.value)}
                      />
                      <span>
                        <strong>{tb.serial_no}</strong>
                        <span className="phu">
                          Mua {ngayThang(tb.purchase_date)} · bảo hành {tb.warranty_months} tháng
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
                <button type="button" className="btn btn-phu" onClick={() => setHienFormThietBi((x) => !x)}>
                  {hienFormThietBi ? 'Đóng form thiết bị' : '+ Thêm thiết bị khác'}
                </button>
              </DataState>

              {hienFormThietBi && (
                <form className="hop-phu form-doc" onSubmit={themThietBi}>
                  <h3>Thiết bị mới</h3>
                  <label>
                    Serial / IMEI (6–50 ký tự)
                    <input value={serial} onChange={(e) => setSerial(e.target.value)} required />
                  </label>
                  <label>
                    Ngày mua (để trống nếu không xác minh được — QT-05)
                    <input type="date" value={ngayMua} onChange={(e) => setNgayMua(e.target.value)} />
                  </label>
                  <label>
                    Số tháng bảo hành
                    <input
                      type="number"
                      min="1"
                      value={soThang}
                      onChange={(e) => setSoThang(e.target.value)}
                    />
                  </label>
                  <button type="submit" className="btn btn-chinh" disabled={dangTaoThietBi}>
                    {dangTaoThietBi ? 'Đang lưu…' : 'Lưu thiết bị'}
                  </button>
                  {loiThietBiForm && (
                    <div className="canh-bao canh-bao-do" role="alert">
                      {loiThietBiForm.message} <code className="ma-loi">{loiThietBiForm.code}</code>
                    </div>
                  )}
                </form>
              )}

              {thietBis.length > 0 && (
                <>
                  <h2>Bước 3 · Nội dung lỗi</h2>
                  <form className="form-doc" onSubmit={guiPhieu}>
                    <div className="hai-cot-nhap">
                      <label>
                        Nhóm sự cố
                        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
                          {danhMuc.nhomSuCo.map((nhom) => (
                            <option key={nhom.category_id} value={nhom.category_id}>
                              {nhom.category_name} (ưu tiên gợi ý: {nhom.default_priority})
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Trung tâm tiếp nhận
                        <select value={centerId} onChange={(e) => setCenterId(e.target.value)} required>
                          {danhMuc.trungTam.map((tt) => (
                            <option key={tt.center_id} value={tt.center_id}>{tt.center_name}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Mức ưu tiên (QT-04)
                        <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                          <option value="CAO">Cao — hạn 24 giờ</option>
                          <option value="TRUNG_BINH">Trung bình — hạn 72 giờ</option>
                          <option value="THAP">Thấp — hạn 120 giờ</option>
                        </select>
                      </label>
                    </div>
                    <label>
                      Mô tả lỗi
                      <textarea
                        rows={4}
                        maxLength={2000}
                        value={issueDesc}
                        onChange={(e) => setIssueDesc(e.target.value)}
                        placeholder="Ví dụ: máy tự tắt nguồn sau khi sạc đầy"
                        required
                      />
                    </label>
                    <button type="submit" className="btn btn-chinh btn-rong" disabled={dangGui}>
                      {dangGui ? 'Đang tạo phiếu…' : 'Tạo phiếu tiếp nhận'}
                    </button>
                  </form>

                  {loiGui && (
                    <div className="canh-bao canh-bao-do" role="alert">
                      <strong>Không tạo được phiếu.</strong> {loiGui.message}
                      <code className="ma-loi">{loiGui.code}</code>
                      <p className="phu">
                        Dữ liệu đã nhập vẫn được giữ. Bấm tạo lại an toàn — cùng một
                        mã chống trùng nên không sinh phiếu thứ hai (NFR4).
                      </p>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </DataState>
    </section>
  );
}
