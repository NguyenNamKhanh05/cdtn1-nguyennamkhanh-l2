
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

> **Người mới clone repo:** dùng cách ngắn ở **mục 11** (`npm install` → `npm run setup` → `npm start`) — không cần tạo `.env`. Ba lệnh dưới đây là quy trình thủ công tương đương, giữ lại từ BT1.

```bash
npm install
copy .env.example .env
npm run migrate
npm run seed
npm test
npm start
```

Trên macOS/Linux, dùng `cp .env.example .env` thay cho lệnh `copy`. Có thể kiểm tra hệ thống tại `http://localhost:3000/health`; giao diện 3 màn hình ở `http://localhost:3000/`.

Các lệnh chính:

- `npm run setup`: bật PostgreSQL bằng Docker, chạy migration và nạp dữ liệu mẫu — cách khuyến nghị.
- `npm run migrate`: tạo bảng và index từ CSDL trống; migration có thể chạy lại.
- `npm run seed`: nạp dữ liệu mẫu; seed dùng `ON CONFLICT` để không nhân đôi khi chạy lại.
- `npm test`: chạy **38 test** trong 4 nhóm (smoke, nghiệp vụ, hợp đồng, tích hợp HTTP) và in tổng số test đạt. Không cần Docker.
- `npm start`: khởi động API và giao diện tại `http://localhost:3000`.
- `npm run build:web`: build lại giao diện từ `web/src` sau khi sửa (không cần chạy khi chỉ chấm bài).

## 4. Cấu trúc thư mục
- `src/`: mã nguồn ứng dụng.
- `src/routes/`: nhận HTTP và dịch lỗi nghiệp vụ sang HTTP.
- `src/contracts/`: hợp đồng dữ liệu giữa nghiệp vụ và giao diện (Buổi 9).
- `src/services/`: quy tắc nghiệp vụ QT-01…QT-06, QT-13…QT-15, QD-01.
- `src/repositories/`: truy cập dữ liệu; bản bộ nhớ dùng cho demo và unit test.
- `src/validators/`: kiểm tra kiểu, định dạng và trường bắt buộc.
- `src/errors/`: lớp lỗi nghiệp vụ dùng chung.
- `web/src/`: mã nguồn React của 3 màn hình (JSX + CSS).
- `public/`: tệp build sẵn `index.html`, `app.js`, `app.css` — Express phục vụ trực tiếp.
- `migrations/`: các bước tạo cấu trúc PostgreSQL.
- `seeds/`: dữ liệu mẫu có thể nạp lại.
- `tests/`: 4 nhóm test và `run-all.js` tổng hợp kết quả.
- `docs/`: minh chứng, ảnh giao diện và ghi chú triển khai.
- `data/sample/`: mẫu dữ liệu nhỏ được commit để kiểm thử.
- `data/raw/`: dữ liệu gốc cục bộ, không commit.
- `dataset/`: bộ dữ liệu đầy đủ của case study, chỉ dùng cục bộ.

## 5. Dữ liệu L2
Nguồn dữ liệu đầy đủ nằm trong thư mục `dataset/` và được cung cấp từ bộ dữ liệu mô phỏng của case study. Luồng L2 sử dụng chính các tệp `tickets_history.csv`, `ticket_status_log.csv`, `customers_raw.csv`, `issue_categories.csv` và `service_centers.csv`.

Repo chỉ commit các mẫu nhỏ trong `data/sample/`; không commit dữ liệu lớn. Khi cần chạy với dữ liệu đầy đủ, đặt các tệp CSV vào `data/raw/` hoặc dùng trực tiếp từ `dataset/` ở máy cá nhân.

## 6. Trạng thái hiện tại (buổi 10)

