# Hướng dẫn kiểm thử bằng Postman

Tài liệu này liệt kê **đúng từng request** cần bấm trong Postman để chứng minh module L2 hoạt động, kèm mã HTTP và body mong đợi. Ảnh chụp màn hình lưu vào `docs/export/` theo tên ghi trong từng mục.

---

## 0. Chuẩn bị (làm một lần)

### 0.1. Bật hệ thống

Mở **hai** cửa sổ terminal tại thư mục dự án.

**Terminal 1 — CSDL và dữ liệu:**

```bash
npm run setup
```

Chờ tới khi thấy:

```
PostgreSQL san sang (localhost:5434/mekong_mobile).
Da chay migrations/001_create_core.sql
Da chay migrations/002_add_request_id.sql
Da chay migrations/003_add_catalog.sql
Da nap du lieu danh muc: {"service_center":6,"issue_category":6,"technician":38,"technician_skill":159}
Da chay seeds/001_seed_demo.sql
```

**Terminal 2 — API:**

```bash
npm start
```

```
API dang chay tai http://localhost:3000
Kiem tra suc khoe: http://localhost:3000/health
Kieu kho du lieu: postgresql
```

> Nếu máy không có Docker: chạy `$env:CHE_DO_DU_LIEU="memory"; npm start` (PowerShell) hoặc `CHE_DO_DU_LIEU=memory npm start` (macOS/Linux). Khi đó `GET /health` trả `"database": "memory"` — vẫn chụp ảnh được cho mọi mục dưới đây, riêng `GET /technicians` trả mảng rỗng.

### 0.2. Tạo Collection

1. Mở Postman → **Collections** → **+** → đặt tên `CDTN1 - L2 - Nguyen Nam Khanh`.
2. Chuột phải collection → **Edit** → tab **Variables** → thêm:

| Variable | Initial value | Current value |
|---|---|---|
| `baseUrl` | `http://localhost:3000` | `http://localhost:3000` |

3. Bấm **Save**. Từ giờ mọi URL viết `{{baseUrl}}/tickets`.

> Vì sao dùng biến: khi chụp ảnh, URL hiển thị gọn và người chấm đổi cổng được mà không phải sửa từng request.

---

## 1. `GET /health` — kiểm tra hệ thống

**Ảnh:** `docs/export/postman-01-health.png`

| | |
|---|---|
| Method | `GET` |
| URL | `{{baseUrl}}/health` |
| Headers | không cần |
| Body | không có |

Bấm **Send**. Mong đợi:

- Status: **200 OK**
- Body:

```json
{
  "status": "ok",
  "database": "postgresql",
  "connected": true
}
```

**Cần thấy trong ảnh:** status 200 và `"connected": true`. Đây là bằng chứng API nối được PostgreSQL thật, không phải dữ liệu giả trong mã.

---

## 2. `GET /tickets` — danh sách phiếu (US6)

**Ảnh:** `docs/export/postman-02-danh-sach-phieu.png`

| | |
|---|---|
| Method | `GET` |
| URL | `{{baseUrl}}/tickets` |
| Headers | không cần |
| Body | không có |

Mong đợi:

- Status: **200 OK**
- `data` có **3 phần tử** với `ticket_code` là `BH-000001/2026`, `BH-000002/2026`, `BH-000003/2026`.
- `meta`:

```json
{ "page": 1, "page_size": 20, "total": 3 }
```

- Thứ tự sắp theo `due_date` tăng dần (phiếu gấp nhất lên đầu).

**Cần thấy trong ảnh:** đủ 3 mã phiếu và `"total": 3`.

---

## 3. `GET /tickets?status=MOI` — lọc theo trạng thái

**Ảnh:** `docs/export/postman-03-loc-trang-thai.png`

| | |
|---|---|
| Method | `GET` |
| URL | `{{baseUrl}}/tickets?status=MOI` |
| Query params | `status` = `MOI` |

Mong đợi: **200**, `data` chỉ chứa phiếu có `"status": "MOI"`, `meta.total` = 2.

> Đây là chỗ chứng minh bộ lọc chạy ở SQL (`WHERE t.status = $1`) chứ không lọc bằng JavaScript sau khi tải hết bảng.

---

## 4. `GET /customers?phone=...` — tra cứu khách (US1, QT-02, QT-15)

### 4.1. Vai trò nhân viên (số bị che)

**Ảnh:** `docs/export/postman-04-khach-hang-che-so.png`

| | |
|---|---|
| Method | `GET` |
| URL | `{{baseUrl}}/customers?phone=0901234567` |
| Headers | `X-User-Role: nhan_vien` |
| Body | không có |

Mong đợi: **200**

```json
{
  "data": {
    "customer_id": 1,
    "full_name": "Nguyen Van Binh",
    "phone": "090****567",
    "email": "binh@example.com",
    "address": "Can Tho"
  }
}
```

