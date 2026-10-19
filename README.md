# L2 — Tiếp nhận và phân loại yêu cầu bảo hành

**Sinh viên:** Nguyễn Nam Khánh — 2374802010222 — Track SE
**Học phần:** Chuyên đề Tốt nghiệp 1, HK1 2026–2027
**Case study:** Smart CRM — Mekong Mobile

Module này là lõi nghiệp vụ của luồng **L2**: tra cứu khách theo số điện thoại, ghi nhận thiết bị và mô tả lỗi, phân loại nhóm sự cố, sinh hạn cam kết, theo dõi vòng đời phiếu và lưu lịch sử trạng thái.

---

## 1. Chạy thử trong 4 lệnh

Yêu cầu duy nhất: **Node.js ≥ 20** và **Docker Desktop** đang chạy.

```bash
npm install
npm run setup     # bật PostgreSQL bằng Docker + tạo bảng + nạp dữ liệu mẫu
npm start         # API tại http://localhost:3000
npm run demo      # terminal khác: chạy 14 kịch bản và in kết quả
```

`npm run setup` làm ba việc, chạy lại nhiều lần vẫn an toàn:

1. `docker compose up -d` — bật container `mekong_mobile_db` (PostgreSQL 16).
2. Chờ tới khi CSDL nhận kết nối (tối đa 30 giây) rồi chạy migration.
3. Nạp danh mục và 3 phiếu demo.

Không cần tạo `.env`: mọi giá trị mặc định trong `src/config/env.js` đã trùng với `docker-compose.yml`.

### Không có Docker?

Chạy bằng kho dữ liệu trong bộ nhớ — đủ để xem toàn bộ API hoạt động:

```bash
npm install
npm test
CHE_DO_DU_LIEU=memory npm start
```

Trên PowerShell: `$env:CHE_DO_DU_LIEU="memory"; npm start`.

---

## 2. Kiểm tra nhanh

```bash
curl http://localhost:3000/health
# {"status":"ok","database":"postgresql","connected":true}

curl http://localhost:3000/tickets
# 3 phiếu BH-000001/2026 .. BH-000003/2026, meta.total = 3
```

Hướng dẫn chi tiết từng request kèm ảnh chụp: [`docs/huong-dan-postman.md`](docs/huong-dan-postman.md).

---

## 3. Bản đồ quy tắc nghiệp vụ → mã nguồn

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

---

## 4. Kiến trúc ba lớp

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

---

## 5. Danh sách endpoint

Tất cả endpoint có cả hai tiền tố `/api/v1/...` và đường dẫn gốc `/...` để tiện gõ thử.

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

### Phân quyền tạm thời bằng header

Chưa có module đăng nhập, nên QT-14/QT-15 đọc vai trò từ header. Khi có JWT chỉ cần thay hàm `docNguCanh` trong `src/middleware/ngu-canh.js`.

| Header | Giá trị | Ý nghĩa |
|---|---|---|
| `X-User-Role` | `nhan_vien` (mặc định) \| `quan_ly` \| `ban_giam_doc` | Vai trò người dùng |
| `X-Center-Id` | số | Trung tâm của nhân viên |

---

## 6. Kiểm thử

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

---

## 7. Xử lý sự cố

| Hiện tượng | Nguyên nhân thường gặp | Cách xử lý |
|---|---|---|
| `npm run setup` báo không kết nối được PostgreSQL | Docker Desktop chưa chạy | Mở Docker Desktop, đợi biểu tượng hết xoay, chạy lại |
| `port is already allocated` | Cổng 5434 đã bị chiếm | Sửa `DB_PORT` trong `.env`, hoặc `docker compose down` |
| `database "mekong_mobile" does not exist` | Volume cũ từ lần cấu hình trước | `npm run db:reset` rồi `npm run setup` |
| `ECONNREFUSED ::1:5434` | Node ưu tiên IPv6 | Đổi `DB_HOST=127.0.0.1` trong `.env` |
| `Cannot find module 'express'` | Chưa cài gói | `npm install` |
| `npm test` treo | Một tiến trình Node cũ còn giữ cổng/pool | `Get-Process node \| Stop-Process -Force` rồi chạy lại |

Đặt lại CSDL về trạng thái ban đầu:

```bash
npm run db:reset   # xóa volume và tạo lại container
npm run setup
```

---

## 8. Vì sao cổng 5434?

Máy phát triển đã có PostgreSQL ở 5432 và một dịch vụ PostgreSQL 15 ở 5433. Dùng 5434 để container của đồ án không đụng dịch vụ sẵn có. Muốn đổi thì sửa `DB_PORT` trong `.env` — `docker-compose.yml` và `src/config/env.js` đều đọc biến này.

---

## 9. Hồ sơ BT1

- SRS rút gọn: [`docs/srs.md`](docs/srs.md)
- API contract: [`docs/api-contract.md`](docs/api-contract.md)
- Use Case: [`docs/usecase.md`](docs/usecase.md), [`docs/usecase.drawio`](docs/usecase.drawio)
- Kiến trúc: [`docs/architecture.md`](docs/architecture.md), [`docs/architecture.drawio`](docs/architecture.drawio)
- ERD và DDL: [`docs/erd.drawio`](docs/erd.drawio), [`docs/schema.sql`](docs/schema.sql)
- Wireframe: [`docs/wireframe.md`](docs/wireframe.md), [`docs/export/wireframe.drawio.png`](docs/export/wireframe.drawio.png)
- Khai báo AI: [`docs/ai-disclosure.md`](docs/ai-disclosure.md), [`docs/ai-disclosure.xlsx`](docs/ai-disclosure.xlsx)
- Nhật ký thay đổi thiết kế: [`docs/thay-doi-thiet-ke.md`](docs/thay-doi-thiet-ke.md)
- Bản Word tổng hợp: `BT1_2374802010222_NguyenNamKhanh.docx`

## 10. Dữ liệu

Bộ dữ liệu đầy đủ nằm ở `dataset/` (không commit vì dung lượng lớn). Repo chỉ commit mẫu nhỏ trong `data/sample/` — đủ để `npm run setup` chạy trên máy chỉ clone repo. Script `scripts/seed-catalog.js` tự chọn `dataset/` nếu có, ngược lại dùng `data/sample/`.
