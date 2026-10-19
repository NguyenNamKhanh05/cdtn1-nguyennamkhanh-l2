
# Tiếp nhận và phân loại yêu cầu bảo hành

Sinh viên: Nguyễn Nam Khánh - 2374802010222 - Track SE  
Học phần: Chuyên đề Tốt nghiệp 1, HK1 2026-2027  
Luồng nghiệp vụ: L2 – Tiếp nhận và phân loại yêu cầu bảo hành

> **Cập nhật BT2:** các mục 1–10 bên dưới giữ nguyên nội dung đã nộp ở BT1, riêng **mục 2** và **mục 6** đã cập nhật theo mẫu README track SE. Mục 11 trở đi bổ sung phần hiện thực module và những điểm đã thay đổi khi làm BT2.

## 1. Mục tiêu
Xây dựng một module nhỏ cho quy trình tiếp nhận bảo hành của Mekong Mobile. Hệ thống giúp tra cứu khách hàng theo số điện thoại, ghi nhận thiết bị và mô tả lỗi, chuẩn hóa phân loại nhóm sự cố, sinh hạn cam kết và theo dõi trạng thái phiếu.

## 2. Yêu cầu môi trường

- Node.js 20 LTS hoặc mới hơn, npm 10
- Docker Desktop (khuyến nghị) để chạy PostgreSQL 16 trong container, hoặc PostgreSQL 16 cài sẵn trên máy
- Không cần SQLite: nếu không có Docker, chạy bằng kho dữ liệu bộ nhớ với `CHE_DO_DU_LIEU=memory` (xem mục 11.2)
- Biến môi trường: xem `.env.example` — `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `PORT`, `CHE_DO_DU_LIEU`
- Không bắt buộc tạo `.env`: giá trị mặc định trong `src/config/env.js` đã trùng với `docker-compose.yml`, clone về là chạy được

## 3. Hướng dẫn chạy từ đầu

```bash
npm install
copy .env.example .env
npm run migrate
npm run seed
npm test
npm start
```

Trên macOS/Linux, dùng `cp .env.example .env` thay cho lệnh `copy`. Có thể kiểm tra hệ thống tại `http://localhost:3000/health`.

Các lệnh chính:

- `npm run migrate`: tạo bảng và index từ CSDL trống; migration có thể chạy lại.
- `npm run seed`: nạp dữ liệu mẫu; seed dùng `ON CONFLICT` để không nhân đôi khi chạy lại.
- `npm test`: chạy smoke test và ba unit test service.
- `npm start`: khởi động API.

## 4. Cấu trúc thư mục
- `src/`: mã nguồn ứng dụng.
- `src/routes/`: nhận HTTP và dịch lỗi nghiệp vụ sang HTTP.
- `src/services/`: quy tắc nghiệp vụ QT-03, QT-04, QT-05, QT-09.
- `src/repositories/`: truy cập dữ liệu; bản bộ nhớ dùng cho demo và unit test.
- `src/validators/`: kiểm tra kiểu, định dạng và trường bắt buộc.
- `src/errors/`: lớp lỗi nghiệp vụ dùng chung.
- `migrations/`: các bước tạo cấu trúc PostgreSQL.
- `seeds/`: dữ liệu mẫu có thể nạp lại.
- `tests/`: smoke test và unit test service.
- `docs/`: minh chứng và ghi chú triển khai.
- `data/sample/`: mẫu dữ liệu nhỏ được commit để kiểm thử.
- `data/raw/`: dữ liệu gốc cục bộ, không commit.
- `dataset/`: bộ dữ liệu đầy đủ của case study, chỉ dùng cục bộ.

## 5. Dữ liệu L2
Nguồn dữ liệu đầy đủ nằm trong thư mục `dataset/` và được cung cấp từ bộ dữ liệu mô phỏng của case study. Luồng L2 sử dụng chính các tệp `tickets_history.csv`, `ticket_status_log.csv`, `customers_raw.csv`, `issue_categories.csv` và `service_centers.csv`.

Repo chỉ commit các mẫu nhỏ trong `data/sample/`; không commit dữ liệu lớn. Khi cần chạy với dữ liệu đầy đủ, đặt các tệp CSV vào `data/raw/` hoặc dùng trực tiếp từ `dataset/` ở máy cá nhân.

## 6. Trạng thái hiện tại (buổi 8)

- [x] Migration `tickets`, `customers`, `devices`, `ticket_status_log`, `service_centers`, `issue_categories`, `technician`
- [x] CRUD `/tickets`, `/customers` qua routes/services/repositories
- [x] QT-09 không thuộc luồng L2 — thay bằng **QD-01** (một thiết bị không có hai phiếu đang mở)
- [x] 13/13 test đạt: smoke test + TC-01..TC-13 (`npm test`)
- [x] Docker Compose + `npm run setup` một lệnh, chạy lại an toàn
- [ ] Ảnh minh chứng Postman trong `docs/export/` — đang chụp theo `docs/huong-dan-postman.md`

