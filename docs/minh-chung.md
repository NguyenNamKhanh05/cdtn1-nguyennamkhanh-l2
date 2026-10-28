# Minh chứng L2 — phân loại theo mục nộp

Tài liệu này gom toàn bộ ảnh minh chứng đã chụp, xếp đúng ba mục của bài nộp:

- **MỤC 3 — Module cốt lõi:** quy tắc nghiệp vụ đã hiện thực, ảnh chụp chạy được.
- **MỤC 4 — Bộ kiểm thử:** ba trường hợp kiểm thử và ảnh chụp kết quả chạy PASS.
- **MỤC 5 — Module mở rộng / trình bày kết quả:** ảnh chụp cả ba trạng thái đang tải, rỗng, lỗi.

Mọi ảnh nằm trong `docs/export/`. Bộ sưu tập Postman dùng để chụp nằm ở
`docs/postman/CDTN1-L2.postman_collection.json` (18 request, có script kiểm tra).

---

## MỤC 3. Module cốt lõi

### 3.1. Ảnh Postman — kiểm chứng API và quy tắc nghiệp vụ

| Ảnh | Request | Quy tắc / nội dung đã hiện thực |
|---|---|---|
| `postman-01-health.png` | `GET /health` | Ứng dụng lắp ráp đúng, kết nối kho dữ liệu |
| `postman-02-danh-sach-phieu.png` | `GET /tickets` | Danh sách phiếu + `meta` phân trang |
| `postman-03-loc-trang-thai.png` | `GET /tickets?status=MOI` | Lọc theo trạng thái (QT-06) |
| `postman-04-khach-hang-che-so.png` | `GET /customers?phone=…` (nhân viên) | QT-15: che 4 số giữa `090****567` |
| `postman-05-khach-hang-quan-ly.png` | `GET /customers?phone=…` (quản lý) | QT-15: quản lý thấy số đầy đủ |
| `postman-06-chuan-hoa-so.png` | `GET /customers?phone=090 123 4567` | QT-02: chuẩn hóa khoảng trắng khi tra cứu |
| `postman-07-du-lieu-sai-400.png` | `POST /tickets` dữ liệu sai | Validator chặn trước khi chạm nghiệp vụ, trả 400 |
| `postman-08-tao-thiet-bi.png` | `POST /devices` | QT-03: tạo thiết bị mới |
| `postman-09-tao-phieu-201.png` | `POST /tickets` | QT-04 (hạn 24 giờ) + QT-05, trả 201 |
| `postman-10-idempotent-200.png` | `POST /tickets` gửi lại | NFR4: cùng `request_id`, không tạo phiếu thứ hai |
| `postman-11-chuyen-trang-thai.png` | `POST /tickets/1/transitions` | QT-06: chuyển trạng thái hợp lệ |
| `postman-12-chuyen-sai-400.png` | `POST /tickets/1/transitions` sai | QT-06: chặn chuyển lùi / nhảy cóc |
| `postman-13-lich-su.png` | `GET /tickets/1/history` | Ghi log trạng thái kèm nhãn tiếng Việt |
| `postman-14-phan-quyen-trung-tam.png` | `GET /tickets/3` | QT-14: sai trung tâm trả 403 |
| `postman-15-khong-duoc-xoa.png` | `DELETE /tickets/1` | QT-13: không cho xóa phiếu, trả 409 |
| `postman-16-danh-muc.png` | `GET /issue-categories` | Danh mục nhóm sự cố |
| `postman-17-trung-tam.png` | `GET /service-centers` | Danh mục trung tâm bảo hành |
| `postman-18-ky-thuat-vien.png` | `GET /technicians` | Danh mục kỹ thuật viên |

### 3.2. Ảnh giao diện — luồng nghiệp vụ chạy được

