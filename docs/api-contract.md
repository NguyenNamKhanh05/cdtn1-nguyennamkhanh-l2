# API Contract — Luồng L2

**Track:** Software Engineering (SE)
**Luồng:** L2 — Tiếp nhận và phân loại yêu cầu bảo hành
**Base URL:** `http://localhost:3000` (mọi endpoint có cả tiền tố `/api/v1`)
**Định dạng:** JSON, UTF-8

> Tài liệu này mô tả **hợp đồng đã hiện thực** trong `src/`. Nếu mã nguồn và tài liệu lệch nhau, mã nguồn là bản đúng và tài liệu phải sửa theo.

## 1. Quy ước chung

### 1.1. Định dạng response

Thành công:

```json
{ "data": { }, "meta": { "page": 1, "page_size": 20, "total": 3 } }
```

`meta` chỉ có ở endpoint danh sách.

Lỗi:

```json
{
  "error": {
    "code": "DU_LIEU_KHONG_HOP_LE",
    "message": "Du lieu vao khong hop le o cac truong: priority",
    "fields": [
      { "truong": "priority", "lyDo": "chi nhan CAO, TRUNG_BINH hoac THAP" }
    ]
  }
}
```

`fields` chỉ có khi lỗi liên quan tới từng trường dữ liệu.

### 1.2. Mã HTTP

| Mã | Khi nào |
|---:|---|
| 200 | Truy vấn/cập nhật thành công; hoặc `request_id` đã xử lý (trả phiếu cũ) |
| 201 | Tạo mới khách hàng, thiết bị hoặc phiếu |
| 204 | Xóa mềm khách hàng thành công |
| 400 | Dữ liệu sai định dạng, sai trạng thái, hoặc chuyển trạng thái không hợp lệ |
| 403 | Sai phạm vi trung tâm (QT-14) |
| 404 | Không tìm thấy khách hàng/thiết bị/phiếu/danh mục |
| 409 | Xung đột: số điện thoại trùng, serial trùng, thiết bị đang có phiếu mở, trạng thái đã đổi, cố xóa phiếu |
| 503 | `/health` khi mất kết nối CSDL |

### 1.3. Ngữ cảnh người dùng (QT-14, QT-15)

Chưa có module đăng nhập, nên vai trò đọc từ header. Khi có JWT chỉ cần thay `docNguCanh` trong `src/middleware/ngu-canh.js`.

| Header | Giá trị hợp lệ | Mặc định |
|---|---|---|
| `X-User-Role` | `nhan_vien`, `quan_ly`, `ban_giam_doc` | `nhan_vien` |
| `X-Center-Id` | số nguyên dương | không có |

Giá trị lạ được quy về `nhan_vien` — nguyên tắc "mặc định từ chối".

---

## 2. Endpoint bắt buộc (User Story MUST)

### 2.1. `GET /customers?phone=...` — US1

Tra cứu khách theo số điện thoại. QT-02 chuẩn hóa trước khi tra; QT-15 che số theo vai trò.

**Tham số:** `phone` (bắt buộc) — nhận `0901234567`, `090 123 4567`, `+84901234567`, `84901234567`.

**Response 200** (vai trò `nhan_vien`):

```json
{
  "data": {
    "customer_id": 1,
    "full_name": "Nguyen Van Binh",
    "phone": "090****567",
    "email": "binh@example.com",
    "address": "Can Tho",
    "is_active": true,
    "created_at": "2026-10-19T09:57:22.756Z"
  }
}
```

Cùng request với `X-User-Role: quan_ly` trả `"phone": "0901234567"`.

**Lỗi:**

| HTTP | code | Nguyên nhân |
|---:|---|---|
| 400 | `VALIDATION_ERROR` | Thiếu `phone` hoặc không chuẩn hóa được |
| 404 | `CUSTOMER_NOT_FOUND` | Số chưa có trong hệ thống |

### 2.2. `POST /customers` — US2

Tạo hồ sơ khách hàng mới. QT-01: số điện thoại duy nhất.

**Request:**

```json
{
  "full_name": "Pham Van Test",
  "phone": "+84911112222",
  "email": "test@example.com",
  "address": "Can Tho"
}
```

**Response 201:** `data` là hồ sơ vừa tạo, `phone` đã chuẩn hóa (và bị che nếu vai trò không đủ quyền).

**Lỗi:**

| HTTP | code | Nguyên nhân |
|---:|---|---|
| 400 | `VALIDATION_ERROR` | Thiếu họ tên, số sai định dạng, email sai |
| 409 | `PHONE_ALREADY_EXISTS` | Số đã tồn tại — giao diện nên mở hồ sơ cũ |

### 2.3. `POST /tickets` — US3, US4, US5

Tạo phiếu, lưu phân loại và mức ưu tiên, sinh hạn cam kết, ghi log trạng thái đầu tiên trong cùng transaction.

