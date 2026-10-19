# PHỤ LỤC. BẢNG KHAI BÁO SỬ DỤNG AI

**Họ và tên:** Nguyễn Nam Khánh
**MSSV:** 2374802010222
**Lớp:** [Điền tên lớp]
**Luồng nghiệp vụ:** L2 - Tiếp nhận và phân loại yêu cầu bảo hành
**Track:** Software Engineering (SE)
**Ngày nộp:** 19/10/2026

| Công cụ | Dùng vào việc gì | Áp dụng ở phần nào | Đã kiểm chứng thế nào |
|---|---|---|---|
| GitHub Copilot/Copilot Chat | Đọc và tóm tắt tài liệu case study, đề Buổi 2, Buổi 3 và BT1. | Phân tích phạm vi luồng L2 và yêu cầu của bài tập. | Đối chiếu với tài liệu môn học và case study Mekong Mobile. |
| GitHub Copilot/Copilot Chat | Gợi ý User Story, MoSCoW, FR, NFR và quy tắc nghiệp vụ. | `docs/srs.md`. | Kiểm tra lại với yêu cầu bài tập, bảng truy vết và tiêu chí chấp nhận. |
| GitHub Copilot/Copilot Chat | Hỗ trợ tạo mã khung endpoint và smoke test. | `src/app.js`, `src/server.js`, `tests/smoke-test.js`. | Đã chạy `npm test`; endpoint `GET /health` trả về trạng thái `ok`. |
| GitHub Copilot/Copilot Chat | Hỗ trợ thiết kế API Contract. | `docs/api-contract.md`. | Kiểm tra endpoint, JSON request/response, mã HTTP, validation và truy vết User Story. |
| GitHub Copilot/Copilot Chat | Hỗ trợ gợi ý mô hình dữ liệu và SQL DDL. | `docs/schema.sql`, `docs/erd.drawio`. | Kiểm tra bảng, khóa chính, khóa ngoại, ràng buộc và index; sau đó tự vẽ lại mô hình theo ý tưởng cá nhân. |
| GitHub Copilot/Copilot Chat | Hỗ trợ gợi ý mô tả Use Case và kiến trúc. | `docs/usecase.md`, `docs/usecase.drawio`, `docs/architecture.md`, `docs/architecture.drawio`. | Đối chiếu và tự chỉnh sửa actor, use case, luồng ngoại lệ, các lớp kiến trúc và NFR. |
| GitHub Copilot/Copilot Chat | Hỗ trợ gợi ý thiết kế wireframe và dữ liệu mẫu. | `docs/wireframe.md`,  `data/sample/`. | Kiểm tra có đủ 3 màn hình và các trường khớp với SRS, API và mô hình dữ liệu; sau đó tự vẽ lại bằng draw.io theo ý tưởng cá nhân. |
| OpenCode (DeepSeek V4.1 Flash) | Gợi ý cấu trúc 3 lớp (route – service – repository), khung validator và JSDoc cho hàm công khai. | `src/routes/`, `src/services/`, `src/repositories/`, `src/validators/`. | Đọc lại từng hàm, đối chiếu với QT-01..QT-06, QT-13..QT-15 trong `docs/srs.md`; chạy `npm test` (TC-01..TC-13) và `npm run demo` trên PostgreSQL thật. |
| OpenCode (DeepSeek V4.1 Flash) | Gợi ý công thức tính hạn cam kết bỏ Chủ nhật (QT-04) và hàm chuẩn hóa/che số điện thoại (QT-02, QT-15). | `src/domain/sla.js`, `src/domain/phone.js`. | Kiểm thử biên: thứ Bảy + 24h ra thứ Hai, ngày cuối bảo hành vẫn còn hạn; thử `+84`, `84`, dấu cách, dấu chấm. |
| OpenCode (DeepSeek V4.1 Flash) | Gợi ý script setup bằng Docker Compose và xử lý chờ CSDL sẵn sàng. | `docker-compose.yml`, `scripts/db.js`, `scripts/cho-db.js`, `scripts/run-sql.js`. | Chạy `npm run db:reset` rồi `npm run setup` trên máy sạch; chạy lại lần hai để kiểm tra không nhân đôi dữ liệu. |
| OpenCode (DeepSeek V4.1 Flash) | Gợi ý nội dung hướng dẫn kiểm thử Postman. | `docs/huong-dan-postman.md`. | Tự bấm lại từng request trong Postman và đối chiếu mã HTTP, body với tài liệu; chụp ảnh lưu trong `docs/export/`. |
| OpenCode (DeepSeek V4.1 Flash) | Gợi ý tách quy tắc nghiệp vụ thành module domain thuần (tính hạn, vòng đời trạng thái, số điện thoại) và viết test theo TC-01..TC-13. | `src/domain/`, `tests/ticket.service.test.js`. | Chạy `npm test`, cả 13 test đều pass; thử sửa một hằng số SLA thấy test báo đỏ ngay nên biết test có tác dụng thật. |
| OpenCode (DeepSeek V4.1 Flash) | Gợi ý migration và ràng buộc CSDL: khóa ngoại, `UNIQUE`, `CHECK`, partial unique index cho `request_id`. | `migrations/001_create_core.sql`, `002_add_request_id.sql`, `003_add_catalog.sql`. | Chạy `npm run db:reset` rồi `npm run setup` từ CSDL trống; thử tạo trùng số điện thoại và trùng serial, cả hai đều bị chặn đúng. |
| OpenCode (DeepSeek V4.1 Flash) | Gợi ý xử lý lỗi tập trung: lớp `AppError`, mã lỗi và middleware đổi lỗi sang HTTP. | `src/errors/AppError.js`, `src/routes/`. | Gửi body thiếu trường và body sai JSON bằng Postman/curl; nhận lần lượt 400 `DU_LIEU_KHONG_HOP_LE` và 400 thay vì 500. |
| OpenCode (DeepSeek V4.1 Flash) | Gợi ý phân quyền tạm bằng header `X-User-Role`, `X-Center-Id` cho QT-14 và QT-15. | `src/middleware/ngu-canh.js`. | Gọi cùng một request với hai vai trò: nhân viên thấy `090123****`, quản lý thấy số đầy đủ; nhân viên xem phiếu trung tâm khác nhận 403. |
| OpenCode (DeepSeek V4.1 Flash) | Gợi ý cách viết README theo hướng clone về là chạy và bảng xử lý sự cố. | `README.md`. | Làm đúng 4 lệnh trong README trên máy không có sẵn `.env`; `GET /health` trả `"connected": true`, `GET /tickets` trả đúng 3 phiếu. |
| OpenCode (DeepSeek V4.1 Flash) | Gợi ý chia commit theo Conventional Commits (`feat`, `chore`, `docs`). | Lịch sử Git của repo. | Xem `git log --oneline` thấy mỗi commit một nhóm thay đổi và đúng tiền tố; `git status` sạch sau khi push. |