**Cần thấy trong ảnh:** `"phone": "090****567"` — 4 số giữa đã bị che theo QT-15.

### 4.2. Vai trò quản lý (số đầy đủ)

**Ảnh:** `docs/export/postman-05-khach-hang-quan-ly.png`

| | |
|---|---|
| Method | `GET` |
| URL | `{{baseUrl}}/customers?phone=0901234567` |
| Headers | `X-User-Role: quan_ly` |

Mong đợi: **200** với `"phone": "0901234567"`.

### 4.3. Nhập số có khoảng trắng (QT-02)

**Ảnh:** `docs/export/postman-06-chuan-hoa-so.png`

| | |
|---|---|
| Method | `GET` |
| URL | `{{baseUrl}}/customers?phone=090 123 4567` |

Postman tự mã hóa khoảng trắng thành `%20`, không cần sửa tay.

Mong đợi: **200**, vẫn tìm ra khách `Nguyen Van Binh` — chứng minh chuẩn hóa trước khi tra. Thử thêm `+84901234567` (Postman tự đổi `+` thành `%2B`) cũng cho cùng kết quả.

---

## 5. `POST /tickets` với dữ liệu sai → 400

**Ảnh:** `docs/export/postman-07-du-lieu-sai-400.png`

| | |
|---|---|
| Method | `POST` |
| URL | `{{baseUrl}}/tickets` |
| Headers | `Content-Type: application/json` |
| Body | raw → JSON |

```json
{
  "serialNo": ""
}
```

Mong đợi:

- Status: **400 Bad Request**
- Body:

```json
{
  "error": {
    "code": "DU_LIEU_KHONG_HOP_LE",
    "message": "Du lieu vao khong hop le o cac truong: customer_id, center_id, category_id, device_id, issue_desc, priority",
    "fields": [
      { "truong": "customer_id", "lyDo": "phai la so nguyen duong" },
      { "truong": "center_id", "lyDo": "phai la so nguyen duong" },
      { "truong": "category_id", "lyDo": "phai la so nguyen duong" },
      { "truong": "device_id", "lyDo": "bat buoc device_id hoac serial_no" },
      { "truong": "issue_desc", "lyDo": "bat buoc, khong duoc rong" },
      { "truong": "priority", "lyDo": "chi nhan CAO, TRUNG_BINH hoac THAP" }
    ]
  }
}
```

**Cần thấy trong ảnh:** status **400** và mã lỗi `DU_LIEU_KHONG_HOP_LE`. Đây là một trong hai ảnh bắt buộc của bài.

> Vì sao dùng `serialNo` (camelCase): validator chấp nhận cả camelCase và snake_case để không phá client cũ. Dùng đúng chuỗi này cũng chứng minh dữ liệu rỗng bị chặn chứ không lọt xuống CSDL.

---

## 6. `POST /devices` + `POST /tickets` — luồng đúng (US3, US4, US5)

### 6.1. Ghi nhận thiết bị mới

**Ảnh:** `docs/export/postman-08-tao-thiet-bi.png`

| | |
|---|---|
| Method | `POST` |
| URL | `{{baseUrl}}/devices` |
| Body | raw → JSON |

```json
{
  "customer_id": 1,
  "serial_no": "SN-90001",
  "purchase_date": "2026-09-01",
  "warranty_months": 12
}
```

Mong đợi: **201 Created**

```json
{
  "data": {
    "device_id": 13,
    "customer_id": 1,
    "serial_no": "SN-90001",
    "purchase_date": "2026-09-01",
    "warranty_months": 12
  }
}
```

Ghi lại `device_id` (ở đây là **13**, nhưng máy khác có thể khác) để dùng cho bước sau.

> Chạy lại request này sẽ nhận **409** `SERIAL_ALREADY_EXISTS` — đó là QT-03 hoạt động đúng. Nếu muốn chụp ảnh 409, đây là chỗ phù hợp.

### 6.2. Tạo phiếu cho thiết bị đó

**Ảnh:** `docs/export/postman-09-tao-phieu-201.png`

| | |
|---|---|
| Method | `POST` |
| URL | `{{baseUrl}}/tickets` |
| Body | raw → JSON |

```json
{
  "customer_id": 1,
  "device_id": 13,
  "center_id": 1,
  "category_id": 3,
  "issue_desc": "May tu tat nguon",
  "priority": "CAO",
  "request_id": "postman-001"
}
```

Mong đợi: **201 Created**