## 7. Kiểm thử

`npm test` chạy ba loại kiểm thử service:

- `TC-01`: luồng đúng, thiết bị còn bảo hành tạo được phiếu.
- `TC-02`: giá trị biên, ngày cuối còn bảo hành và ngày kế tiếp hết hạn.
- `TC-03`: dữ liệu sai, serial đã có phiếu mở bị từ chối theo QT-09.

## 8. Lộ trình các buổi
- [x] Khởi tạo project, smoke test chạy được (buổi 2)
- [x] Hoàn thiện hồ sơ phân tích và thiết kế BT1 cho luồng L2 (buổi 3)
- [x] Module tiếp nhận yêu cầu (buổi 8–10)
- [ ] Module phân công kỹ thuật viên (buổi 10–12)

## 9. Hồ sơ BT1 đã thực hiện
- SRS rút gọn 6 mục: `docs/srs.md`.
- API contract theo track SE: `docs/api-contract.md`.
- Use Case và đặc tả luồng chính/ngoại lệ: `docs/usecase.md`, `docs/usecase.drawio`.
- Thiết kế kiến trúc và lập luận theo NFR: `docs/architecture.md`, `docs/architecture.drawio`.
- ERD 6 bảng và SQL DDL skeleton: `docs/erd.drawio`, `docs/schema.sql`.
- Wireframe 3 màn hình: `docs/export/wireframe.drawio.png`, `docs/wireframe.md`.
- Phụ lục khai báo AI: `docs/ai-disclosure.md`, `docs/ai-disclosure.xlsx`.
- Bản Word tổng hợp: `BT1_2374802010222_NguyenNamKhanh.docx`.

## 10. Cấu trúc module BT2

Routes chỉ xử lý HTTP và gọi Service. Service chứa quy tắc nghiệp vụ, không biết `req`, `res` hoặc mã HTTP. Repository chỉ đọc và ghi dữ liệu. Validator kiểm tra định dạng trước khi vào Service; PostgreSQL tiếp tục bảo vệ dữ liệu bằng `NOT NULL`, `UNIQUE`, khóa ngoại và `CHECK`.

---

# PHẦN BỔ SUNG CHO BT2

## 11. Chạy nhanh sau khi clone (khuyến nghị)

Yêu cầu: **Node.js ≥ 20** và **Docker Desktop** đang chạy.

```bash
npm install
npm run setup     # bật PostgreSQL bằng Docker + tạo bảng + nạp dữ liệu mẫu
npm start         # API tại http://localhost:3000
npm run demo      # terminal khác: chạy 14 kịch bản và in kết quả
```

`npm run setup` làm ba việc, chạy lại nhiều lần vẫn an toàn:

1. `npm run db:up` — bật container `mekong_mobile_db` (PostgreSQL 16) ở cổng 5434.
2. Chờ tới khi CSDL nhận kết nối (tối đa 30 giây) rồi chạy migration.
3. Nạp danh mục và 3 phiếu demo.

### 11.1. Điểm khác so với mục 2–4 (giữ nguyên bản BT1 ở trên)

| Nội dung ở mục 1–10 | Khi làm BT2 |
|---|---|
| `copy .env.example .env` là bắt buộc | **Không bắt buộc**: giá trị mặc định trong `src/config/env.js` đã trùng `docker-compose.yml` |
| Dùng PostgreSQL cài sẵn | Dùng PostgreSQL 16 trong Docker, cổng **5434** để không đụng 5432/5433 |
| `npm test` chạy ba unit test | `npm test` chạy smoke test + **TC-01..TC-13** |
| QT-09 xử lý trùng phiếu | **QD-01** là quy định bổ sung; QT-09 thuộc luồng kho (L5), không thuộc L2 |
| Chỉ có endpoint khách hàng/phiếu | Bổ sung thiết bị, danh mục, lịch sử trạng thái |

### 11.2. Không có Docker?

Chạy bằng kho dữ liệu trong bộ nhớ — đủ để xem toàn bộ API hoạt động:

```bash
npm install
npm test
CHE_DO_DU_LIEU=memory npm start
```

Trên PowerShell: `$env:CHE_DO_DU_LIEU="memory"; npm start`.

## 12. Bản đồ quy tắc nghiệp vụ → mã nguồn

