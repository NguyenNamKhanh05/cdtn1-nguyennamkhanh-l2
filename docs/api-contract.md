# API Contract - Luồng L2

**Base URL:** `/api/v1`  
**Định dạng:** JSON  
**Quyền:** mọi endpoint yêu cầu người dùng đã đăng nhập; phân quyền theo actor trong SRS.

## 1. Tra cứu khách hàng

`GET /customers?phone=0901234567`

**Response 200**
```json
{
  "data": {
    "customer_id": 14159,
    "full_name": "Nguyen Van Binh",
    "phone": "0901234567",
    "email": "binh@example.com"
  }
}
```

**Validation:** `phone` bắt buộc, chuỗi 10 chữ số sau chuẩn hóa.  
**Mã lỗi:** `400` sai định dạng, `404` không tìm thấy.

## 2. Tạo khách hàng

`POST /customers`

```json
{
  "full_name": "Nguyen Van Binh",
  "phone": "0901234567",
  "email": "binh@example.com",
  "address": "Can Tho"
}
```

**Response 201**
```json
{
  "data": {
    "customer_id": 14159,
    "full_name": "Nguyen Van Binh",
    "phone": "0901234567"
  }
}
```

**Validation:** `full_name` 1-120 ký tự; `phone` bắt buộc và duy nhất; `email` tối đa 120 ký tự nếu có.  
**Mã lỗi:** `400` dữ liệu không hợp lệ, `409` số điện thoại đã tồn tại.

## 3. Tạo phiếu bảo hành

`POST /tickets`

```json
{
  "customer_id": 14159,
  "device_id": 9001,
  "issue_desc": "May khong sac duoc",
  "category_id": 3,
  "priority": "TRUNG_BINH",
  "center_id": 2,
  "is_warranty": true,
  "request_id": "req-20260928-0001"
}
```

**Response 201**
```json
{
  "data": {
    "ticket_code": "BH-000123/2026",
    "status": "MOI",
    "priority": "TRUNG_BINH",
    "due_date": "2026-10-01T10:00:00Z"
  }
}
```

**Validation:** khách hàng, thiết bị, mô tả lỗi, nhóm sự cố, mức ưu tiên và trung tâm là bắt buộc; `priority` chỉ nhận `CAO`, `TRUNG_BINH`, `THAP`; `issue_desc` tối đa 2000 ký tự.  
**Mã lỗi:** `400` thiếu/sai dữ liệu, `404` không tìm thấy liên kết, `409` `request_id` đã xử lý.

## 4. Xem chi tiết phiếu

`GET /tickets/{ticket_id}`

**Response 200**
```json
{
  "data": {
    "ticket_id": 123,
    "ticket_code": "BH-000123/2026",
    "customer_id": 14159,
    "device_id": 9001,
    "issue_desc": "May khong sac duoc",
    "category_id": 3,
    "priority": "TRUNG_BINH",
    "status": "MOI",
    "received_at": "2026-09-28T10:00:00Z",
    "due_date": "2026-10-01T10:00:00Z"
  }
}
```

**Mã lỗi:** `401` chưa đăng nhập, `403` không có quyền trung tâm, `404` không tồn tại.

## 5. Danh sách phiếu

`GET /tickets?status=MOI&due_before=2026-10-01&page=1&page_size=20`

**Response 200**
```json
{
  "data": [],
  "meta": { "page": 1, "page_size": 20, "total": 0 }
}
```

**Validation:** `status` thuộc vòng đời phiếu; `page_size` từ 1 đến 100; `page` lớn hơn hoặc bằng 1.  
**Mã lỗi:** `400` query không hợp lệ, `403` sai phạm vi trung tâm.

## 6. Chuyển trạng thái phiếu

`POST /tickets/{ticket_id}/transitions`

```json
{
  "to_status": "DA_PHAN_CONG",
  "note": "Da tiep nhan va chuyen xu ly"
}
```

**Response 200**
```json
{
  "data": {
    "ticket_id": 123,
    "from_status": "MOI",
    "to_status": "DA_PHAN_CONG",
    "changed_at": "2026-09-28T11:00:00Z"
  }
}
```

**Validation:** chỉ cho phép chuyển theo QT-06; `note` tối đa 255 ký tự; phải ghi người thực hiện và thời điểm.  
**Mã lỗi:** `400` chuyển trạng thái không hợp lệ, `403` không đủ quyền, `404` không tồn tại, `409` trạng thái hiện tại đã thay đổi.
