# PHỤ LỤC. BẢNG KHAI BÁO SỬ DỤNG AI

**Họ và tên:** Nguyễn Nam Khánh
**MSSV:** 2374802010222
**Luồng nghiệp vụ:** L2 - Tiếp nhận và phân loại yêu cầu bảo hành
**Track:** Software Engineering (SE)
**Ngày:** 08/10/2026

| Công cụ | Dùng vào việc gì | Áp dụng ở phần nào | Đã kiểm chứng thế nào |
|---|---|---|---|
| GitHub Copilot/Copilot Chat | Đọc và tóm tắt tài liệu case study, đề Buổi 2, Buổi 3 và BT1. | Phân tích phạm vi luồng L2 và yêu cầu của bài tập. | Đối chiếu với tài liệu môn học và case study Mekong Mobile. |
| GitHub Copilot/Copilot Chat | Gợi ý và hoàn thiện User Story, MoSCoW, yêu cầu chức năng, yêu cầu phi chức năng và quy tắc nghiệp vụ. | `docs/srs.md`, gồm các mục từ 1 đến 6. | Kiểm tra vai trò, mục tiêu, giá trị của User Story; kiểm tra mã FR, NFR và bảng truy vết. |
| GitHub Copilot/Copilot Chat | Hỗ trợ tạo mã khung API và smoke test. | `src/app.js`, `src/server.js`, `tests/smoke-test.js`. | Đã chạy `npm test`; endpoint `GET /health` trả về `{"status":"ok"}`. |
| GitHub Copilot/Copilot Chat | Hỗ trợ thiết kế API Contract theo track SE. | `docs/api-contract.md`. | Kiểm tra endpoint, request/response JSON, mã HTTP, validation và bảng truy vết endpoint về User Story. |
| GitHub Copilot/Copilot Chat | Hỗ trợ thiết kế mô hình dữ liệu và SQL DDL. | `docs/schema.sql`, `docs/erd.drawio`. | Kiểm tra các bảng, khóa chính, khóa ngoại, ràng buộc dữ liệu và index. |
| GitHub Copilot/Copilot Chat | Hỗ trợ mô tả Use Case và tạo sơ đồ Use Case. | `docs/usecase.md`, `docs/usecase.drawio`. | Đối chiếu actor, ranh giới hệ thống, use case, quan hệ `<<include>>`, `<<extend>>`, luồng chính và luồng ngoại lệ. |
| GitHub Copilot/Copilot Chat | Hỗ trợ thiết kế kiến trúc hệ thống. | `docs/architecture.md`, `docs/architecture.drawio`. | Kiểm tra luồng trao đổi giữa Client, API, Application Service, Domain Rules, Repository và PostgreSQL; đối chiếu với các NFR. |
| GitHub Copilot/Copilot Chat | Hỗ trợ thiết kế wireframe và dữ liệu mẫu. | `docs/wireframe.md`, `docs/wireframe.drawio`, `docs/wireframe.drawio.png`, `data/sample/`. | Kiểm tra wireframe có 3 màn hình và các trường hiển thị khớp với SRS, API Contract và mô hình dữ liệu. |
| GitHub Copilot/Copilot Chat | Hỗ trợ rà soát, diễn đạt và hoàn thiện phụ lục khai báo sử dụng AI. | `docs/ai-declaration.md` và phụ lục báo cáo BT1. | Đối chiếu từng nội dung khai báo với các file đã sử dụng trong repo; đọc lại và chỉnh sửa trước khi nộp. |

## Cam kết của sinh viên

Tôi xác nhận đã sử dụng GitHub Copilot/Copilot Chat như một công cụ hỗ trợ trong quá trình phân tích, thiết kế, lập trình và kiểm thử. Công cụ AI được sử dụng để gợi ý, tóm tắt, hỗ trợ viết mã và rà soát tài liệu; tôi không sử dụng kết quả một cách máy móc.

Tôi đã đọc lại, kiểm tra, đối chiếu và chỉnh sửa các nội dung trước khi đưa vào bài báo cáo. Tôi hiểu nội dung đã nộp và chịu trách nhiệm về tính chính xác, tính phù hợp cũng như toàn bộ sản phẩm cuối cùng.

**Họ và tên:** Nguyễn Nam Khánh
**MSSV:** 2374802010222
**Ngày:** 08/10/2026
**Chữ ký:** ___________________________