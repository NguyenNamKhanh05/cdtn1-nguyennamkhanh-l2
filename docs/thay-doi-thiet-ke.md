# Thay đổi thiết kế từ BT1 sang BT2

## 1. Tách module theo kiến trúc

BT1 mô tả kiến trúc gồm Presentation/API, Application Service, Domain Rules, Repository và PostgreSQL. BT2 ánh xạ các lớp này thành thư mục `src/routes/`, `src/validators/`, `src/services/`, `src/repositories/` và `src/errors/`.

Routes chỉ nhận HTTP và chuyển lỗi nghiệp vụ thành mã HTTP. Service chứa các quy tắc QT-03, QT-04, QT-05 và QT-09, không nhận `req`, `res` và không trả mã HTTP. Repository chỉ thực hiện đọc/ghi dữ liệu.

## 2. Repository bộ nhớ cho kiểm thử

BT2 có `BoNhoRepository` để unit test service không phụ thuộc PostgreSQL. Đây là repository thay thế dùng cho test và demo local; migration/seed PostgreSQL vẫn được cung cấp trong `migrations/` và `seeds/` để dựng môi trường thật.

## 3. Quy tắc validation

Validation được tách thành ba tầng: validator kiểm tra kiểu và định dạng, service kiểm tra quy tắc nghiệp vụ, còn PostgreSQL bảo vệ toàn vẹn dữ liệu bằng constraint. Cách tách này giữ thông báo lỗi rõ ràng và không đưa SQL hoặc mã HTTP vào service.