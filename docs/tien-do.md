# Tiến độ công việc — dừng ngày 22/10/2026

> **Khi người dùng nói “tiếp tục làm”, đọc tệp này trước.**  
> Đây là ghi chú bàn giao giữa các phiên làm việc, không phải tài liệu nộp bài.
> Tài liệu chính thức vẫn là `README.md` và `docs/api-contract.md`.

## 1. Trạng thái chung

- Repo: https://github.com/NguyenNamKhanh05/cdtn1-nguyennamkhanh-l2
- Nhánh đang dùng: `main`
- Commit mới nhất khi dừng: xem `git log --oneline -1` (chuỗi commit Buổi 10 bắt đầu từ `ab6022b`).
- Server cục bộ đang chạy tại `http://localhost:3000` (API + giao diện).
- PostgreSQL chạy bằng Docker, cổng **5434**, container `mekong_mobile_db`.
- Dữ liệu hiện có 3 phiếu seed (`BH-000001/2026` … `BH-000003/2026`).

## 2. Việc đã hoàn thành trong ngày

### 2.1. Backend

- Thêm lớp hợp đồng dữ liệu `src/contracts/ticket.contract.js`:
  - `toTicketView`, `toTicketDetailView`, `toTicketHistoryView`, `toTicketPage`.
  - Chuẩn hóa ngày ISO, giá trị `null`, nhãn tiếng Việt.
  - Áp QT-15 (che số `090****567`), tính `is_overdue`, `warranty_status`.
- Mở rộng repository PostgreSQL + bộ nhớ để JOIN tên khách, trung tâm, nhóm sự cố, serial, ngày mua, số tháng bảo hành.
- Thêm `GET /customers/:customerId/devices` cho màn hình tiếp nhận.
- Service đọc lại bản ghi đã JOIN sau khi tạo / replay `request_id` / cập nhật.
- Route phiếu trả theo hợp đồng; chi tiết kèm `lich_su` và `chuyen_tiep_duoc_phep`.
- Chặn nhân viên tạo phiếu cho trung tâm khác (QT-14).
- Sửa QT-15: che 4 số **giữa**, đúng dạng `090****567` (trước đó che 4 số cuối).
- Sửa lỗi PostgreSQL: bảng `device` không có cột `is_active`, bỏ điều kiện sai trong `lietKeThietBiTheoKhachHang`.
- Express phục vụ tệp tĩnh trong `public/` sau các route API.

### 2.2. Giao diện

- React 19 + esbuild, mã nguồn `web/src/`, bundle commit sẵn `public/app.js` + `public/app.css`.
- 3 màn hình:
  - `#/tickets` — danh sách, lọc, hạn cam kết, quá hạn.
  - `#/tickets/:id` — chi tiết, cảnh báo QT-05, chuyển trạng thái QT-06, lịch sử.
  - `#/tiep-nhan` — tra khách, thêm thiết bị, tạo phiếu, chống trùng `request_id`.
- Màn hình chọn vai trò mô phỏng (`nhan_vien`, `quan_ly`, `ban_giam_doc`) + trung tâm.
- Đủ 3 trạng thái: đang tải, rỗng, lỗi (có nút thử lại).
- API client duy nhất `web/src/api/client.js`, tự gắn header vai trò và chuẩn hóa lỗi.
- Hash routing để không cần rewrite SPA ở Express.

### 2.3. Kiểm thử

- `npm test` chạy `tests/run-all.js`, tổng **38 test**:
  - Smoke: 1
  - Nghiệp vụ TC-01..TC-13: 13
  - Hợp đồng HD-01..HD-09: 9
  - Tích hợp HTTP E2E-01..E2E-15: 15
- Kết quả cuối: `Tong ket: 38 test PASS (4 nhom test).`
- Có test biên: ngày cuối bảo hành, thiếu ngày mua (QT-05), chuyển trạng thái lùi (QT-06), bộ lọc rỗng.
- Test hợp đồng kiểm tra đúng bộ trường, `null`, che số, nhãn, phân trang.

### 2.4. Tài liệu và minh chứng

- 13 ảnh giao diện trong `docs/export/ui-01…ui-13`.
- README cập nhật:
  - Mục 3: lệnh chạy khi clone.
  - Mục 7 + 15: 4 nhóm test, bảng TC/HD/E2E, cách đọc kết quả.
  - Mục 15.6: cách thêm test.
  - Mục 15.7–15.8: quy trình và nhật ký kiểm chứng clone mới.
  - Mục 15.9: 3 màn hình + 3 trạng thái + bảng ảnh.