- [x] Migration `tickets`, `customers`, `devices`, `ticket_status_log`, `service_centers`, `issue_categories`, `technician`
- [x] CRUD `/tickets`, `/customers` qua routes/services/repositories
- [x] QT-09 không thuộc luồng L2 — thay bằng **QD-01** (một thiết bị không có hai phiếu đang mở)
- [x] **38/38 test đạt**: smoke (1) + TC-01..TC-13 (13) + hợp đồng HD-01..HD-09 (9) + tích hợp HTTP E2E-01..E2E-15 (15)
- [x] Docker Compose + `npm run setup` một lệnh, chạy lại an toàn
- [x] Giao diện 3 màn hình (danh sách, chi tiết, tiếp nhận) gọi API thật, có đủ trạng thái đang tải / rỗng / lỗi
- [x] Hợp đồng dữ liệu ở ranh giới (`src/contracts/ticket.contract.js`) + test hợp đồng
- [x] 13 ảnh minh chứng giao diện trong `docs/export/` (`ui-01` … `ui-13`)
- [x] README hướng dẫn chạy, kiểm thử và kiểm chứng trên bản clone mới
- [ ] Ảnh Postman bổ sung (không bắt buộc nếu đã có ảnh giao diện) — quy trình ở `docs/huong-dan-postman.md`

## 7. Kiểm thử

Chạy một lệnh, không cần Docker:

```bash
npm test
# ... 38 dòng [PASS] tương ứng 4 nhóm ...
# Tong ket: 38 test PASS (4 nhom test).
```

`npm test` gọi `tests/run-all.js`, lần lượt chạy 4 nhóm và **dừng ngay** nếu một nhóm lỗi:

| Nhóm | Tệp | Số test | Kiểm tra |
|---|---|---:|---|
| Smoke | `tests/smoke-test.js` | 1 | App lắp ráp đúng, `GET /health` trả 200 |
| Nghiệp vụ | `tests/ticket.service.test.js` | 13 | TC-01..TC-13: QT-01…QT-06, QT-13…QT-15, QD-01 |
| Hợp đồng | `tests/ticket.contract.test.js` | 9 | HD-01..HD-09: hình dạng, ý nghĩa, giá trị rỗng của dữ liệu trả về |
| Tích hợp HTTP | `tests/api.e2e.test.js` | 15 | E2E-01..E2E-15: luồng chính qua route, validator, middleware, hợp đồng |

Chi tiết từng test, cách đọc kết quả và cách kiểm chứng trên bản clone mới ở **mục 15**. Bảng TC-01..TC-13 đầy đủ cũng nằm ở mục 15.3 (ba dòng TC-01..TC-03 dưới đây là ví dụ cũ, giữ lại để đối chiếu BT1):

- `TC-01`: luồng đúng, thiết bị còn bảo hành tạo được phiếu.
- `TC-02`: giá trị biên, ngày cuối còn bảo hành và ngày kế tiếp hết hạn.
- `TC-03`: dữ liệu sai, serial đã có phiếu mở bị từ chối theo QD-01.

## 8. Lộ trình các buổi
- [x] Khởi tạo project, smoke test chạy được (buổi 2)
- [x] Hoàn thiện hồ sơ phân tích và thiết kế BT1 cho luồng L2 (buổi 3)
- [x] Module tiếp nhận yêu cầu (buổi 8–10)
- [x] Giao diện 3 màn hình + tích hợp đầu-cuối + bộ test hợp đồng (buổi 10)
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

Từ Buổi 9 có thêm **lớp hợp đồng** (`src/contracts/`): route không trả thẳng bản ghi SQL mà chuyển qua `toTicketView` / `toTicketDetailView`. Giao diện chỉ đọc các trường đã cam kết, không phụ thuộc tên cột. Đây cũng là nơi duy nhất áp QT-15 cho số điện thoại gắn với phiếu và tính cờ quá hạn.

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
├── contracts/ticket.contract.js  hợp đồng dữ liệu nghiệp vụ → giao diện
├── middleware/ngu-canh.js     ngữ cảnh vai trò cho QT-14/QT-15
├── routes/                    customer, ticket, catalog
├── services/                  ticket, customer
├── repositories/              pg.repository.js, memory.repository.js
└── validators/                kiểm tra dữ liệu vào
web/src/                       mã nguồn React (App, 3 màn hình, API client, CSS)
public/                        index.html + app.js + app.css đã build sẵn
migrations/                    DDL theo BT1, chạy được nhiều lần
seeds/                         dữ liệu demo
scripts/                       setup, seed, demo, build giao diện
tests/                         4 nhóm test + run-all.js (38 test)
docs/                          hồ sơ BT1, ảnh giao diện, minh chứng BT2
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
| GET | `/customers/:id/devices` | Thiết bị của khách (màn hình tiếp nhận) |
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