```json
{
  "data": {
    "ticket_id": 4,
    "ticket_code": "BH-000004/2026",
    "customer_id": 1,
    "device_id": 13,
    "center_id": 1,
    "request_type": "BAO_HANH",
    "issue_desc": "May tu tat nguon",
    "category_id": 3,
    "priority": "CAO",
    "status": "MOI",
    "received_at": "2026-10-19T03:00:40.135Z",
    "due_date": "2026-10-20T03:00:40.135Z",
    "closed_at": null,
    "is_warranty": true,
    "is_active": true,
    "request_id": "postman-001"
  }
}
```

**Cần kiểm tra trong ảnh:**

- `"status": "MOI"` — phiếu mới luôn bắt đầu ở trạng thái này.
- `"ticket_code"` đúng dạng `BH-000004/2026`.
- `due_date` cách `received_at` **đúng 24 giờ** (QT-04, mức CAO).
- `"is_warranty": true` — ngày mua 01/09/2026 còn trong 12 tháng (QT-05).

### 6.3. Gửi lại cùng `request_id` (NFR3)

**Ảnh:** `docs/export/postman-10-idempotent-200.png`

Bấm **Send** lại y nguyên request 6.2.

Mong đợi: **200 OK** (không phải 201), cùng `ticket_id`, thêm:

```json
"la_phieu_cu": true
```

**Cần thấy trong ảnh:** status **200** và `"la_phieu_cu": true`. Chứng minh client mất mạng rồi gửi lại không tạo phiếu thứ hai.

---

## 7. `POST /tickets/:id/transitions` — chuyển trạng thái (QT-06)

### 7.1. Chuyển hợp lệ

**Ảnh:** `docs/export/postman-11-chuyen-trang-thai.png`

| | |
|---|---|
| Method | `POST` |
| URL | `{{baseUrl}}/tickets/1/transitions` |
| Body | raw → JSON |

```json
{
  "to_status": "DA_PHAN_CONG",
  "note": "Da tiep nhan va phan cong"
}
```

Mong đợi: **200**

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

> Nếu phiếu 1 đã được chuyển trước đó, dùng phiếu khác còn `MOI` (xem `GET /tickets?status=MOI`) hoặc chạy `npm run db:reset && npm run setup` để đưa về dữ liệu gốc.

### 7.2. Chuyển không hợp lệ → 400

**Ảnh:** `docs/export/postman-12-chuyen-sai-400.png`

Bấm **Send** lại đúng request trên.

Mong đợi: **400**

```json
{
  "error": {
    "code": "INVALID_TRANSITION",
    "message": "Khong the chuyen tu DA_PHAN_CONG sang DA_PHAN_CONG."
  }
}
```

**Cần thấy trong ảnh:** status **400** và `INVALID_TRANSITION`. Đây là ảnh thứ hai bắt buộc.

### 7.3. Lịch sử trạng thái

**Ảnh:** `docs/export/postman-13-lich-su.png`

| | |
|---|---|
| Method | `GET` |
| URL | `{{baseUrl}}/tickets/1/history` |

Mong đợi: **200**, `data` có 2 dòng:

1. `from_status: null` → `to_status: "MOI"`, note "Tiep nhan phieu moi"
2. `from_status: "MOI"` → `to_status: "DA_PHAN_CONG"`

Chứng minh mọi lần chuyển đều được ghi log (QT-06), kể cả lần đầu khi tạo phiếu.

---

## 8. QT-14 — giới hạn theo trung tâm

**Ảnh:** `docs/export/postman-14-phan-quyen-trung-tam.png`

| | |
|---|---|
| Method | `GET` |
| URL | `{{baseUrl}}/tickets/3` |
| Headers | `X-User-Role: nhan_vien`, `X-Center-Id: 1` |

Phiếu 3 thuộc trung tâm 2, người xem thuộc trung tâm 1.

