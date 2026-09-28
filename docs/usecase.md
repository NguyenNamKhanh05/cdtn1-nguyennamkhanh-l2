# Use Case - Luồng L2

## Danh sách use case

- **UC1:** Tra cứu khách hàng theo số điện thoại
- **UC2:** Tạo khách hàng mới khi chưa tồn tại
- **UC3:** Tạo phiếu bảo hành mới
- **UC4:** Phân loại nhóm sự cố và mức ưu tiên
- **UC5:** Xem danh sách phiếu theo trạng thái và hạn cam kết
- **UC6:** Cập nhật trạng thái phiếu

## UC3 - Tạo phiếu bảo hành mới

- **Actor chính:** Nhân viên tiếp nhận
- **Mục tiêu:** Ghi nhận yêu cầu bảo hành mới để theo dõi đến khi đóng.
- **Điều kiện trước:** Nhân viên đã đăng nhập; trung tâm đang hoạt động; khách hàng và thiết bị đã được tra cứu hoặc tạo mới.
- **Điều kiện sau:** Một phiếu có mã duy nhất, trạng thái `MOI`, hạn cam kết và bản ghi lịch sử trạng thái đầu tiên được lưu.
- **User Story liên quan:** US1, US2, US3, US4, US5
- **Mức ưu tiên:** MUST

### Luồng chính

1. Nhân viên chọn chức năng tạo phiếu bảo hành.
2. Nhân viên nhập số điện thoại khách hàng.
3. Hệ thống chuẩn hóa số điện thoại và hiển thị hồ sơ khách hàng (include UC1).
4. Nhân viên chọn thiết bị hoặc nhập serial/IMEI hợp lệ.
5. Nhân viên nhập mô tả lỗi.
6. Nhân viên chọn nhóm sự cố và mức ưu tiên (include UC4).
7. Hệ thống sinh hạn cam kết theo QT-04.
8. Nhân viên bấm Lưu.
9. Hệ thống sinh mã phiếu, lưu phiếu ở trạng thái `MOI`, ghi log trạng thái và trả kết quả.

### Luồng ngoại lệ

- **3a.** Số điện thoại chưa tồn tại: hệ thống mở form tạo khách hàng mới, sau khi lưu quay lại bước 4 (extend UC2).
- **4a.** Serial/IMEI đã thuộc thiết bị khác: hệ thống từ chối và hiển thị bản ghi xung đột; không tạo phiếu.
- **5a.** Mô tả lỗi trống: hệ thống từ chối lưu, báo trường bắt buộc và giữ dữ liệu đã nhập.
- **6a.** Mức ưu tiên không hợp lệ: hệ thống yêu cầu chọn một trong ba giá trị `CAO`, `TRUNG_BINH`, `THAP`.
- **7a.** Không xác định được ngày mua: hệ thống đánh dấu chưa xác minh bảo hành và yêu cầu quản lý phê duyệt.
- **9a.** Mất kết nối khi lưu: hệ thống không tạo bản ghi trùng; client được phép gửi lại cùng `request_id`.

## UC5 - Xem danh sách phiếu theo trạng thái và hạn cam kết

- **Actor chính:** Quản lý trung tâm
- **Mục tiêu:** Theo dõi khối lượng phiếu và phát hiện phiếu sắp quá hạn.
- **Điều kiện trước:** Quản lý đã đăng nhập và thuộc trung tâm cần xem.
- **Điều kiện sau:** Danh sách được lọc theo trạng thái, hạn cam kết và phạm vi trung tâm.
- **User Story liên quan:** US6
- **Mức ưu tiên:** SHOULD

### Luồng chính

1. Quản lý mở màn hình danh sách phiếu.
2. Hệ thống hiển thị bộ lọc trạng thái và hạn cam kết.
3. Quản lý chọn điều kiện lọc.
4. Hệ thống trả danh sách phiếu thuộc trung tâm của quản lý, sắp xếp hạn cam kết tăng dần.
5. Quản lý mở một phiếu để xem chi tiết.

### Luồng ngoại lệ

- **4a.** Không có phiếu phù hợp: hệ thống hiển thị danh sách rỗng và thông báo không có kết quả.
- **4b.** Người dùng không thuộc trung tâm của phiếu: hệ thống trả lỗi 403 và không hiển thị dữ liệu.
