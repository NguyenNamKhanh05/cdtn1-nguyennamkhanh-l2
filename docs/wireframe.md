# Wireframe - 3 màn hình chính L2

## Màn hình 1 - Danh sách phiếu (UC5)

```text
+----------------------------------------------------------------+
| DANH SÁCH PHIẾU BẢO HÀNH                                      |
| Trạng thái [Tất cả v]  Hạn cam kết trước [dd/mm/yyyy] [Lọc]   |
+----------------------------------------------------------------+
| Mã phiếu | Khách hàng | Nhóm sự cố | Ưu tiên | Trạng thái | SLA|
| BH-0001  | Nguyễn A   | SAC        | CAO     | MOI        | 2h |
| BH-0002  | Trần B     | PIN        | TRUNG_BINH | DANG_XU_LY | 1d |
+----------------------------------------------------------------+
| [Tạo phiếu mới]                                  Trang 1 / 20 |
+----------------------------------------------------------------+
```

## Màn hình 2 - Tạo phiếu (UC1, UC2, UC3, UC4)

```text
+----------------------------------------------------------------+
| TẠO PHIẾU BẢO HÀNH                                             |
| Số điện thoại [________________] [Tra cứu]                     |
| Họ tên [____________________]  Địa chỉ [___________________]  |
| Thiết bị / Serial [____________________________]               |
| Ngày mua [__/__/____]  Trung tâm [____________ v]              |
| Loai yeu cau [BAO_HANH v]                                      |
| Mô tả lỗi [_______________________________________________]    |
| Nhóm sự cố [____________ v]  Mức ưu tiên [___________ v]       |
| Hạn cam kết [tự động sinh]                                     |
| [LỖI] Số điện thoại không hợp lệ / thiết bị hết hạn bảo hành   |
|                         [Hủy] [Lưu phiếu]                      |
+----------------------------------------------------------------+
```

## Màn hình 3 - Chi tiết phiếu (UC3, UC6)

```text
+----------------------------------------------------------------+
| CHI TIẾT PHIẾU BH-000123/2026                                  |
| Khách hàng | Số điện thoại che | Thiết bị | Trung tâm          |
| Nhóm sự cố | Ưu tiên | Hạn cam kết | Trạng thái                |
+----------------------------------------------------------------+
| Mô tả lỗi                                                        |
| Máy không sạc được                                             |
+----------------------------------------------------------------+
| LỊCH SỬ TRẠNG THÁI                                             |
| Thời điểm           Từ trạng thái -> Đến trạng thái | Người   |
| 28/09 10:00         (trống) -> MOI                 | NV01    |
| 28/09 11:30         MOI -> DA_PHAN_CONG            | QL02    |
+----------------------------------------------------------------+
| Chuyển trạng thái [________ v] Ghi chú [____________]         |
| [LỖI] Không thể chuyển trạng thái theo vòng đời QT-06         |
|                         [THOÁT] [Lưu]                         |
+----------------------------------------------------------------+
```

## Đối chiếu màn hình - mô hình dữ liệu - Use Case

| Màn hình/trường | Cột hoặc giá trị nguồn | Use Case | Luồng lỗi |
|---|---|---|---|
| Số điện thoại | `customer.phone` | UC1, UC2 | Sai định dạng hoặc không tìm thấy khách |
| Họ tên, địa chỉ | `customer.full_name`, `customer.address` | UC2 | Thiếu họ tên |
| Serial/IMEI, ngày mua | `device.serial_no`, `device.purchase_date` | UC3 | Serial đã thuộc khách khác |
| Loại yêu cầu | `ticket.request_type` | UC3 | Giá trị chưa được cấu hình |
| Mô tả lỗi | `ticket.issue_desc` | UC3 | Bỏ trống mô tả |
| Nhóm sự cố, mức ưu tiên | `ticket.category_id`, `ticket.priority` | UC4 | Giá trị không hợp lệ |
| Hạn cam kết, trạng thái | `ticket.due_date`, `ticket.status` | UC3, UC5, UC6 | Thiết bị hết hạn hoặc chuyển trạng thái sai |
| Lịch sử chuyển trạng thái | `ticket_status_log` | UC6 | Không ghi được log thì rollback transaction |

Mọi trường bắt buộc của `ticket` đều được nhập trên màn hình hoặc hệ thống tự sinh (`ticket_code`, `status`, `received_at`, `due_date`).
