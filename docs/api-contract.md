# API Contract - Luồng L2

**Track:** Software Engineering (SE)
**Luồng:** L2 - Tiếp nhận và phân loại yêu cầu bảo hành
**Base URL:** `/api/v1`  
**Định dạng:** JSON  
**Xác thực:** mọi endpoint nghiệp vụ yêu cầu người dùng đã đăng nhập. Quyền và phạm vi trung tâm được kiểm tra theo actor trong SRS.

## 1. Quy ước response và mã HTTP

Response thành công sử dụng trường `data`. Response phân trang sử dụng thêm trường `meta`. Response lỗi có dạng:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dữ liệu không hợp lệ",
    "fields": {
      "phone": "Số điện thoại phải có 10 chữ số"
    }
  }
}
```

| Mã HTTP | Ý nghĩa áp dụng trong API L2 |
|---|---|
| 200 | Truy vấn hoặc cập nhật thành công. |
| 201 | Tạo mới khách hàng hoặc phiếu thành công. |
| 400 | Dữ liệu request, query hoặc chuyển trạng thái không hợp lệ. |
| 401 | Chưa đăng nhập hoặc token không hợp lệ. |
| 403 | Người dùng không có quyền hoặc truy cập sai trung tâm. |
| 404 | Không tìm thấy khách hàng, thiết bị, phiếu hoặc tài nguyên liên quan. |
| 409 | Xung đột dữ liệu: số điện thoại trùng, `request_id` đã xử lý hoặc trạng thái đã thay đổi. |

## 2. Endpoint cho các User Story MUST

### 2.1. Tra cứu khách hàng theo số điện thoại - US1

**Method và path:** `GET /customers?phone=0901234567`
**Mục đích:** Chuẩn hóa và tra cứu hồ sơ khách hàng theo số điện thoại.

**Response 200:**

```json
{
  "data": {
    "customer_id": 14159,
    "full_name": "Nguyen Van Binh",
    "phone": "0901234567",
    "email": "binh@example.com",
    "address": "Can Tho"
  }
}
```

**Kết quả lỗi:**

- `400 VALIDATION_ERROR`: thiếu `phone` hoặc số điện thoại sai định dạng.
- `401 UNAUTHORIZED`: chưa đăng nhập.
- `404 CUSTOMER_NOT_FOUND`: không tìm thấy khách hàng phù hợp.

### 2.2. Tạo khách hàng mới - US2

**Method và path:** `POST /customers`
**Mục đích:** Tạo hồ sơ khách hàng khi số điện thoại chưa tồn tại.

**Request:**

```json
{
  "full_name": "Nguyen Van Binh",
  "phone": "0901234567",
  "email": "binh@example.com",
  "address": "Can Tho"
}
```

**Response 201:**

```json
{
  "data": {
    "customer_id": 14159,
    "full_name": "Nguyen Van Binh",
    "phone": "0901234567",
    "email": "binh@example.com",
    "address": "Can Tho"
  }
}
```

**Kết quả lỗi:**

- `400 VALIDATION_ERROR`: thiếu họ tên, số điện thoại hoặc dữ liệu sai định dạng.
- `401 UNAUTHORIZED`: chưa đăng nhập.
- `409 PHONE_ALREADY_EXISTS`: số điện thoại đã được đăng ký.

### 2.3. Tạo phiếu bảo hành mới - US3, US4, US5

**Method và path:** `POST /tickets`
**Mục đích:** Tạo phiếu, lưu nhóm sự cố và mức ưu tiên, sau đó tự sinh hạn cam kết.

**Request:**

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

**Response 201:**

```json
{
  "data": {
    "ticket_id": 123,
    "ticket_code": "BH-000123/2026",
    "status": "MOI",
    "category_id": 3,
    "priority": "TRUNG_BINH",
    "received_at": "2026-09-28T10:00:00Z",
    "due_date": "2026-10-01T10:00:00Z",
    "is_warranty": true
  }
}
```

**Kết quả lỗi:**

- `400 VALIDATION_ERROR`: thiếu hoặc sai khách hàng, thiết bị, mô tả lỗi, nhóm sự cố, mức ưu tiên hoặc trung tâm.
- `401 UNAUTHORIZED`: chưa đăng nhập.
- `403 FORBIDDEN`: người dùng không thuộc trung tâm được gửi trong request.
- `404 RESOURCE_NOT_FOUND`: không tìm thấy khách hàng, thiết bị, nhóm sự cố hoặc trung tâm.
- `409 REQUEST_ALREADY_PROCESSED`: `request_id` đã được xử lý trước đó; không tạo phiếu trùng.

## 3. Endpoint hỗ trợ các User Story SHOULD/COULD

### 3.1. Xem chi tiết phiếu - hỗ trợ US6

**Method và path:** `GET /tickets/{ticket_id}`
**Mục đích:** Xem thông tin phiếu và trạng thái hiện tại.

**Response 200:**

```json
{
  "data": {
    "ticket_id": 123,
    "ticket_code": "BH-000123/2026",
    "customer_id": 14159,
    "device_id": 9001,
    "center_id": 2,
    "issue_desc": "May khong sac duoc",
    "category_id": 3,
    "priority": "TRUNG_BINH",
    "status": "MOI",
    "received_at": "2026-09-28T10:00:00Z",
    "due_date": "2026-10-01T10:00:00Z"
  }
}
```

**Kết quả lỗi:** `401` chưa đăng nhập, `403` sai phạm vi trung tâm, `404` không tìm thấy phiếu.

### 3.2. Xem danh sách phiếu - US6

**Method và path:** `GET /tickets?status=MOI&due_before=2026-10-01&page=1&page_size=20`
**Mục đích:** Lọc phiếu theo trạng thái và hạn cam kết để phát hiện phiếu sắp quá hạn.

**Response 200:**

```json
{
  "data": [
    {
      "ticket_id": 123,
      "ticket_code": "BH-000123/2026",
      "priority": "CAO",
      "status": "MOI",
      "due_date": "2026-09-29T10:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "page_size": 20,
    "total": 1
  }
}
```

**Kết quả lỗi:**

- `400 VALIDATION_ERROR`: trạng thái, ngày hoặc tham số phân trang không hợp lệ.
- `401 UNAUTHORIZED`: chưa đăng nhập.
- `403 FORBIDDEN`: sai phạm vi trung tâm.

### 3.3. Chuyển trạng thái phiếu - US7

**Method và path:** `POST /tickets/{ticket_id}/transitions`
**Mục đích:** Chuyển phiếu theo vòng đời hợp lệ và lưu lịch sử trạng thái.

**Request:**

```json
{
  "to_status": "DA_PHAN_CONG",
  "note": "Da tiep nhan va chuyen xu ly"
}
```

**Response 200:**

```json
{
  "data": {
    "ticket_id": 123,
    "from_status": "MOI",
    "to_status": "DA_PHAN_CONG",
    "changed_at": "2026-09-28T11:00:00Z",
    "changed_by": 27
  }
}
```

**Kết quả lỗi:**

- `400 INVALID_TRANSITION`: chuyển trạng thái không hợp lệ hoặc thiếu ghi chú cần thiết.
- `401 UNAUTHORIZED`: chưa đăng nhập.
- `403 FORBIDDEN`: không đủ quyền cập nhật phiếu.
- `404 TICKET_NOT_FOUND`: không tìm thấy phiếu.
- `409 STATE_CHANGED`: trạng thái hiện tại đã thay đổi bởi request khác.

## 4. Bảng quy tắc validation từng trường

### 4.1. Endpoint khách hàng

| Endpoint | Trường | Bắt buộc | Kiểu/độ dài | Dải giá trị và quy tắc |
|---|---|---:|---|---|
| `GET /customers` | `phone` | Có | String, 10 chữ số | Chuẩn hóa tiền tố `84` về `0`; duy nhất khi lưu. |
| `POST /customers` | `full_name` | Có | String, 1-120 ký tự | Không được rỗng. |
| `POST /customers` | `phone` | Có | String, 10 chữ số | Bắt đầu bằng `0`, không trùng dữ liệu hiện có. |
| `POST /customers` | `email` | Không | String, tối đa 120 ký tự | Phải đúng định dạng email nếu được gửi. |
| `POST /customers` | `address` | Không | String, tối đa 255 ký tự | Có thể bỏ trống. |

### 4.2. Endpoint tạo phiếu

| Trường | Bắt buộc | Kiểu/độ dài | Dải giá trị và quy tắc |
|---|---:|---|---|
| `customer_id` | Có | Integer dương | Phải tồn tại trong `customer`. |
| `device_id` | Có | Integer dương | Phải tồn tại và thuộc đúng khách hàng. |
| `issue_desc` | Có | String, 1-2000 ký tự | Không được để trống. |
| `category_id` | Có | Integer dương | Phải tồn tại và đang active trong `issue_category`. |
| `priority` | Có | Enum | Chỉ nhận `CAO`, `TRUNG_BINH`, `THAP`. |
| `center_id` | Có | Integer dương | Phải tồn tại; nhân viên chỉ được dùng trung tâm được phân quyền. |
| `is_warranty` | Có | Boolean | `true` hoặc `false`; nếu thiếu ngày mua phải cần quản lý phê duyệt. |
| `request_id` | Có | String, tối đa 100 ký tự | Duy nhất trong phạm vi request tạo phiếu; gửi lại không tạo trùng. |

### 4.3. Endpoint danh sách và chuyển trạng thái

| Endpoint | Trường | Bắt buộc | Kiểu/độ dài | Dải giá trị và quy tắc |
|---|---|---:|---|---|
| `GET /tickets` | `status` | Không | Enum | `MOI`, `DA_PHAN_CONG`, `DANG_XU_LY`, `CHO_LINH_KIEN`, `HOAN_TAT`, `DA_DONG`, `DA_HUY`. |
| `GET /tickets` | `due_before` | Không | ISO date | Ngày hợp lệ dạng `YYYY-MM-DD`. |
| `GET /tickets` | `page` | Không | Integer | Lớn hơn hoặc bằng 1; mặc định 1. |
| `GET /tickets` | `page_size` | Không | Integer | Từ 1 đến 100; mặc định 20. |
| `POST /transitions` | `to_status` | Có | Enum | Phải là trạng thái kế tiếp hợp lệ theo QT-06. |
| `POST /transitions` | `note` | Không | String, tối đa 255 ký tự | Ghi chú xử lý; không được vượt quá độ dài quy định. |

## 5. Bảng truy vết endpoint về User Story

| Endpoint | User Story | Use Case | MoSCoW | Yêu cầu liên quan |
|---|---|---|---|---|
| `GET /customers?phone=...` | US1 | UC1 | MUST | FR1 |
| `POST /customers` | US2 | UC2 | MUST | FR2 |
| `POST /tickets` | US3 | UC3 | MUST | FR3 |
| `POST /tickets` | US4 | UC4 | MUST | FR3, FR4 |
| `POST /tickets` | US5 | UC3, UC4 | MUST | FR4 |
| `GET /tickets/{ticket_id}` | US6 | UC5 | SHOULD | FR5 |
| `GET /tickets` | US6 | UC5 | SHOULD | FR5 |
| `POST /tickets/{ticket_id}/transitions` | US7 | UC6 | SHOULD | FR5 |

Mỗi endpoint đều truy vết được về ít nhất một User Story và Use Case trong SRS. Các endpoint `POST /tickets` phục vụ đồng thời US3, US4 và US5 vì việc tạo phiếu, lưu phân loại/mức ưu tiên và sinh hạn cam kết được thực hiện trong cùng một request nghiệp vụ.