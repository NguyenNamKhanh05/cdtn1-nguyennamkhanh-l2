# SRS rút gọn - L2 Tiếp nhận và phân loại yêu cầu bảo hành

**Sinh viên:** Nguyễn Nam Khánh  
**MSSV:** 2374802010222  
**Track:** SE  
**Case study:** Smart CRM - Mekong Mobile

## 1. Giới thiệu và phạm vi

Mekong Mobile đang tiếp nhận yêu cầu bảo hành bằng phiếu giấy nên nhân viên phải hỏi lại thông tin khách hàng, khó phân loại lỗi và không theo dõi được hạn cam kết. Phạm vi L2 số hóa một luồng nhỏ: nhân viên tiếp nhận tra cứu khách theo số điện thoại, ghi nhận thiết bị và mô tả lỗi, phân loại nhóm sự cố và mức ưu tiên, sinh hạn cam kết, sau đó theo dõi trạng thái phiếu đến khi đóng.

**Chủ ý không làm trong BT1/BT2:** quản lý kho linh kiện, phân công kỹ thuật viên theo thuật toán, đặt lịch hẹn, báo cáo điều hành toàn công ty, gửi khảo sát CSAT và phân loại lỗi bằng mô hình AI. Các nội dung này thuộc các luồng khác hoặc mức WON'T của phạm vi hiện tại.

### Bảng thuật ngữ

| Thuật ngữ chuẩn | Định nghĩa dùng trong tài liệu |
|---|---|
| Khách hàng | Người đã mua sản phẩm hoặc sử dụng dịch vụ của Mekong Mobile. |
| Thiết bị | Máy của khách hàng, xác định bằng serial hoặc IMEI. |
| Phiếu bảo hành | Yêu cầu bảo hành hoặc sửa chữa có mã duy nhất và vòng đời trạng thái. |
| Nhóm sự cố | Danh mục nguyên nhân: MAN_HINH, PIN, SAC, PHAN_MEM, NUOC_VAO, KHAC. |
| Mức ưu tiên | CAO, TRUNG_BINH hoặc THAP; dùng để sinh hạn cam kết. |
| Hạn cam kết | Thời điểm chậm nhất phải hoàn tất phiếu theo mức ưu tiên. |
| Trạng thái phiếu | MOI, DA_PHAN_CONG, DANG_XU_LY, CHO_LINH_KIEN, HOAN_TAT, DA_DONG hoặc DA_HUY. |
| Nhân viên tiếp nhận | Người nhập và cập nhật thông tin phiếu tại trung tâm bảo hành. |
| Quản lý trung tâm | Người theo dõi phiếu và xử lý các trường hợp cần phê duyệt. |

## 2. Các bên liên quan và vai trò

| Actor | Được làm | Không được làm trong phạm vi này |
|---|---|---|
| Nhân viên tiếp nhận | Tra cứu khách, tạo phiếu, ghi nhận thiết bị, nhập mô tả lỗi, phân loại và cập nhật trạng thái theo quyền. | Không xóa vật lý phiếu, không xem dữ liệu ngoài trung tâm, không tự phê duyệt phiếu thiếu ngày mua. |
| Quản lý trung tâm | Xem danh sách phiếu, theo dõi hạn cam kết, phê duyệt trường hợp chưa xác minh bảo hành. | Không sửa lịch sử trạng thái đã ghi, không truy cập dữ liệu trung tâm khác. |
| Hệ thống nhắc hạn | Tự kiểm tra hạn cam kết và đánh dấu phiếu sắp quá hạn. | Không tự thay đổi nội dung nghiệp vụ hoặc trạng thái phiếu. |

## 3. Yêu cầu chức năng

### User Story và MoSCoW

| Mã | User Story | MoSCoW |
|---|---|---|
| US1 | Là nhân viên tiếp nhận, tôi muốn tra cứu hồ sơ khách hàng theo số điện thoại để dùng lại thông tin đã có và tránh tạo trùng. | MUST |
| US2 | Là nhân viên tiếp nhận, tôi muốn tạo hồ sơ khách hàng mới khi số điện thoại chưa tồn tại để tiếp tục lập phiếu. | MUST |
| US3 | Là nhân viên tiếp nhận, tôi muốn ghi nhận thiết bị và mô tả lỗi để lập phiếu bảo hành đầy đủ. | MUST |
| US4 | Là nhân viên tiếp nhận, tôi muốn chọn nhóm sự cố và mức ưu tiên để phiếu được xử lý theo quy tắc thống nhất. | MUST |
| US5 | Là nhân viên tiếp nhận, tôi muốn hệ thống tự sinh hạn cam kết từ mức ưu tiên để không phải tính thủ công. | MUST |
| US6 | Là quản lý trung tâm, tôi muốn xem phiếu theo trạng thái và hạn cam kết để phát hiện phiếu sắp quá hạn. | SHOULD |
| US7 | Là nhân viên tiếp nhận, tôi muốn cập nhật trạng thái phiếu và lưu lịch sử thay đổi để truy vết quá trình xử lý. | SHOULD |

### Functional Requirements