| Ảnh | Nội dung |
|---|---|
| `ui-01-dang-nhap.png` | Chọn vai trò (đăng nhập mô phỏng) |
| `ui-02-danh-sach-nhan-vien.png` | Danh sách phiếu, số che theo QT-15 |
| `ui-03-chi-tiet-phieu.png` | Chi tiết phiếu + lịch sử + bước chuyển hợp lệ |
| `ui-04-tiep-nhan.png` | Màn hình tiếp nhận |
| `ui-05-tra-cuu-khach.png` | Tra khách theo số (QT-01/QT-02) |
| `ui-06-them-thiet-bi.png` | Thêm thiết bị mới (QT-03) |
| `ui-07-tiep-nhan-thanh-cong.png` | Tạo phiếu thành công + cảnh báo QT-05 |
| `ui-08-chi-tiet-phieu-moi.png` | Chi tiết phiếu vừa tạo |
| `ui-09-chuyen-trang-thai.png` | Chuyển `MOI → DA_PHAN_CONG` (QT-06) |

---

## MỤC 4. Bộ kiểm thử

### 4.1. Lệnh chạy

```bash
npm test
```

Lệnh này gọi `tests/run-all.js`, chạy 4 nhóm và **dừng ngay** nếu một nhóm lỗi.
Trên PowerShell vẫn dùng đúng lệnh trên. Không cần Docker cho `npm test`.

### 4.2. Ảnh kết quả chạy PASS

| Ảnh | Nội dung |
|---|---|
| `test-01-npm-test-pass.png` | Cửa sổ terminal chạy `npm test`: các dòng `[PASS]` và kết luận `Tong ket: 38 test PASS (4 nhom test).` |

### 4.3. Ba trường hợp kiểm thử

| Mã | Trường hợp | Dữ liệu vào | Kỳ vọng | Kết quả |
|---|---|---|---|---|
| TC-07 | QT-02 — chuẩn hóa số điện thoại khi tra cứu | `090 123 4567` | Chuẩn hóa về `0901234567`, tìm đúng khách | PASS (`tests/ticket.service.test.js`, E2E-05, Postman `postman-06`) |
| TC-08 | QT-15 — che số theo vai trò | Nhân viên tra cùng khách | Trả `090****567`; quản lý thấy đủ số | PASS (E2E-03, Postman `postman-04` / `postman-05`) |
| TC-11 | NFR4 — gửi lại không tạo phiếu trùng | Hai lần `POST /tickets` cùng `request_id` | Lần hai trả 200, `data.la_phieu_cu = true`, không sinh phiếu mới | PASS (E2E-10, Postman `postman-09` → `postman-10`) |

Bốn nhóm test trong một lần chạy:

| Nhóm | Tệp | Số test | Nội dung |
|---|---|---:|---|
| Smoke | `tests/smoke-test.js` | 1 | Ứng dụng lắp ráp đúng, `GET /health` trả 200 |
| Nghiệp vụ | `tests/ticket.service.test.js` | 13 | TC-01…TC-13: QT-01…QT-06, QT-13…QT-15, QD-01 |
| Hợp đồng | `tests/ticket.contract.test.js` | 9 | HD-01…HD-09: hình dạng, ý nghĩa, giá trị rỗng của dữ liệu trả về |
| Tích hợp HTTP | `tests/e2e.test.js` | 15 | E2E-01…E2E-15: gọi thật qua HTTP |

---

## MỤC 5. Module mở rộng / trình bày kết quả

Ba trạng thái bắt buộc của giao diện:

| Trạng thái | Ảnh | Cách tái hiện |
|---|---|---|
| Đang tải | `ui-12-trang-thai-dang-tai.png` | Mở lại danh sách khi mạng chậm (hoặc làm chậm mạng trong DevTools) |
| Rỗng | `ui-10-trang-thai-rong.png` | Lọc trạng thái `HOAN_TAT` khi chưa có phiếu nào |
| Lỗi | `ui-11-trang-thai-loi.png` | Tắt server rồi bấm **Thử lại** |

Ảnh bổ sung cho phần trình bày kết quả: `ui-13-danh-sach-quan-ly.png` (quản lý
thấy số đầy đủ, phạm vi toàn công ty).

---

## Cách chụp lại (khi cần)

1. `npm run setup` để có PostgreSQL cổng 5434 và dữ liệu mẫu 3 phiếu.
2. `npm start`, mở `http://localhost:3000/` cho phần giao diện.
3. Postman: **Import** `docs/postman/CDTN1-L2.postman_collection.json`, chạy lần
   lượt request 01 → 18 (request 10 phải chạy sau request 09 để có `request_id`).
4. `npm test` và chụp cửa sổ terminal sau khi thấy dòng `Tong ket: 38 test PASS
   (4 nhom test).`