Response của mọi endpoint phiếu đi qua `src/contracts/ticket.contract.js`. `GET /tickets/:id` trả thêm:

- `lich_su`: mảng log trạng thái, mỗi dòng có nhãn tiếng Việt.
- `chuyen_tiep_duoc_phep`: các bước kế tiếp theo QT-06 — giao diện không tự suy ra vòng đời.
- `warranty_status`: `CON_BAO_HANH` / `HET_BAO_HANH` / `CHUA_XAC_MINH` (QT-05).
- `is_overdue`: đã quá hạn cam kết và phiếu còn mở hay không.
- `customer_phone`: đã che theo QT-15 nếu người xem là nhân viên.

Giao diện 3 màn hình được phục vụ tại `http://localhost:3000/` (cùng process với API).

### 14.1. Phân quyền tạm thời bằng header

Chưa có module đăng nhập, nên QT-14/QT-15 đọc vai trò từ header. Khi có JWT chỉ cần thay hàm `docNguCanh` trong `src/middleware/ngu-canh.js`.

| Header | Giá trị | Ý nghĩa |
|---|---|---|
| `X-User-Role` | `nhan_vien` (mặc định) \| `quan_ly` \| `ban_giam_doc` | Vai trò người dùng |
| `X-Center-Id` | số | Trung tâm của nhân viên |

## 15. Kiểm thử chi tiết

### 15.1. Chạy và đọc kết quả

```bash
npm test
```

Kết quả cuối cùng (số test có thể tăng khi bổ sung, nhưng cấu trúc dòng tổng kết không đổi):

```text
Tong ket: 38 test PASS (4 nhom test).
```

- Không cần Docker/PostgreSQL: cả 4 nhóm dùng repository bộ nhớ hoặc app dựng với `CHE_DO_DU_LIEU=memory`, nên chạy được trên máy chỉ có Node.
- `tests/run-all.js` chạy lần lượt 4 tệp; tệp nào lỗi thì dừng ngay và in mã thoát khác 0 — không chạy tiếp trên trạng thái đã hỏng.
- Mỗi tệp in các dòng `[PASS] <mã> <mô tả>`; cuối tệp in `[SO-TEST] N`. `run-all.js` cộng các dòng `[SO-TEST]` để ra tổng, không đếm dòng `[PASS]` (một test có thể có nhiều assert).

### 15.2. Bốn nhóm test

| Nhóm | Tệp | Số test | Kiểm tra điều gì |
|---|---|---:|---|
| Smoke | `tests/smoke-test.js` | 1 | App lắp ráp đúng, `GET /health` qua HTTP trả 200 |
| Nghiệp vụ | `tests/ticket.service.test.js` | 13 | TC-01..TC-13: QT-01…QT-06, QT-13…QT-15, QD-01, NFR3/NFR4 |
| Hợp đồng | `tests/ticket.contract.test.js` | 9 | HD-01..HD-09: hình dạng, ý nghĩa, giá trị rỗng, che số, quá hạn |
| Tích hợp HTTP | `tests/api.e2e.test.js` | 15 | E2E-01..E2E-15: dựng app thật và đi hết luồng chính qua route/middleware/hợp đồng |

Vì sao tách 4 nhóm: test nghiệp vụ không phát hiện lỗi route quên mount; test HTTP không chỉ ra quy tắc nào sai. Tách ra thì khi đỏ, tên nhóm cho biết lỗi nằm ở đâu.

### 15.3. TC-01..TC-13 — quy tắc nghiệp vụ

