## 9. Quy trình cập nhật dự án
Sau mỗi lần sửa code, thực hiện các lệnh sau trong thư mục dự án:

```powershell
git status
npm test
git add .
git commit -m "feat(ticket): mo ta ngan gon thay doi"
git push origin main
```

Thay nội dung commit theo loại thay đổi:

- `feat(...)`: thêm chức năng mới.
- `fix(...)`: sửa lỗi.
- `docs(...)`: cập nhật tài liệu.
- `test(...)`: thêm hoặc sửa kiểm thử.
- `chore(...)`: cập nhật cấu hình hoặc công cụ.

Ghi chi tiết thay đổi, kết quả kiểm thử và mã commit trong `docs/update-log.md`. Trên GitHub, mở tab **Commits** để xem ghi chú commit, chọn một commit để xem danh sách file và dòng code thay đổi, hoặc mở **History** của từng file để xem lịch sử riêng file đó.
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
- `data/sample/`: mẫu dữ liệu nhỏ được commit để kiểm thử.
- `data/raw/`: dữ liệu gốc cục bộ, không commit.
- `dataset/`: bộ dữ liệu đầy đủ của case study, chỉ dùng cục bộ.

## 5. Dữ liệu L2
Nguồn dữ liệu đầy đủ nằm trong thư mục `dataset/` và được cung cấp từ bộ dữ liệu mô phỏng của case study. Luồng L2 sử dụng chính các tệp `tickets_history.csv`, `ticket_status_log.csv`, `customers_raw.csv`, `issue_categories.csv` và `service_centers.csv`.

Repo chỉ commit các mẫu nhỏ trong `data/sample/`; không commit dữ liệu lớn. Khi cần chạy với dữ liệu đầy đủ, đặt các tệp CSV vào `data/raw/` hoặc dùng trực tiếp từ `dataset/` ở máy cá nhân.

## 6. Kiểm thử
Chạy `npm test` để xác nhận endpoint `/health` hoạt động.

## 7. Trạng thái hiện tại
- [x] Khởi tạo project, smoke test chạy được (buổi 2)
- [ ] Module tiếp nhận yêu cầu (buổi 8–10)
- [ ] Module phân công kỹ thuật viên (buổi 10–12)

## 8. Nội dung đã cập nhật
- Đã tạo repo public và push nhánh `main` lên GitHub.
- Đã tạo cấu trúc `docs/`, `src/`, `tests/`, `data/`.
- Đã cấu hình `.gitignore` và `.env.example` theo track SE.
- Đã tạo endpoint `GET /health` và smoke test chạy thành công.
- Đã thêm mẫu dữ liệu L2 trong `data/sample/`.
- Đã thêm khai báo sử dụng AI tại `docs/ai-disclosure.md`.
- Dữ liệu đầy đủ trong `dataset/` chỉ dùng cục bộ và không commit lên Git.