## Ghi chú về phạm vi sử dụng

- Các quy tắc nghiệp vụ QT-01..QT-06, QT-13..QT-15 được lấy từ SRS của case study; AI chỉ hỗ trợ diễn đạt thành mã, không tự đặt ra quy tắc mới.
- Quy định QD-01 (một thiết bị không có hai phiếu mở) do sinh viên bổ sung sau khi nhận thấy QT-06 cho phép một thiết bị quay lại nhiều lần; đã ghi rõ trong README và SRS là quy định bổ sung, không phải QT-09.
- QT-07..QT-12 thuộc các luồng L4/L5/L8/L9 nên không hiện thực trong bài này.
- Công cụ theo từng giai đoạn: các dòng đầu bảng (phân tích, SRS, Use Case, kiến trúc, wireframe, API contract của BT1) dùng GitHub Copilot/Copilot Chat; các dòng từ "Gợi ý cấu trúc 3 lớp" trở xuống (hiện thực module BT2) dùng OpenCode với mô hình DeepSeek V4.1 Flash.

## Cam kết của sinh viên

Tôi xác nhận đã đọc, hiểu và chịu trách nhiệm về toàn bộ nội dung nộp. Tôi đã sử dụng GitHub Copilot/Copilot Chat (BT1) và OpenCode (BT2) như những công cụ hỗ trợ trong quá trình phân tích, thiết kế, lập trình và kiểm thử. Công cụ AI được sử dụng để gợi ý, tóm tắt, hỗ trợ viết mã và rà soát tài liệu; tôi không sử dụng kết quả một cách máy móc.

Tôi đã đọc lại, kiểm tra, đối chiếu và chỉnh sửa các nội dung trước khi đưa vào bài báo cáo. Tôi hiểu nội dung đã nộp và chịu trách nhiệm về tính chính xác, tính phù hợp cũng như toàn bộ sản phẩm cuối cùng.

**Họ và tên:** Nguyễn Nam Khánh
**MSSV:** 2374802010222
**Lớp:** [Điền tên lớp]
**Ngày nộp:** 19/10/2026
**Chữ ký:** ___________________________