**Request tối thiểu** (dùng `device_id`):

```json
{
  "customer_id": 1,
  "device_id": 13,
  "center_id": 1,
  "category_id": 3,
  "issue_desc": "May tu tat nguon",
  "priority": "CAO"
}
```

**Request dùng `serial_no`** (QT-03 cho phép tra thiết bị bằng serial):

```json
{
  "customer_id": 1,
  "serial_no": "SN-90001",
  "center_id": 1,
  "category_id": 3,
  "issue_desc": "May tu tat nguon",
  "priority": "CAO"
}
```

**Trường tùy chọn:**

| Trường | Mặc định | Ghi chú |
|---|---|---|
| `request_type` | `BAO_HANH` | Nhận `BAO_HANH`, `DOI_TRA` |
| `request_id` | null | Khóa chống tạo trùng (NFR3); tối đa 100 ký tự |
| `is_warranty` | tự tính theo QT-05 | Chỉ nhận boolean thật |

**Response 201:**

```json
{
  "data": {
    "ticket_id": 4,
    "ticket_code": "BH-000004/2026",
    "customer_id": 1,
    "customer_name": "Nguyen Van Binh",
    "customer_phone": "090****567",
    "device_id": 13,
    "serial_no": "SN-90001",
    "purchase_date": "2026-09-01T00:00:00.000Z",
    "warranty_months": 12,
    "request_type": "BAO_HANH",
    "center_id": 1,
    "center_name": "TTBH Quan 10",
    "category_id": 3,
    "category_name": "SAC",
    "issue_desc": "May tu tat nguon",
    "priority": "CAO",
    "priority_label": "Cao",
    "status": "MOI",
    "status_label": "Mới tiếp nhận",
    "received_at": "2026-10-19T03:00:40.135Z",
    "due_date": "2026-10-20T03:00:40.135Z",
    "closed_at": null,
    "is_warranty": true,
    "warranty_status": "CON_BAO_HANH",
    "is_overdue": false
  }
}
```

Response đi qua `src/contracts/ticket.contract.js`. Các trường nội bộ như `request_id`, `is_active` **không** trả ra — chúng không thuộc hợp đồng với giao diện. `customer_phone` đã che theo QT-15; `warranty_status` giữ ba ý nghĩa của QT-05; `is_overdue` tính tại thời điểm phản hồi.

**Response 200 khi gửi lại cùng `request_id`:** cùng phiếu, thêm `"la_phieu_cu": true`. Cố ý trả 200 chứ không phải 409: đây là retry hợp lệ của client, không phải lỗi.

**Response 201 khi thiếu ngày mua (QT-05):** thêm hai cờ

```json
{
  "is_warranty": false,
  "canh_bao_bao_hanh": "CHUA_XAC_MINH_BAO_HANH",
  "can_quan_ly_phe_duyet": true
}
```

**Lỗi:**

| HTTP | code | Nguyên nhân |
|---:|---|---|
| 400 | `DU_LIEU_KHONG_HOP_LE` | Thiếu trường bắt buộc, `priority` sai, `serial_no` sai định dạng |
| 400 | `VALIDATION_ERROR` | `priority` sai nhưng lọt qua tầng service |
| 404 | `RESOURCE_NOT_FOUND` | Không thấy khách hàng, thiết bị, nhóm sự cố hoặc trung tâm |
| 409 | `PHIEU_DANG_MO` | Thiết bị đã có phiếu chưa đóng (QD-01) |
| 409 | `THIET_BI_KHONG_THUOC_KHACH` | Thiết bị thuộc khách khác (QT-03) |

### 2.4. Bảng kiểm tra từng trường của `POST /tickets`

| Trường | Bắt buộc | Kiểu | Quy tắc |
|---|---|---|---|
| `customer_id` | Có | Integer dương | Phải tồn tại và `is_active = true` |
| `device_id` | Một trong hai | Integer dương | Phải tồn tại và thuộc đúng `customer_id` |
| `serial_no` | Một trong hai | String 6–50 | Chữ, số, gạch ngang |
| `center_id` | Có | Integer dương | Phải tồn tại |
| `category_id` | Có | Integer dương | Phải tồn tại và đang active |
| `issue_desc` | Có | String 1–2000 | Không được rỗng sau khi trim |
| `priority` | Có | Enum | `CAO`, `TRUNG_BINH`, `THAP` |
| `request_type` | Không | Enum | `BAO_HANH`, `DOI_TRA` |
| `request_id` | Không | String ≤ 100 | Duy nhất; gửi lại trả phiếu cũ |
| `is_warranty` | Không | Boolean | Ghi đè kết quả QT-05 (dùng khi quản lý phê duyệt) |

---

## 3. Endpoint hỗ trợ (SHOULD)

### 3.1. `GET /tickets` — US6