| Mã | Nội dung | Nơi hiện thực |
|---|---|---|
| QT-01 | Số điện thoại duy nhất, dùng lại hồ sơ cũ | `src/services/customer.service.js` |
| QT-02 | Chuẩn hóa số về 10 chữ số bắt đầu bằng 0 | `src/domain/phone.js` |
| QT-03 | Thiết bị duy nhất theo serial/IMEI, thuộc một khách | `src/services/ticket.service.js` |
| QT-04 | Hạn cam kết CAO 24h / TRUNG_BINH 72h / THAP 120h, bỏ Chủ nhật | `src/domain/sla.js` |
| QT-05 | Còn bảo hành nếu `received − purchase ≤ warranty_months`; thiếu ngày mua ⇒ chưa xác minh | `src/domain/sla.js` |
| QT-06 | Chỉ chuyển trạng thái tiến, mọi lần chuyển đều ghi log | `src/domain/ticket-status.js`, `src/repositories/pg.repository.js` |
| QT-13 | Không xóa vật lý, chỉ đánh dấu ngừng sử dụng | `src/services/*.js`, cột `is_active` |
| QT-14 | Nhân viên chỉ thấy trung tâm mình, quản lý thấy đơn vị mình, ban giám đốc thấy toàn công ty | `src/middleware/ngu-canh.js` |
| QT-15 | Che số điện thoại `090****567` trừ quản lý và ban giám đốc | `src/domain/phone.js`, `src/middleware/ngu-canh.js` |
| QD-01 | Quy định bổ sung: một thiết bị không có hai phiếu đang mở | `src/services/ticket.service.js` |

> QT-07…QT-12 thuộc các luồng L4/L5/L8/L9 (kho linh kiện, phân công, báo cáo) nên **không** nằm trong phạm vi L2.

## 13. Kiến trúc ba lớp

```
HTTP request
   │
   ├── src/routes/         nhận request, dịch AppError → mã HTTP
   ├── src/validators/     kiểm tra kiểu, độ dài, định dạng (không cần CSDL)
   ├── src/services/       quy tắc nghiệp vụ QT-xx, không biết req/res
   └── src/repositories/   chỉ đọc/ghi; bản PostgreSQL và bản bộ nhớ cùng interface
```

Vì sao tách như vậy: quy tắc nghiệp vụ test được mà không cần dựng HTTP server hay PostgreSQL, và khi thay CSDL chỉ phải viết lại lớp repository.

```
src/
├── app.js                     lắp ráp ứng dụng, chọn kho dữ liệu
├── server.js                  mở cổng, tắt server gọn gàng
├── config/                    đọc .env, tạo pool PostgreSQL
├── domain/                    quy tắc thuần: SLA, vòng đời trạng thái, số điện thoại
├── middleware/ngu-canh.js     ngữ cảnh vai trò cho QT-14/QT-15
├── routes/                    customer, ticket, catalog
├── services/                  ticket, customer
├── repositories/              pg.repository.js, memory.repository.js
└── validators/                kiểm tra dữ liệu vào
migrations/                    DDL theo BT1, chạy được nhiều lần
seeds/                         dữ liệu demo
scripts/                       setup, seed, demo, tiện ích
tests/                         smoke test + TC-01..TC-13
docs/                          hồ sơ BT1 và minh chứng BT2
```

## 14. Danh sách endpoint đầy đủ

Tất cả endpoint có cả hai tiền tố `/api/v1/...` và đường dẫn gốc `/...` để tiện gõ thử.

Ví dụ nhanh (đường dẫn rút gọn, tương đương mục "API demo" của bản BT1):

- `GET /health`: kiểm tra hệ thống.
- `GET /api/v1/customers?phone=0901234567`: tra cứu khách hàng.
- `POST /api/v1/customers`: tạo khách hàng.
- `POST /api/v1/tickets`: tiếp nhận thiết bị và tạo phiếu.
- `GET/PUT/DELETE /api/v1/customers/:customerId`: CRUD khách hàng.
- `GET/PUT/DELETE /api/v1/tickets/:ticketId`: CRUD phiếu.

| Method | Path | Mục đích |
|---|---|---|
| GET | `/health` | Kiểm tra API và kết nối CSDL |
| GET | `/customers?phone=...` | Tra cứu khách (QT-02, QT-15) |
| GET | `/customers/:id` | Xem hồ sơ khách |
| POST | `/customers` | Tạo khách mới (QT-01) |
| PUT | `/customers/:id` | Cập nhật hồ sơ |
| DELETE | `/customers/:id` | Ngừng sử dụng hồ sơ (QT-13) |
| GET | `/tickets` | Danh sách, lọc `status`, `due_before`, `center_id`, phân trang |
| GET | `/tickets/:id` | Chi tiết phiếu (QT-14) |
| POST | `/tickets` | Tạo phiếu, sinh hạn cam kết (QT-03/04/05) |
| PUT | `/tickets/:id` | Sửa nội dung phiếu |
| DELETE | `/tickets/:id` | Luôn bị từ chối (QT-13) |
| GET | `/tickets/:id/history` | Lịch sử trạng thái (QT-06) |
| POST | `/tickets/:id/transitions` | Chuyển trạng thái (QT-06) |
| GET | `/issue-categories` | Danh mục nhóm sự cố |
| GET | `/service-centers` | Danh mục trung tâm |
| GET | `/technicians` | Danh mục kỹ thuật viên |
| GET | `/devices/:id` | Xem thiết bị |
| POST | `/devices` | Ghi nhận thiết bị mới (QT-03) |

