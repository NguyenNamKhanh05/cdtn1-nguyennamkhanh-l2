# Tiếp nhận và phân loại yêu cầu bảo hành

Sinh viên: Nguyễn Nam Khánh - 2374802010222 - Track SE  
Học phần: Chuyên đề Tốt nghiệp 1, HK1 2026-2027  
Luồng nghiệp vụ: L2 – Tiếp nhận và phân loại yêu cầu bảo hành

## 1. Mục tiêu
Xây dựng một module nhỏ cho quy trình tiếp nhận bảo hành của Mekong Mobile. Hệ thống giúp tra cứu khách hàng theo số điện thoại, ghi nhận thiết bị và mô tả lỗi, chuẩn hóa phân loại nhóm sự cố, sinh hạn cam kết và theo dõi trạng thái phiếu.

## 2. Yêu cầu môi trường
Node.js 24.x hoặc 20 LTS  
PostgreSQL 16  
Biến môi trường: xem `.env.example`

## 3. Hướng dẫn chạy
1. Sao chép file `.env.example` thành `.env` và điền giá trị cần thiết.
2. Chạy `npm install`.
3. Chạy `npm test` để kiểm tra smoke test.
4. Chạy `npm start` rồi mở `http://localhost:3000/health`.

## 4. Cấu trúc thư mục
- `src/`: mã nguồn ứng dụng.
- `tests/`: kiểm thử smoke test.
- `docs/`: minh chứng và ghi chú triển khai.
- `data/`: dữ liệu mẫu hoặc dữ liệu làm việc.

## 5. Kiểm thử
Chạy `npm test` để xác nhận endpoint `/health` hoạt động.

## 6. Trạng thái hiện tại
- [x] Khởi tạo project, smoke test chạy được (buổi 2)
- [ ] Module tiếp nhận yêu cầu (buổi 8–10)
- [ ] Module phân công kỹ thuật viên (buổi 10–12)