| Test | Nội dung |
|---|---|
| TC-01 | Thiết bị còn bảo hành tạo được phiếu `MOI` |
| TC-02 | Ngày tiếp nhận đúng ngày hết hạn vẫn còn bảo hành (biên QT-05) |
| TC-03 | Khách không tồn tại bị từ chối |
| TC-04 | Serial rỗng bị validator chặn |
| TC-05 | SLA 24/72/120 giờ |
| TC-06 | Bỏ qua Chủ nhật khi tính hạn |
| TC-07 | Chuẩn hóa số điện thoại (QT-02) |
| TC-08 | Che số điện thoại `090****567` (QT-15) |
| TC-09 | Vòng đời trạng thái không quay lui (QT-06) |
| TC-10 | Chuyển trạng thái hợp lệ ghi log, không hợp lệ bị từ chối |
| TC-11 | Cùng `request_id` không tạo phiếu thứ hai (NFR3/NFR4) |
| TC-12 | Số điện thoại trùng không tạo hồ sơ mới (QT-01) |
| TC-13 | Thiếu ngày mua ⇒ chưa xác minh bảo hành (QT-05) |

### 15.4. HD-01..HD-09 — hợp đồng dữ liệu ở ranh giới

Hợp đồng nằm ở `src/contracts/ticket.contract.js`. Đây là chỗ duy nhất biết response của phiếu có trường gì; route chỉ gọi `toTicketView` / `toTicketDetailView`.

| Test | Nội dung |
|---|---|
| HD-01 | Hợp đồng có **đúng** bộ trường cam kết, không thừa/thiếu |
| HD-02 | Ngày luôn ra ISO 8601; `null` giữ nguyên `null`, không thành `Invalid Date` |
| HD-03 | QT-15: nhân viên thấy `090****567`, quản lý thấy `0901234567` |
| HD-04 | QT-05: phân biệt `CON_BAO_HANH` / `HET_BAO_HANH` / `CHUA_XAC_MINH` |
| HD-05 | Quá hạn chỉ tính cho phiếu còn mở; phiếu đã đóng không báo đỏ |
| HD-06 | Log trạng thái có nhãn tiếng Việt, giao diện không phải tự dịch |
| HD-07 | QT-06: chỉ trả các bước chuyển hợp lệ, lấy từ domain |
| HD-08 | Metadata phân trang đúng tên trường và giữ `total` |
| HD-09 | Đầu vào rỗng trả `null` thay vì ném lỗi |

Hành vi ở biên mà bên gọi phải biết:

| Tình huống | Kết quả | Bên gọi xử lý |
|---|---|---|
| `toTicketView(null)` | `null` | Tự quyết định hiển thị “không có dữ liệu” |
| Danh sách rỗng | `data: []`, `meta.total: 0`, HTTP 200 | Trạng thái **rỗng**, không phải lỗi |
| Ngày mua/ngày đóng không có | `null` | Hiển thị `—`; QT-05 suy ra `CHUA_XAC_MINH` |
| Số điện thoại không có | `null` | Hiển thị `—`, không che thành chuỗi rỗng |
| Ngày không hợp lệ từ CSDL | `null` | Không làm sập màn hình |
| Lỗi nghiệp vụ | `{error: {code, message, fields?}}` | Rẽ nhánh theo `code`, không theo câu chữ |

### 15.5. E2E-01..E2E-15 — luồng chính qua HTTP

Test dựng app thật bằng `createApp`, nghe trên cổng 0 (hệ điều hành tự chọn), rồi gọi bằng `fetch`:

| Test | Nội dung |
|---|---|
| E2E-01 | `/health` trả 200, đúng kho dữ liệu |
| E2E-02 | `GET /tickets` trả 3 phiếu seed + `meta.total` + tên khách |
| E2E-03 | QT-15: che số trên danh sách theo vai trò |
| E2E-04 | Chi tiết kèm lịch sử và các bước chuyển QT-06 |
| E2E-05 | QT-02: tra khách bằng số có khoảng trắng |
| E2E-06 | QT-01: tạo khách mới, gửi trùng số bị 409 |
| E2E-07 | Serial sai bị validator chặn với `DU_LIEU_KHONG_HOP_LE` |
| E2E-08 | QT-03: tạo thiết bị mới cho khách |
| E2E-09 | Tạo phiếu, QT-04 tính đúng hạn 24 giờ cho mức CAO |
| E2E-10 | NFR4: gửi lại cùng `request_id` trả 200 + `la_phieu_cu: true` |
| E2E-11 | QT-06: chuyển `MOI → DA_PHAN_CONG`, lịch sử tăng 1 dòng |
| E2E-12 | QT-06: chuyển lùi bị 400 `INVALID_TRANSITION` |
| E2E-13 | QT-13: xóa phiếu bị 409 `KHONG_DUOC_XOA_PHIEU` |
| E2E-14 | Bộ lọc rỗng trả `[]` + `total: 0` (trạng thái rỗng) |
| E2E-15 | Đường dẫn lạ trả 404 đúng định dạng lỗi chung |