**Tham số:**

| Tên | Mặc định | Quy tắc |
|---|---|---|
| `status` | không lọc | Một trong 7 trạng thái |
| `due_before` | không lọc | `YYYY-MM-DD`, lấy phiếu hạn trước hết ngày đó |
| `center_id` | không lọc | Số nguyên dương; nhân viên chỉ được dùng trung tâm của mình |
| `page` | 1 | Số nguyên ≥ 1 |
| `page_size` | 20 | Số nguyên 1–100 |

**Response 200:** `data` là mảng phiếu sắp theo `due_date` tăng dần, `meta.total` là tổng số dòng khớp điều kiện (không phải số dòng của trang).

```json
{
  "data": [
    {
      "ticket_id": 1,
      "ticket_code": "BH-000001/2026",
      "customer_id": 1,
      "customer_name": "Nguyen Van Binh",
      "customer_phone": "090****567",
      "device_id": 10,
      "serial_no": "SN-10293",
      "purchase_date": "2026-03-01T00:00:00.000Z",
      "warranty_months": 12,
      "request_type": "BAO_HANH",
      "center_id": 1,
      "center_name": "TTBH Quan 10",
      "category_id": 3,
      "category_name": "SAC",
      "issue_desc": "May khong sac duoc",
      "priority": "CAO",
      "priority_label": "Cao",
      "status": "MOI",
      "status_label": "Mới tiếp nhận",
      "received_at": "2026-10-19T07:57:22.756Z",
      "due_date": "2026-10-20T07:57:22.756Z",
      "closed_at": null,
      "is_warranty": true,
      "warranty_status": "CON_BAO_HANH",
      "is_overdue": false
    }
  ],
  "meta": { "page": 1, "page_size": 20, "total": 3 }
}
```

**Lỗi:** `400 DU_LIEU_KHONG_HOP_LE` (tham số sai), `403 FORBIDDEN` (nhân viên hỏi trung tâm khác).

QT-14: khi request có `X-User-Role: nhan_vien` và `X-Center-Id`, hệ thống **tự thêm** điều kiện `center_id`; nếu client yêu cầu trung tâm khác thì trả 403 thay vì âm thầm trả danh sách rỗng.

### 3.2. `GET /tickets/:ticketId` — US6

Trả chi tiết phiếu theo hợp đồng ở trên, cộng thêm:

| Trường | Ý nghĩa |
|---|---|
| `lich_su` | Mảng log trạng thái cũ nhất trước, mỗi dòng có `from_label`, `to_label` |
| `chuyen_tiep_duoc_phep` | `[{status, label}]` — các bước kế tiếp theo QT-06 |
| `warranty_status` | `CON_BAO_HANH` / `HET_BAO_HANH` / `CHUA_XAC_MINH` (QT-05) |
| `is_overdue` | Quá hạn cam kết và phiếu còn mở |

QT-14: nhân viên khác trung tâm nhận 403; `ban_giam_doc` xem mọi trung tâm. Response gộp lịch sử để màn hình chi tiết chỉ cần một request.

**Lỗi:** `404 RESOURCE_NOT_FOUND`, `403 FORBIDDEN`.

### 3.3. `POST /tickets/:ticketId/transitions` — US7

**Request:**

```json
{ "to_status": "DA_PHAN_CONG", "note": "Da tiep nhan" }
```

Trường tùy chọn `expected_status`: nếu gửi, hệ thống kiểm tra trạng thái hiện tại vẫn đúng như client thấy (chống ghi đè khi hai người cùng thao tác).

**Response 200:**

```json
{
  "data": {
    "ticket_id": 1,
    "from_status": "MOI",
    "to_status": "DA_PHAN_CONG",
    "changed_at": "2026-10-19T09:58:41.062Z",
    "changed_by": 1
  }
}
```

**Lỗi:**

| HTTP | code | Nguyên nhân |
|---:|---|---|
| 400 | `INVALID_TRANSITION` | Bước chuyển không có trong QT-06 |
| 400 | `DU_LIEU_KHONG_HOP_LE` | `to_status` không thuộc danh sách, `note` > 255 ký tự |
| 404 | `RESOURCE_NOT_FOUND` | Không có phiếu |
| 409 | `TRANG_THAI_DA_THAY_DOI` | `expected_status` lệch với CSDL |

Vòng đời hợp lệ (QT-06):

```
MOI ──> DA_PHAN_CONG ──> DANG_XU_LY ──> CHO_LINH_KIEN ──> DANG_XU_LY ...
                              │                │
                              ├──> HOAN_TAT <──┘
                              │        │
                              └──> DA_HUY      └──> DA_DONG
```

Bảng chuyển đổi đầy đủ nằm ở `src/domain/ticket-status.js` — đó là nguồn duy nhất, không chép lại vào tài liệu để tránh lệch.

