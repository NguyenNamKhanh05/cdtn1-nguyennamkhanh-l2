
# Tiếp nhận và phân loại yêu cầu bảo hành

Sinh viên: Nguyễn Nam Khánh - 2374802010222 - Track SE  
Học phần: Chuyên đề Tốt nghiệp 1, HK1 2026-2027  
Luồng nghiệp vụ: L2 – Tiếp nhận và phân loại yêu cầu bảo hành

## 1. Mục tiêu
Xây dựng một module nhỏ cho quy trình tiếp nhận bảo hành của Mekong Mobile. Hệ thống giúp tra cứu khách hàng theo số điện thoại, ghi nhận thiết bị và mô tả lỗi, chuẩn hóa phân loại nhóm sự cố, sinh hạn cam kết và theo dõi trạng thái phiếu.

## 2. Yêu cầu môi trường
Node.js 20 LTS hoặc mới hơn
PostgreSQL 16 (dùng cho migration/seed thật)
Biến môi trường: sao chép `.env.example` thành `.env`

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

## 6. API demo

- `GET /health`: kiểm tra hệ thống.
- `GET /api/v1/customers?phone=0901234567`: tra cứu khách hàng.
- `POST /api/v1/customers`: tạo khách hàng.
- `POST /api/v1/tickets`: tiếp nhận thiết bị và tạo phiếu.
- `GET/PUT/DELETE /api/v1/customers/:customerId`: CRUD khách hàng.
- `GET/PUT/DELETE /api/v1/tickets/:ticketId`: CRUD phiếu.

## 7. Kiểm thử

`npm test` chạy ba loại kiểm thử service:

- `TC-01`: luồng đúng, thiết bị còn bảo hành tạo được phiếu.
- `TC-02`: giá trị biên, ngày cuối còn bảo hành và ngày kế tiếp hết hạn.
- `TC-03`: dữ liệu sai, serial đã có phiếu mở bị từ chối theo QT-09.

## 8. Trạng thái hiện tại
- [x] Khởi tạo project, smoke test chạy được (buổi 2)
- [x] Hoàn thiện hồ sơ phân tích và thiết kế BT1 cho luồng L2 (buổi 3)
- [ ] Module tiếp nhận yêu cầu (buổi 8–10)
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