### 15.6. Cách thêm một test mới

1. Chọn đúng nhóm: quy tắc nghiệp vụ → `ticket.service.test.js`; hình dạng dữ liệu → `ticket.contract.test.js`; đi qua HTTP → `api.e2e.test.js`.
2. Đặt mã tiếp theo (`TC-14`, `HD-10`, `E2E-16`), viết `assert` với dữ liệu cố định — không dùng `new Date()` trực tiếp nếu test liên quan hạn chót.
3. In `[PASS] <mã> <mô tả>` sau khi assert để người chấm thấy test nào đã chạy.
4. Nếu thêm tệp test mới, thêm vào `CAC_TEP` trong `tests/run-all.js` và in `[SO-TEST] N`.
5. Chạy `npm test`, xác nhận dòng tổng kết tăng đúng số test.

### 15.7. Kiểm chứng trên bản clone mới

Quy trình đã dùng để kiểm tra README (chạy trên thư mục tạm, không dùng `node_modules` cũ):

```bash
git clone https://github.com/NguyenNamKhanh05/cdtn1-nguyennamkhanh-l2.git
cd cdtn1-nguyennamkhanh-l2
npm install
npm run setup
npm test
npm start
```

Kỳ vọng:

- `npm install` không báo lỗi; không cần cài React/Vite (bundle đã commit trong `public/`).
- `npm run setup` tạo container `mekong_mobile_db` ở cổng 5434, chạy 3 migration, nạp 6 trung tâm / 6 nhóm sự cố / 38 kỹ thuật viên / 3 phiếu.
- `npm test` in `Tong ket: 38 test PASS (4 nhom test).`
- `npm start` in `API dang chay tai http://localhost:3000`; mở `http://localhost:3000/` thấy màn hình chọn vai trò.

Kết quả kiểm chứng thực tế: xem mục 15.8.

### 15.8. Nhật ký kiểm chứng

| Ngày | Việc đã làm | Kết quả |
|---|---|---|
| 22/10/2026 | `npm test` trên máy phát triển | 38/38 PASS |
| 22/10/2026 | `npm run db:reset` → `npm run setup` từ volume trống | 3 migration + seed thành công |
| 22/10/2026 | Mở giao diện, đi hết luồng tra khách → thêm thiết bị → tạo phiếu → chuyển trạng thái | Thành công; ảnh `ui-01`…`ui-13` |
| 22/10/2026 | Clone repo sang thư mục tạm, chạy theo README | 38/38 PASS, giao diện mở được |

### 15.9. Giao diện 3 màn hình và ba trạng thái

Mở `http://localhost:3000/`, chọn vai trò ở màn hình đăng nhập mô phỏng:

- **Nhân viên tiếp nhận** + trung tâm 1: thấy số che, chỉ thấy phiếu trung tâm mình (QT-14/QT-15).
- **Quản lý trung tâm**: thấy số đầy đủ, lọc được theo trung tâm.
- **Ban giám đốc**: thấy toàn công ty.

| Màn hình | Đường dẫn | Chức năng |
|---|---|---|
| Danh sách | `#/tickets` | Lọc trạng thái/trung tâm, sắp theo hạn, đánh dấu quá hạn |
| Chi tiết | `#/tickets/:id` | Thông tin, cảnh báo QT-05, chuyển trạng thái QT-06, lịch sử |
| Tiếp nhận | `#/tiep-nhan` | Tra khách (QT-01/02), thêm thiết bị (QT-03), tạo phiếu (QT-04/05), chống trùng (NFR4) |

Ba trạng thái bắt buộc (Buổi 9) được kiểm tra bằng ảnh:

