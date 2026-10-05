# Thiết kế kiến trúc - L2

## Sơ đồ thành phần và kiến trúc phân lớp

Hệ thống được mô tả bằng bốn lớp, đủ chi tiết để hiện thực và đủ gọn để đọc:

```text
HỆ THỐNG: Tiếp nhận và phân loại yêu cầu bảo hành (track SE)
+----------------------------------------------------------------+
| LỚP TRÌNH BÀY                                                  |
| [Trang tiếp nhận] [Danh sách phiếu] [Chi tiết phiếu]           |
+----------------------------------------------------------------+
| v HTTP + JSON (hợp đồng API ở docs/api-contract.md)             |
+----------------------------------------------------------------+
| LỚP NGHIỆP VỤ (SERVICE)                                       |
| TicketService - tạo phiếu, kiểm quy tắc bắt buộc               |
| ClassifyService - chọn nhóm sự cố và mức ưu tiên               |
| WarrantyService - kiểm tra hạn bảo hành, sinh hạn cam kết     |
| >>> TOÀN BỘ quy tắc QT-01..QT-06 nằm trong lớp này <<<         |
+----------------------------------------------------------------+
| v gọi qua giao diện Repository                                 |
+----------------------------------------------------------------+
| LỚP TRUY CẬP DỮ LIỆU                                          |
| CustomerRepository DeviceRepository TicketRepository           |
| IssueCategoryRepository StatusLogRepository                    |
+----------------------------------------------------------------+
| v SQL                                                        |
+----------------------------------------------------------------+
| LỚP LƯU TRỮ - PostgreSQL 16                                   |
| customer, device, service_center, issue_category, ticket,      |
| ticket_status_log                                              |
+----------------------------------------------------------------+
CHÚ THÍCH: [ ] = màn hình; v = hướng phụ thuộc một chiều.
NGOÀI PHẠM VI (WON'T): gửi SMS, đồng bộ kế toán, kho linh kiện,
phân công kỹ thuật viên theo thuật toán và báo cáo toàn công ty.
```

| Lớp | Trách nhiệm | Không làm |
|---|---|---|
| **1. Presentation** | Controller nhận HTTP/JSON, kiểm tra dữ liệu đầu vào, xác thực vai trò và chuyển lỗi thành mã HTTP. | Không chứa SQL và không tự quyết định quy tắc bảo hành. |
| **2. Business / Service** | `TicketService` điều phối use case, chứa QT-01 đến QT-06, mô hình miền và state machine của phiếu. | Không biết PostgreSQL lưu dữ liệu bằng câu SQL nào. |
| **3. Repository / DAO** | `CustomerRepository`, `DeviceRepository`, `TicketRepository` đọc/ghi dữ liệu, transaction và truy vấn có index. | Không chứa quy tắc nghiệp vụ hoặc gọi ngược Controller. |
| **4. Data store** | PostgreSQL bảo đảm PK, FK, UNIQUE, NOT NULL, CHECK và lưu lịch sử trạng thái. | Không gọi ngược lên Service. |

Phụ thuộc chỉ đi một chiều: `Presentation -> Business/Service -> Repository -> PostgreSQL`. Domain rules nằm trong Business/Service; Repository chỉ làm việc với dữ liệu. Luồng tạo phiếu là: `POST /api/v1/tickets` -> `TicketService.create()` -> repository transaction -> `ticket` và `ticket_status_log` -> HTTP 201. Nếu thiết bị hết hạn, Service trả lỗi miền và Presentation chuyển thành HTTP 422; không lớp nào nhảy cóc.

## Lập luận lựa chọn

- Vì **NFR1** yêu cầu danh sách phiếu phản hồi dưới 2 giây với 10.000 phiếu, tôi chọn phân trang ở Repository và index `(status, due_date)` thay vì tải toàn bộ rồi lọc ở Presentation; đánh đổi là tốn thêm dung lượng index và chi phí khi cập nhật phiếu.
- Vì **NFR2** yêu cầu 100% request được kiểm tra vai trò và phạm vi trung tâm, tôi đặt xác thực ở Presentation và kiểm tra quyền nghiệp vụ ở Service thay vì tin vào dữ liệu từ giao diện; đánh đổi là mỗi use case phải có bước kiểm tra quyền và test riêng.
- Vì **NFR3** yêu cầu tạo phiếu và log trạng thái phải atomic, tôi chọn một transaction trong Repository thay vì hai lần ghi độc lập; đánh đổi là transaction giữ kết nối lâu hơn nhưng tránh dữ liệu phiếu không có lịch sử.
- Vì **NFR4** yêu cầu thêm nhóm sự cố hoặc loại yêu cầu không sửa mã nguồn xử lý, tôi chọn bảng `issue_category` kết hợp cột `request_type` làm cấu hình thay vì hard-code; đánh đổi là cần kiểm tra `is_active`, giá trị hợp lệ và dữ liệu cấu hình.
- Tôi không thêm Redis cache hoặc Message Queue vì hiện không có NFR nào yêu cầu cache hoặc xử lý nền; bỏ chúng giúp prototype ít thành phần hơn và dễ kiểm thử, đánh đổi là chưa tối ưu cho tải lớn hoặc thông báo bất đồng bộ.

## Ngoài phạm vi

Module kho linh kiện, thuật toán phân công kỹ thuật viên, CSAT/NPS, marketing, báo cáo toàn công ty và triển khai production không nằm trong kiến trúc BT1.
