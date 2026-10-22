import React, { useEffect, useState } from 'react';
import LoginScreen from './screens/LoginScreen';
import ListScreen from './screens/ListScreen';
import DetailScreen from './screens/DetailScreen';
import IntakeScreen from './screens/IntakeScreen';
import { docPhien, luuPhien, nhanVaiTro, xoaPhien } from './auth';

/**
 * Đọc route từ hash để không cần cấu hình fallback phía server.
 *
 * @returns {{ten: 'danh-sach'|'chi-tiet'|'tiep-nhan', ticketId: number|null}}
 */
function docRoute() {
  const hash = window.location.hash || '#/tickets';
  const khopChiTiet = /^#\/tickets\/(\d+)/.exec(hash);
  if (khopChiTiet) return { ten: 'chi-tiet', ticketId: Number(khopChiTiet[1]) };
  if (hash.startsWith('#/tiep-nhan')) return { ten: 'tiep-nhan', ticketId: null };
  return { ten: 'danh-sach', ticketId: null };
}

/**
 * Khung ứng dụng: chọn màn hình theo hash, hiển thị người dùng và trạng thái kết
 * nối.
 *
 * Vì sao dùng hash routing: Express chỉ phục vụ tệp tĩnh, không có rewrite cho
 * SPA. Hash không gửi lên server nên refresh ở `#/tickets/1` vẫn mở đúng màn
 * hình mà không phải thêm route giả.
 *
 * @returns {React.ReactElement}
 */
export default function App() {
  const [phien, setPhien] = useState(() => docPhien());
  const [route, setRoute] = useState(() => docRoute());
  const [health, setHealth] = useState(null);

  useEffect(() => {
    const capNhat = () => setRoute(docRoute());
    window.addEventListener('hashchange', capNhat);
    return () => window.removeEventListener('hashchange', capNhat);
  }, []);

  // Khi API trả 401, client xóa phiên và phát sự kiện; App quay về đăng nhập.
  useEffect(() => {
    const hetPhien = () => setPhien(null);
    window.addEventListener('cdtn1:het-phien', hetPhien);
    return () => window.removeEventListener('cdtn1:het-phien', hetPhien);
  }, []);

  // Hiển thị chế độ dữ liệu ngay trên header: người chấm biết đang xem
  // PostgreSQL hay bộ nhớ, tránh nhầm khi so kết quả với README.
  useEffect(() => {
    let huy = false;
    fetch('/health')
      .then((r) => r.json())
      .then((d) => { if (!huy) setHealth(d); })
      .catch(() => { if (!huy) setHealth({ status: 'error' }); });
    return () => { huy = true; };
  }, []);

  const dangNhap = (thongTin) => {
    luuPhien(thongTin);
    setPhien(thongTin);
    window.location.hash = '#/tickets';
  };

  const dangXuat = () => {
    xoaPhien();
    setPhien(null);
    window.location.hash = '#/tickets';
  };

  if (!phien) return <LoginScreen onDangNhap={dangNhap} />;

  const lopNav = (ten) => `nav-link ${route.ten === ten ? 'dang-chon' : ''}`;

  return (
    <div className="ung-dung">
      <header className="thanh-tren">
        <a className="thuong-hieu" href="#/tickets">
          <span className="logo">MM</span>
          <span>
            <strong>Mekong Mobile</strong>
            <small>Tiếp nhận bảo hành · L2</small>
          </span>
        </a>

        <nav className="dieu-huong">
          <a className={lopNav('danh-sach')} href="#/tickets">Phiếu</a>
          <a className={lopNav('tiep-nhan')} href="#/tiep-nhan">Tiếp nhận</a>
        </nav>

        <div className="nguoi-dung">
          <span className={`cham ${health?.connected ? 'cham-xanh' : 'cham-do'}`} />
          <span className="phu">
            {health?.database === 'postgresql' ? 'PostgreSQL' : health?.database === 'memory' ? 'Bộ nhớ' : 'Không rõ'}
          </span>
          <span className="vai-tro">{nhanVaiTro(phien.vaiTro)}</span>
          <button type="button" className="btn btn-nho" onClick={dangXuat}>Đăng xuất</button>
        </div>
      </header>

      <main className="noi-dung">
        {route.ten === 'tiep-nhan' && <IntakeScreen />}
        {route.ten === 'chi-tiet' && <DetailScreen ticketId={route.ticketId} />}
        {route.ten === 'danh-sach' && <ListScreen />}
      </main>

      <footer className="chan-trang">
        <span>Chuyên đề tốt nghiệp 1 · Nguyễn Nam Khánh · 2374802010222</span>
        <span>QT-01…QT-06, QT-13…QT-15 · QD-01</span>
      </footer>
    </div>
  );
}