### 3.4. `GET /tickets/:ticketId/history` — US7

Trả mảng log trạng thái, cũ nhất trước:

```json
{
  "data": [
    {
      "log_id": 2,
      "ticket_id": 1,
      "from_status": null,
      "to_status": "MOI",
      "changed_at": "2026-10-19T07:57:22.756Z",
      "changed_by": 1,
      "note": "Tiep nhan phieu moi"
    }
  ]
}
```

### 3.5. `PUT /tickets/:ticketId`

Cập nhật `issue_desc`, `category_id`, `priority`, `due_date`, `center_id`. **Không** đổi được `status` — mọi thay đổi trạng thái phải đi qua `/transitions` để ghi log (QT-06).

### 3.6. `DELETE /tickets/:ticketId` — QT-13

Luôn trả `409 KHONG_DUOC_XOA_PHIEU`. Endpoint tồn tại để thông báo rõ ràng; cách đúng để kết thúc phiếu là chuyển sang `DA_HUY`.

### 3.7. Khách hàng: `GET/PUT/DELETE /customers/:customerId`

- `GET`: 404 nếu không có hoặc đã ngừng sử dụng; số điện thoại che theo QT-15.
- `PUT`: cập nhật một phần; QT-01 vẫn kiểm tra trùng số.
- `DELETE`: xóa mềm (QT-13), trả 204, bản ghi vẫn còn với `is_active = false`.

**`GET /customers/:customerId/devices`** — thiết bị đang hoạt động của khách, dùng cho màn hình tiếp nhận.

- `data` là mảng thiết bị; mảng rỗng là trạng thái **rỗng hợp lệ** (khách chưa có thiết bị), không phải lỗi.
- 404 `CUSTOMER_NOT_FOUND` nếu khách không tồn tại hoặc đã ngừng sử dụng.

### 3.8. Thiết bị

**`POST /devices`** — ghi nhận thiết bị trước khi lập phiếu (UC3).

```json
{
  "customer_id": 1,
  "serial_no": "SN-90001",
  "purchase_date": "2026-09-01",
  "warranty_months": 12
}
```

`purchase_date` tùy chọn; bỏ trống thì QT-05 coi là "chưa xác minh". `warranty_months` mặc định 12.

| HTTP | code | Nguyên nhân |
|---:|---|---|
| 201 | — | Tạo thành công |
| 400 | `DU_LIEU_KHONG_HOP_LE` | Serial sai định dạng, ngày sai, số tháng ≤ 0 |
| 404 | `RESOURCE_NOT_FOUND` | Không có khách hàng |
| 409 | `SERIAL_ALREADY_EXISTS` | Serial/IMEI đã thuộc thiết bị khác (QT-03) |

**`GET /devices/:deviceId`** — xem thiết bị, 404 nếu không có.

### 3.9. Danh mục

| Endpoint | Nội dung |
|---|---|
| `GET /issue-categories` | 6 nhóm sự cố đang active |
| `GET /service-centers` | 6 trung tâm |
| `GET /technicians` | Kỹ thuật viên đang active kèm `center_name` |

Danh mục đọc từ CSDL chứ không hard-code trong mã (NFR4).

### 3.10. `GET /health`

```json
{ "status": "ok", "database": "postgresql", "connected": true }
```

`database` là `postgresql`, `memory` hoặc `custom`. Trả 503 nếu không truy vấn được CSDL.

---

## 4. Bảng truy vết endpoint về User Story

| Endpoint | User Story | Use Case | MoSCoW | Yêu cầu |
|---|---|---|---|---|
| `GET /customers?phone=...` | US1 | UC1 | MUST | FR1, QT-01, QT-02, QT-15 |
| `GET /customers/{id}/devices` | US3 | UC3 | MUST | FR3, QT-03 |
| `POST /customers` | US2 | UC2 | MUST | FR2, QT-01 |
| `POST /tickets` | US3, US4, US5 | UC3, UC4 | MUST | FR3, FR4, QT-03, QT-04, QT-05 |
| `GET /tickets` | US6 | UC5 | SHOULD | FR5, QT-14 |
| `GET /tickets/{id}` | US6 | UC5 | SHOULD | FR5, QT-14 |
| `POST /tickets/{id}/transitions` | US7 | UC6 | SHOULD | FR5, QT-06 |
| `GET /tickets/{id}/history` | US7 | UC6 | SHOULD | FR5, QT-06 |
| `DELETE /tickets/{id}` | — | — | — | QT-13 (luôn từ chối) |
| `POST /devices` | US3 | UC3 | MUST | FR3, QT-03 |
| `GET /issue-categories` | US4 | UC4 | MUST | FR4, NFR4 |
| `GET /service-centers` | US3 | UC3 | MUST | FR3 |
| `GET /technicians` | — | — | — | Dữ liệu tham chiếu cho L4 |