Mong đợi: **403**

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Ban khong thuoc trung tam cua phieu nay."
  }
}
```

Đổi header thành `X-User-Role: ban_giam_doc` và bỏ `X-Center-Id`, gửi lại: **200** kèm dữ liệu phiếu 3.

---

## 9. QT-13 — không xóa vật lý

**Ảnh:** `docs/export/postman-15-khong-duoc-xoa.png`

| | |
|---|---|
| Method | `DELETE` |
| URL | `{{baseUrl}}/tickets/1` |
| Body | none |

Mong đợi: **409**

```json
{
  "error": {
    "code": "KHONG_DUOC_XOA_PHIEU",
    "message": "Khong duoc xoa vat ly phieu; hay chuyen sang DA_HUY."
  }
}
```

---

## 10. Danh mục (NFR4)

**Ảnh:** `docs/export/postman-16-danh-muc.png`

Gửi lần lượt ba request `GET`:

| URL | Mong đợi |
|---|---|
| `{{baseUrl}}/issue-categories` | 200, 6 nhóm sự cố |
| `{{baseUrl}}/service-centers` | 200, 6 trung tâm |
| `{{baseUrl}}/technicians` | 200, danh sách kỹ thuật viên kèm `center_name` |

Chụp chung một ảnh cả ba (Postman hiển thị từng tab, có thể chụp riêng từng cái).

---

## 11. Checklist ảnh cần nộp

| # | Tên file | Nội dung | Bắt buộc |
|---:|---|---|:---:|
| 1 | `postman-01-health.png` | 200, `connected: true` | ✔ |
| 2 | `postman-02-danh-sach-phieu.png` | 3 phiếu, `total: 3` | ✔ |
| 3 | `postman-03-loc-trang-thai.png` | Lọc `status=MOI` | |
| 4 | `postman-04-khach-hang-che-so.png` | `090****567` | ✔ |
| 5 | `postman-05-khach-hang-quan-ly.png` | Số đầy đủ | ✔ |
| 6 | `postman-06-chuan-hoa-so.png` | Nhập `090 123 4567` vẫn tìm ra | |
| 7 | `postman-07-du-lieu-sai-400.png` | 400 `DU_LIEU_KHONG_HOP_LE` | ✔ |
| 8 | `postman-08-tao-thiet-bi.png` | 201 | |
| 9 | `postman-09-tao-phieu-201.png` | 201, `due_date` +24h | ✔ |
| 10 | `postman-10-idempotent-200.png` | 200, `la_phieu_cu` | ✔ |
| 11 | `postman-11-chuyen-trang-thai.png` | 200, `from_status`/`to_status` | ✔ |
| 12 | `postman-12-chuyen-sai-400.png` | 400 `INVALID_TRANSITION` | ✔ |
| 13 | `postman-13-lich-su.png` | 2 dòng log | ✔ |
| 14 | `postman-14-phan-quyen-trung-tam.png` | 403 | ✔ |
| 15 | `postman-15-khong-duoc-xoa.png` | 409 `KHONG_DUOC_XOA_PHIEU` | |
| 16 | `postman-16-danh-muc.png` | 3 danh mục | |

**Cách chụp:** trên Windows dùng `Win + Shift + S`, chọn vùng có cả **method + URL + status + body**, lưu vào `docs/export/` với đúng tên trên. Ảnh phải nhìn rõ mã HTTP — đừng chỉ chụp phần body.

---

## 12. Bản curl tương đương

Dùng khi không muốn mở Postman, hoặc để đối chiếu kết quả.

> **Lưu ý PowerShell:** đừng truyền JSON trực tiếp trong dấu nháy kép, PowerShell sẽ làm hỏng dấu `"`. Ghi body ra file rồi dùng `--data-binary "@body.json"`.

```bash
# 1. Health
curl.exe -s http://localhost:3000/health

# 2. Danh sách phiếu
curl.exe -s http://localhost:3000/tickets

# 3. Tra cứu khách (bị che số)
curl.exe -s "http://localhost:3000/customers?phone=0901234567"

# 4. Tra cứu với quyền quản lý (số đầy đủ)
curl.exe -s "http://localhost:3000/customers?phone=0901234567" -H "X-User-Role: quan_ly"

# 5. Dữ liệu sai -> 400
'{"serialNo":""}' | Out-File -Encoding utf8 body.json
curl.exe -s -w "`nHTTP %{http_code}`n" -X POST http://localhost:3000/tickets ^
  -H "Content-Type: application/json" --data-binary "@body.json"

# 6. Chuyển trạng thái
'{"to_status":"DA_PHAN_CONG","note":"Da tiep nhan"}' | Out-File -Encoding utf8 body.json
curl.exe -s -w "`nHTTP %{http_code}`n" -X POST http://localhost:3000/tickets/1/transitions ^
  -H "Content-Type: application/json" --data-binary "@body.json"
```

Trên macOS/Linux, thay `curl.exe` bằng `curl` và dùng `echo '...' > body.json`.

Hoặc chạy toàn bộ 14 kịch bản một lượt:

```bash
npm run demo
```

---

## 13. Nếu kết quả không như mong đợi

| Hiện tượng | Kiểm tra |
|---|---|
| `ECONNREFUSED` | Terminal 2 đã chạy `npm start` chưa? |
| `"database": "memory"` | Đang chạy chế độ bộ nhớ; bỏ biến `CHE_DO_DU_LIEU` để dùng PostgreSQL |
| `RESOURCE_NOT_FOUND` khi tạo phiếu | `device_id` có tồn tại và thuộc đúng `customer_id`? |
| `PHIEU_DANG_MO` | Thiết bị đã có phiếu chưa đóng; dùng thiết bị khác hoặc reset dữ liệu |
| `INVALID_TRANSITION` ngay lần đầu | Phiếu đã được chuyển trước đó; xem `GET /tickets/:id/history` |
| Số phiếu không phải 3 | Đã tạo thêm phiếu trong lúc thử; chạy `npm run db:reset && npm run setup` |
