# Wireframe - 3 màn hình chính L2

## Màn hình 1 - Danh sách phiếu (UC5)

```text
+----------------------------------------------------------------+
| DANH SACH PHIEU BAO HANH                                      |
| Trang thai [Tat ca v]  Han cam ket truoc [dd/mm/yyyy] [Loc]   |
+----------------------------------------------------------------+
| Ma phieu | Khach hang | Nhom su co | Uu tien | Trang thai | SLA|
| BH-0001  | Nguyen A   | SAC        | CAO     | MOI        | 2h |
| BH-0002  | Tran B     | PIN        | TB      | DANG_XU_LY | 1d |
+----------------------------------------------------------------+
| [Tao phieu moi]                                  Trang 1 / 20 |
+----------------------------------------------------------------+
```

## Màn hình 2 - Tạo phiếu (UC1, UC2, UC3, UC4)

```text
+----------------------------------------------------------------+
| TAO PHIEU BAO HANH                                             |
| So dien thoai [________________] [Tra cuu]                     |
| Ho ten [____________________]  Dia chi [___________________]  |
| Thiet bi / Serial [____________________________]               |
| Ngay mua [__/__/____]  Trung tam [____________ v]              |
| Mo ta loi [_______________________________________________]    |
| Nhom su co [____________ v]  Muc uu tien [___________ v]       |
| Han cam ket [tu dong sinh]                                     |
|                         [Huy] [Luu phieu]                      |
+----------------------------------------------------------------+
```

## Màn hình 3 - Chi tiết phiếu (UC3, UC6)

```text
+----------------------------------------------------------------+
| CHI TIET PHIEU BH-000123/2026                 [Cap nhat]       |
| Khach hang | So dien thoai che | Thiet bi | Trung tam          |
| Nhom su co | Uu tien | Han cam ket | Trang thai                |
+----------------------------------------------------------------+
| Mo ta loi                                                        |
| May khong sac duoc                                             |
+----------------------------------------------------------------+
| LICH SU TRANG THAI                                             |
| Thoi diem           Tu trang thai -> Den trang thai | Nguoi   |
| 28/09 10:00         (trong) -> MOI                 | NV01    |
| 28/09 11:30         MOI -> DA_PHAN_CONG            | QL02    |
+----------------------------------------------------------------+
| Chuyen trang thai [________ v] Ghi chu [____________] [Luu]    |
+----------------------------------------------------------------+
```

Mọi trường trong ba màn hình đều có trong mô hình dữ liệu hoặc là giá trị dẫn xuất từ `ticket_status_log`; tên gọi thống nhất với bảng thuật ngữ trong SRS.
