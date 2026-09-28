# Thiết kế kiến trúc - L2

## Kiến trúc phân lớp

1. **Presentation/API:** nhận HTTP request, kiểm tra schema, xác thực và trả mã trạng thái.
2. **Application/Service:** điều phối use case, chuẩn hóa số điện thoại, sinh hạn cam kết và kiểm tra chuyển trạng thái.
3. **Domain:** chứa quy tắc QT-01 đến QT-06, mô hình `Customer`, `Device`, `Ticket` và `TicketStatusLog`.
4. **Persistence/Repository:** thực hiện truy vấn PostgreSQL, transaction và index theo các truy vấn L2.
5. **PostgreSQL:** lưu dữ liệu giao dịch và lịch sử; không thuộc phạm vi là UI quản trị ngoài L2, dịch vụ SMS và module kho linh kiện.

API gọi Service; Service gọi Domain và Repository; Repository trao đổi với PostgreSQL. Domain không phụ thuộc Express để quy tắc có thể kiểm thử độc lập.

## Lập luận lựa chọn

- Vì **NFR1** yêu cầu tra cứu và danh sách dưới 2 giây với 10.000 phiếu, tôi chọn PostgreSQL với index trên `phone`, `status, due_date` và phân trang, đánh đổi là phải thiết kế index và cập nhật chúng khi dữ liệu thay đổi.
- Vì **NFR2** yêu cầu 100% request được kiểm tra quyền và giới hạn theo trung tâm, tôi chọn lớp API kết hợp service kiểm tra phạm vi trung tâm, đánh đổi là mỗi use case cần thêm bước kiểm tra quyền và test riêng.
- Vì **NFR3** yêu cầu thao tác lưu phiếu và lịch sử phải atomic, tôi chọn repository transaction cho một request, đánh đổi là transaction dài làm giảm throughput nếu sau này thêm thao tác ngoài database.
- Vì **NFR4** yêu cầu thêm nhóm sự cố chỉ bằng dữ liệu cấu hình, tôi chọn bảng `issue_category` thay vì hard-code danh mục, đánh đổi là phải kiểm tra dữ liệu cấu hình và quản lý trạng thái active.

## Ngoài phạm vi

Module kho linh kiện, thuật toán phân công kỹ thuật viên, CSAT/NPS, marketing, báo cáo toàn công ty và triển khai production không nằm trong kiến trúc BT1.
