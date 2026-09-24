# Phiếu phạm vi buổi 2 - Track SE

**Họ tên:** Nguyễn Nam Khánh
**MSSV:** 2374802010222  
**Track:** SE

## 1. Luồng nghiệp vụ chọn
- **Mã luồng:** L2
- **Tên luồng:** Tiếp nhận và phân loại yêu cầu bảo hành

## 2. Phạm vi diễn đạt bằng một câu
Nhân viên tiếp nhận tra cứu khách theo số điện thoại, ghi nhận thiết bị và mô tả lỗi, phân loại nhóm sự cố và mức ưu tiên, sinh hạn cam kết, rồi theo dõi trạng thái phiếu cho đến khi đóng.

## 3. Danh sách sơ bộ 5–7 User Story dự kiến
1. **US1.** Là nhân viên tiếp nhận, tôi muốn tra cứu hồ sơ khách hàng theo số điện thoại để dùng lại thông tin đã có và tránh tạo trùng.
2. **US2.** Là nhân viên tiếp nhận, tôi muốn ghi nhận thông tin thiết bị như serial/IMEI, ngày mua và nơi mua để lập phiếu bảo hành đầy đủ.
3. **US3.** Là nhân viên tiếp nhận, tôi muốn nhập mô tả lỗi do khách kể và chọn nhóm sự cố để chuẩn hóa thông tin tiếp nhận.
4. **US4.** Là hệ thống, tôi muốn tự sinh mức ưu tiên và hạn cam kết theo quy tắc nghiệp vụ để giảm sai sót khi nhập phiếu.
5. **US5.** Là quản lý trung tâm, tôi muốn xem danh sách phiếu theo trạng thái và hạn cam kết để theo dõi các phiếu sắp quá hạn.
6. **US6.** Là nhân viên tiếp nhận, tôi muốn cập nhật trạng thái phiếu và lưu lịch sử chuyển trạng thái để truy vết quá trình xử lý.
7. **US7.** Là quản lý trung tâm, tôi muốn xem các phiếu đã đóng và kết quả xử lý để đối chiếu và báo cáo công việc.

## 4. Dữ liệu sẽ làm việc
- [x] Dùng dữ liệu mẫu của case study
- [ ] Sinh mô phỏng

**Ước lượng số bản ghi cần thiết:** khoảng 7.800 phiếu lịch sử, 31.000 dòng lịch sử trạng thái, và dữ liệu danh mục phụ trợ cỡ vài chục đến vài trăm bản ghi.

## 5. Công nghệ dự kiến
- **Ngôn ngữ:** JavaScript / TypeScript
- **Framework:** Node.js + Express
- **CSDL:** PostgreSQL 16
- **Công cụ phụ:** GitHub, VS Code

## Ghi chú ngắn
- Phạm vi tập trung vào một luồng nghiệp vụ duy nhất, không mở rộng sang phân công kỹ thuật viên hay kho linh kiện.
- Phần hiện thực dự kiến có thể bắt đầu từ module tiếp nhận phiếu và module theo dõi trạng thái.