| Trạng thái | Cách tái hiện | Ảnh |
|---|---|---|
| Đang tải | Làm chậm mạng hoặc mở lại danh sách | `docs/export/ui-12-trang-thai-dang-tai.png` |
| Rỗng | Lọc trạng thái `HOAN_TAT` khi chưa có phiếu | `docs/export/ui-10-trang-thai-rong.png` |
| Lỗi | Tắt server rồi bấm Thử lại | `docs/export/ui-11-trang-thai-loi.png` |

Ảnh toàn luồng:

| Ảnh | Nội dung |
|---|---|
| `ui-01-dang-nhap.png` | Chọn vai trò (đăng nhập mô phỏng) |
| `ui-02-danh-sach-nhan-vien.png` | Danh sách, số che `090****567` |
| `ui-03-chi-tiet-phieu.png` | Chi tiết + lịch sử + bước chuyển |
| `ui-04-tiep-nhan.png` | Màn hình tiếp nhận |
| `ui-05-tra-cuu-khach.png` | Tra khách theo số |
| `ui-06-them-thiet-bi.png` | Thêm thiết bị mới |
| `ui-07-tiep-nhan-thanh-cong.png` | Tạo phiếu thành công + cảnh báo QT-05 |
| `ui-08-chi-tiet-phieu-moi.png` | Chi tiết phiếu vừa tạo |
| `ui-09-chuyen-trang-thai.png` | Chuyển `MOI → DA_PHAN_CONG` |
| `ui-10-trang-thai-rong.png` | Trạng thái rỗng |
| `ui-11-trang-thai-loi.png` | Trạng thái lỗi + nút thử lại |
| `ui-12-trang-thai-dang-tai.png` | Trạng thái đang tải |
| `ui-13-danh-sach-quan-ly.png` | Quản lý: số đầy đủ, toàn công ty |

Ghi chú kỹ thuật giao diện:

- React 19 + esbuild; mã nguồn ở `web/src`, bundle commit ở `public/app.js` + `public/app.css`. Không cần chạy dev server.
- Sửa giao diện: sửa `web/src/**`, chạy `npm run build:web`, rồi tải lại trang.
- API client duy nhất ở `web/src/api/client.js`: gắn header vai trò, chuẩn hóa lỗi, xóa phiên khi 401.
- Hash routing để Express chỉ cần phục vụ tệp tĩnh, không phải viết rewrite SPA.

### 15.10. Ảnh minh chứng theo mục nộp

Danh sách đầy đủ, xếp theo đúng các mục của bài nộp, nằm ở `docs/minh-chung.md`:

| Mục | Nội dung | Ảnh |
|---|---|---|
| MỤC 2 | Kiến trúc đã hiện thực — sơ đồ thành phần thực tế | `docs/export/kien-truc-thuc-te.png` (giải thích: `docs/kien-truc.md`) |
| MỤC 3 | Module cốt lõi — quy tắc nghiệp vụ đã hiện thực | `docs/export/postman-01…18*.png`, `docs/export/ui-01…09*.png` |
| MỤC 4 | Bộ kiểm thử — ba trường hợp, kết quả PASS | `docs/export/test-01-npm-test-pass.png` |
| MỤC 5 | Module mở rộng — ba trạng thái giao diện | `docs/export/ui-12-trang-thai-dang-tai.png`, `ui-10-trang-thai-rong.png`, `ui-11-trang-thai-loi.png` |

Bộ sưu tập Postman dùng để chụp: `docs/postman/CDTN1-L2.postman_collection.json`.

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
4. `postman-04-khach-hang-che-so.png` — `090****567`
5. `postman-11-chuyen-trang-thai.png` — 200, `from_status` → `to_status`

## 19. Dữ liệu

Bộ dữ liệu đầy đủ nằm ở `dataset/` (không commit vì dung lượng lớn). Repo chỉ commit mẫu nhỏ trong `data/sample/` — đủ để `npm run setup` chạy trên máy chỉ clone repo. Script `scripts/seed-catalog.js` tự chọn `dataset/` nếu có, ngược lại dùng `data/sample/`.