### 14.1. Phân quyền tạm thời bằng header

Chưa có module đăng nhập, nên QT-14/QT-15 đọc vai trò từ header. Khi có JWT chỉ cần thay hàm `docNguCanh` trong `src/middleware/ngu-canh.js`.

| Header | Giá trị | Ý nghĩa |
|---|---|---|
| `X-User-Role` | `nhan_vien` (mặc định) \| `quan_ly` \| `ban_giam_doc` | Vai trò người dùng |
| `X-Center-Id` | số | Trung tâm của nhân viên |

## 15. Kiểm thử chi tiết

```bash
npm test
# Smoke test passed: GET /health returns {"status":"ok"}
# Service tests passed: TC-01 .. TC-13
```

| Test | Nội dung |
|---|---|
| TC-01 | Thiết bị còn bảo hành tạo được phiếu `MOI` |
| TC-02 | Ngày tiếp nhận đúng ngày hết hạn vẫn còn bảo hành (biên QT-05) |
| TC-03 | Khách không tồn tại bị từ chối |
| TC-04 | Serial rỗng bị validator chặn |
| TC-05 | SLA 24/72/120 giờ |
| TC-06 | Bỏ qua Chủ nhật khi tính hạn |
| TC-07 | Chuẩn hóa số điện thoại (QT-02) |
| TC-08 | Che số điện thoại (QT-15) |
| TC-09 | Vòng đời trạng thái không quay lui (QT-06) |
| TC-10 | Chuyển trạng thái hợp lệ ghi log, không hợp lệ bị từ chối |
| TC-11 | Cùng `request_id` không tạo phiếu thứ hai (NFR3) |
| TC-12 | Số điện thoại trùng không tạo hồ sơ mới (QT-01) |
| TC-13 | Thiếu ngày mua ⇒ chưa xác minh bảo hành (QT-05) |

## 16. Xử lý sự cố

| Hiện tượng | Nguyên nhân thường gặp | Cách xử lý |
|---|---|---|
| `npm run setup` báo không kết nối được PostgreSQL | Docker Desktop chưa chạy | Mở Docker Desktop, đợi biểu tượng hết xoay, chạy lại |
| `port is already allocated` | Cổng 5434 đã bị chiếm | Sửa `DB_PORT` trong `.env`, hoặc `npm run db:down` |
| `database "mekong_mobile" does not exist` | Volume cũ từ lần cấu hình trước | `npm run db:reset` rồi `npm run setup` |
| `ECONNREFUSED ::1:5434` | Node ưu tiên IPv6 | Đổi `DB_HOST=127.0.0.1` trong `.env` |
| `Cannot find module 'express'` | Chưa cài gói | `npm install` |
| `npm test` treo | Một tiến trình Node cũ còn giữ cổng/pool | `Get-Process node \| Stop-Process -Force` rồi chạy lại |

Đặt lại CSDL về trạng thái ban đầu:

```bash
npm run db:reset   # xóa volume và tạo lại container
npm run setup
```

## 17. Vì sao cổng 5434?

Máy phát triển đã có PostgreSQL ở 5432 và một dịch vụ PostgreSQL 15 ở 5433. Dùng 5434 để container của đồ án không đụng dịch vụ sẵn có. Muốn đổi thì sửa `DB_PORT` trong `.env` — `docker-compose.yml` và `src/config/env.js` đều đọc biến này.

## 18. Hướng dẫn kiểm thử Postman

Xem `docs/huong-dan-postman.md`: 16 request cụ thể kèm mã HTTP, body mong đợi và tên ảnh chụp cần lưu trong `docs/export/`.

Các ảnh tối thiểu:

1. `postman-01-health.png` — 200, `connected: true`
2. `postman-02-danh-sach-phieu.png` — 3 phiếu, `total: 3`
3. `postman-07-du-lieu-sai-400.png` — 400 `DU_LIEU_KHONG_HOP_LE`
4. `postman-04-khach-hang-che-so.png` — `090123****`
5. `postman-11-chuyen-trang-thai.png` — 200, `from_status` → `to_status`

## 19. Dữ liệu

Bộ dữ liệu đầy đủ nằm ở `dataset/` (không commit vì dung lượng lớn). Repo chỉ commit mẫu nhỏ trong `data/sample/` — đủ để `npm run setup` chạy trên máy chỉ clone repo. Script `scripts/seed-catalog.js` tự chọn `dataset/` nếu có, ngược lại dùng `data/sample/`.