- `docs/api-contract.md`: cập nhật hợp đồng response, endpoint thiết bị theo khách.
- `docs/ai-disclosure.md`: bổ sung các phần AI hỗ trợ Buổi 10.
- `docs/huong-dan-postman.md`, `docs/architecture.md`: cập nhật theo hiện thực.

### 2.5. Kiểm chứng clone mới (đã làm thật)

Thư mục tạm: `C:\Users\Admin\AppData\Local\Temp\opencode\fresh-clone`.

```text
git clone …                  OK
npm install                  OK (87 gói, 0 lỗi bảo mật)
npm run setup                OK (3 migration + seed)
npm test                     38/38 PASS
npm start                    OK
GET /health                  status=ok, database=postgresql
GET /                        HTTP 200
GET /api/v1/tickets          total=3
```

Sau khi kiểm tra, container của bản clone đã được tắt; CSDL gốc đã được bật lại và server gốc đang chạy cổng 3000.

### 2.6. Git

Các commit Buổi 10 (đã push `origin/main`):

| Commit | Nội dung |
|---|---|
| `ab6022b` | `fix: che so dien thoai dung QT-15 va in so test da chay` |
| `22c1704` | `feat: bo sung hop dong du lieu va API phuc vu giao dien` |
| `97cb7b6` | `feat: tich hop giao dien 3 man hinh va bo test 38 truong hop` |
| `3e6666e` | `docs: them 13 anh minh chung giao dien` |
| `f8be55d` | `docs: huong dan kiem thu, hop dong du lieu va anh giao dien` |

Tổng số commit của repo đã vượt 8.

## 3. Đối chiếu 10 mục kiểm chứng Buổi 10

| # | Mục | Trạng thái | Bằng chứng |
|---:|---|---|---|
| 1 | Module mở rộng theo track hiện thực và chạy được | Đạt | `src/`, `web/`, `npm start` |
| 2 | Luồng chính end-to-end không lỗi treo | Đạt | E2E-01..E2E-15 + ảnh `ui-01…09` |
| 3 | Chạy trên dữ liệu mẫu thật | Đạt | PostgreSQL seed 6 trung tâm, 6 nhóm, 38 KTV, 3 phiếu |
| 4 | Ảnh kết quả toàn luồng trong `docs/` | Đạt | `docs/export/ui-01…ui-13` |
| 5 | ≥ 5 unit test PASS, hiện số test | Đạt | 38 test, dòng tổng kết cuối |
| 6 | ≥ 1 test biên / ngoại lệ | Đạt | TC-02, TC-13, HD-05, E2E-12, E2E-14 |
| 7 | 3 trạng thái đang tải / rỗng / lỗi | Đạt | `ui-10`, `ui-11`, `ui-12` |
| 8 | README mục 3 đủ bước chạy, mỗi bước một lệnh | Đạt | `README.md` mục 3 + 11 |
| 9 | Đã clone repo mới và chạy theo README | Đạt | Mục 2.5 ở trên |
| 10 | Commit đúng quy ước, tổng ≥ 8 | Đạt | `git log --oneline` |

## 4. Việc còn lại (khi “tiếp tục làm”)

1. **Ảnh Postman** (không bắt buộc nếu đã có ảnh giao diện): làm theo `docs/huong-dan-postman.md`, lưu `docs/export/postman-01…`.
2. **Nộp bài**: kiểm tra lại README, ảnh, link repo; có thể xuất PDF nếu giảng viên yêu cầu.
3. **Buổi tiếp theo — module phân công kỹ thuật viên** (ngoài phạm vi L2 hiện tại): bắt đầu từ `technician`, `technician_skill`, `service_center` đã có trong migration/seed.
4. **Docker Hub/GHCR** (tùy chọn): cần GitHub PAT hoặc tài khoản Docker; không lưu mật khẩu trong repo.

## 5. Lưu ý kỹ thuật để không mất thời gian

- Cổng PostgreSQL là **5434**, không phải 5432.
- `npm run db:reset` xóa volume; sau đó phải `npm run setup` lại.
- Bảng `device` **không có** `is_active`; đừng thêm điều kiện này.
- QT-15 đúng là `090****567` (giữ 3 đầu + 3 cuối).
- PowerShell làm hỏng JSON khi curl inline: ghi body ra tệp rồi dùng `--data-binary "@file.json"`.
- `playwright-core` chỉ cài tạm để chụp ảnh, **không** có trong `package.json`/`package-lock.json`.
- Sửa giao diện thì chạy `npm run build:web` rồi commit cả `public/app.js` + `public/app.css`.
- Tệp `text` ở thư mục gốc là tệp lạ còn sót, chưa xóa; hỏi người dùng trước khi xóa.
