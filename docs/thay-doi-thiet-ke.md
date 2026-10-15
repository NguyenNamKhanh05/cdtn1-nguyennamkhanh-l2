# Nhật ký thay đổi thiết kế

File này ghi lại các quyết định thay đổi từ BT1 sang BT2 để bảo đảm mã nguồn, tài liệu và thiết kế luôn nhất quán.

## Sau phản hồi Bài tập 1 (buổi 8, ngày 15/10/2026)

### TD-01 Bổ sung chú thích ký hiệu cho sơ đồ ERD

- **Phản hồi của GV:** Sơ đồ ERD ở mục 4.1 chưa có khung chú thích các ký hiệu `PK`, `FK` và quan hệ `1:N`. Theo checklist, mọi sơ đồ phải có chú thích để có thể đọc độc lập.
- **Quyết định:** SỬA.
- **Lý do:** Người xem cần hiểu khóa chính, khóa ngoại và lực lượng quan hệ mà không phải suy đoán từ sơ đồ.
- **Ảnh hưởng:** Bổ sung khung legend vào `docs/erd.drawio`, gồm `PK` - khóa chính, `FK` - khóa ngoại và `1:N` - quan hệ một-nhiều. Không thay đổi các bảng hoặc quan hệ dữ liệu đã thiết kế.

### TD-02 Ghi mã Use Case trên từng wireframe

- **Phản hồi của GV:** Ba wireframe chưa ghi rõ mỗi màn hình phục vụ Use Case nào.
- **Quyết định:** SỬA.
- **Lý do:** Mã Use Case giúp truy vết trực tiếp từ màn hình sang yêu cầu và đặc tả nghiệp vụ.
- **Ảnh hưởng:** Cập nhật `docs/wireframe.md` và sơ đồ wireframe để ghi rõ: Màn hình 1 - `UC5`, Màn hình 2 - `UC1`, `UC2`, `UC3`, `UC4`, Màn hình 3 - `UC3`, `UC6`. Không thay đổi nội dung nghiệp vụ hoặc bố cục chức năng của ba màn hình.