| Mã | Yêu cầu chức năng kiểm chứng được |
|---|---|
| FR1 | Khi nhập số điện thoại hợp lệ, hệ thống phải chuẩn hóa về dạng 10 chữ số bắt đầu bằng 0 và hiển thị hồ sơ phù hợp nếu đã tồn tại. |
| FR2 | Khi số điện thoại chưa tồn tại, hệ thống phải cho phép tạo khách hàng mới với họ tên và số điện thoại bắt buộc, đồng thời không tạo bản ghi trùng số điện thoại. |
| FR3 | Hệ thống phải cho phép tạo phiếu với khách hàng, thiết bị, mô tả lỗi, nhóm sự cố và mức ưu tiên; phiếu mới có mã duy nhất và trạng thái MOI. |
| FR4 | Hệ thống phải sinh hạn cam kết theo QT-04: CAO 24 giờ, TRUNG_BINH 72 giờ, THAP 120 giờ; việc tính ngày làm việc phải loại Chủ nhật. |
| FR5 | Hệ thống phải cho phép xem danh sách phiếu theo trạng thái và hạn cam kết, đồng thời ghi mọi chuyển trạng thái vào lịch sử. |

### Tiêu chí chấp nhận cho các story MUST

- **US1:** Given số điện thoại đã tồn tại, When nhân viên nhập số, Then hệ thống hiển thị hồ sơ khách; Given số có dấu cách hoặc tiền tố 84, Then hệ thống chuẩn hóa trước khi tra cứu.
- **US2:** Given số điện thoại chưa tồn tại, When nhân viên nhập họ tên và lưu, Then hệ thống tạo một khách hàng mới; Given số đã tồn tại, Then hệ thống từ chối tạo trùng.
- **US3:** Given thiếu mô tả lỗi, When nhân viên bấm lưu, Then hệ thống từ chối và chỉ rõ trường thiếu; Given dữ liệu đủ, Then phiếu được tạo ở trạng thái MOI.
- **US4:** Given nhóm sự cố được chọn, When nhân viên xác nhận phiếu, Then mức ưu tiên hợp lệ được lưu cùng phiếu.
- **US5:** Given mức ưu tiên CAO, When phiếu được tiếp nhận, Then hạn cam kết được sinh sau 24 giờ làm việc theo QT-04.

## 4. Yêu cầu phi chức năng

| Mã | Loại | Yêu cầu có ngưỡng đo được |
|---|---|---|
| NFR1 | Hiệu năng | API tra cứu khách và danh sách phiếu phải trả phản hồi trong dưới 2 giây với 10.000 phiếu và 65.000 khách trên máy phát triển có tối thiểu 8 GB RAM. |
| NFR2 | Bảo mật | 100% request tới API nghiệp vụ phải được kiểm tra vai trò; nhân viên chỉ được xem dữ liệu trung tâm của mình và số điện thoại phải che 4 số cuối. |
| NFR3 | Tin cậy | 100% thao tác tạo hoặc chuyển trạng thái phiếu phải nằm trong transaction; không tạo quá một phiếu khi client gửi lại cùng request id. |
| NFR4 | Bảo trì | Thêm một nhóm sự cố mới chỉ cần thêm một dòng dữ liệu cấu hình, không sửa mã nguồn xử lý và không thay đổi API hiện có. |

## 5. Ràng buộc và quy tắc nghiệp vụ

- **QT-01/QT-02:** Số điện thoại là duy nhất và phải chuẩn hóa về 10 chữ số bắt đầu bằng 0 trước khi lưu.
- **QT-03:** Thiết bị được xác định duy nhất bằng serial hoặc IMEI và chỉ thuộc một khách hàng tại một thời điểm.
- **QT-04:** Hạn cam kết là CAO 24 giờ, TRUNG_BINH 72 giờ, THAP 120 giờ; chỉ tính ngày làm việc từ thứ Hai đến thứ Bảy.
- **QT-05:** Nếu không có ngày mua, phiếu phải đánh dấu chưa xác minh bảo hành và cần quản lý phê duyệt.
- **QT-06:** Phiếu chỉ chuyển theo vòng đời hợp lệ; mọi lần chuyển phải ghi `ticket_status_log`, không quay lại trạng thái trước.
- **QT-13:** Không xóa vật lý phiếu, chỉ đánh dấu ngừng sử dụng và giữ lịch sử.
- **QT-14/QT-15:** Người dùng chỉ xem dữ liệu đúng đơn vị; số điện thoại hiển thị dạng che trừ quản lý và ban giám đốc.

## 6. Bảng truy vết yêu cầu

| Mã FR | Yêu cầu chức năng | User Story | Use Case | MoSCoW | Test case dự kiến |
|---|---|---|---|---|---|
| FR1 | Chuẩn hóa và tra cứu khách theo số điện thoại | US1 | UC1 | MUST | TC01, TC02 |
| FR2 | Tạo khách hàng mới không trùng số điện thoại | US2 | UC2 | MUST | TC03, TC04 |
| FR3 | Tạo phiếu với dữ liệu bắt buộc và trạng thái MOI | US3 | UC3 | MUST | TC05, TC06 |
| FR4 | Sinh hạn cam kết theo mức ưu tiên | US5 | UC4 | MUST | TC07, TC08 |
| FR5 | Xem và cập nhật trạng thái kèm lịch sử | US6, US7 | UC5, UC6 | SHOULD | TC09, TC10 |
