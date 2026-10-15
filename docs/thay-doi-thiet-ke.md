# Nhật ký thay đổi thiết kế

File này ghi lại các quyết định thay đổi từ BT1 sang BT2 để bảo đảm mã nguồn, tài liệu và thiết kế luôn nhất quán.

## Sau phản hồi Bài tập 1 (buổi 8, ngày 15/10/2026)

### TD-01 Tách kiến trúc thành các lớp mã nguồn

- **Phản hồi của GV:** Sơ đồ kiến trúc phải được thể hiện rõ trong cấu trúc thư mục thật; không dồn toàn bộ mã vào một file.
- **Quyết định:** SỬA.
- **Lý do:** Kiến trúc BT1 đã xác định các lớp Presentation/API, Application Service, Domain Rules, Repository và PostgreSQL. BT2 cần truy vết được từng lớp từ sơ đồ sang mã nguồn.
- **Ảnh hưởng:** Bổ sung `src/routes/`, `src/validators/`, `src/services/`, `src/repositories/` và `src/errors/`. Routes chỉ xử lý HTTP, service chứa quy tắc nghiệp vụ, repository chỉ đọc/ghi dữ liệu.

### TD-02 Bổ sung validation ba tầng

- **Phản hồi của GV:** Dữ liệu phải được kiểm tra ở đúng tầng; validation giao diện không đủ vì người dùng có thể gọi API trực tiếp.
- **Quyết định:** SỬA.
- **Lý do:** Tầng validator kiểm tra kiểu và định dạng, service kiểm tra quy tắc nghiệp vụ, còn PostgreSQL bảo vệ toàn vẹn dữ liệu bằng constraint. Tầng service là nơi bắt buộc thực hiện QT-03, QT-04, QT-05 và QT-09.
- **Ảnh hưởng:** Thêm `src/validators/ticket.validator.js`, các hàm quy tắc trong `src/services/ticket.service.js` và các ràng buộc `NOT NULL`, `UNIQUE`, `FOREIGN KEY`, `CHECK` trong migration.

### TD-03 Bổ sung mã lỗi nghiệp vụ riêng

- **Phản hồi của GV:** Không được trả lỗi SQL hoặc stack trace cho người dùng; service không được biết mã HTTP.
- **Quyết định:** SỬA.
- **Lý do:** Lỗi nghiệp vụ cần có mã ổn định, thông báo rõ ràng và có thể được gọi từ REST API, script hoặc unit test. Chỉ routes mới dịch mã nghiệp vụ sang mã HTTP.
- **Ảnh hưởng:** Thêm `src/errors/AppError.js`. Các lỗi như `KHACH_KHONG_TON_TAI`, `THIET_BI_KHONG_THUOC_KHACH` và `PHIEU_DANG_MO` được service phát sinh, routes chuyển thành mã `404` hoặc `409` tương ứng.

### TD-04 Bổ sung migration và seed có thể chạy lại

- **Phản hồi của GV:** Người chấm phải dựng được hệ thống từ CSDL trống; migration chạy lần hai không được lỗi và hệ thống phải có dữ liệu mẫu.
- **Quyết định:** SỬA.
- **Lý do:** BT2 yêu cầu clone-and-run. Chỉ có DDL trong BT1 thì chưa đủ để tạo môi trường và kiểm chứng luồng nghiệp vụ.
- **Ảnh hưởng:** Thêm `migrations/001_create_core.sql` với `IF NOT EXISTS` và index; thêm `seeds/001_seed_demo.sql` dùng `ON CONFLICT` để không nhân đôi dữ liệu; bổ sung lệnh `npm run migrate` và `npm run seed` trong README.

### TD-05 Bổ sung kiểm thử service

- **Phản hồi của GV:** Phải có ít nhất ba test thuộc ba loại: luồng đúng, giá trị biên và dữ liệu sai.
- **Quyết định:** SỬA.
- **Lý do:** Quy tắc nghiệp vụ nằm ở service nên cần được kiểm thử độc lập, không phụ thuộc máy chủ web hoặc CSDL thật.
- **Ảnh hưởng:** Thêm `tests/ticket.service.test.js` với TC-01 kiểm tra thiết bị còn bảo hành, TC-02 kiểm tra ngày biên hết hạn và TC-03 kiểm tra serial đã có phiếu đang mở. Repository bộ nhớ chỉ dùng làm repository giả cho unit test.

### TD-06 Giữ nguyên việc không tách bảng dia_chi

- **Phản hồi của GV:** Có thể tách địa chỉ thành bảng riêng để chuẩn hóa.
- **Quyết định:** GIỮ NGUYÊN.
- **Lý do:** Phạm vi L2 chỉ lưu một địa chỉ liên hệ cho mỗi khách hàng và chưa có quan hệ một-nhiều. Tách bảng sẽ thêm phép nối nhưng không đem lại lợi ích trong phạm vi hiện tại.
- **Ảnh hưởng:** Không thay đổi mô hình dữ liệu. Địa chỉ tiếp tục nằm trong bảng `customer` và được ghi rõ trong tài liệu thiết kế.

### TD-07 Giữ nguyên mô hình dữ liệu sáu bảng của BT1

- **Phản hồi của GV:** Mô hình dữ liệu phải thống nhất với ERD, DDL và code.
- **Quyết định:** GIỮ NGUYÊN.
- **Lý do:** Sáu bảng `customer`, `service_center`, `device`, `issue_category`, `ticket` và `ticket_status_log` đã đáp ứng phạm vi L2, khóa ngoại và yêu cầu lưu lịch sử trạng thái.
- **Ảnh hưởng:** Migration và seed được xây dựng theo đúng mô hình sáu bảng; không thêm bảng ngoài phạm vi như kho linh kiện hoặc kỹ thuật viên.