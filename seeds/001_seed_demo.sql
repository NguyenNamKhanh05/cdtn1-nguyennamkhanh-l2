-- Du lieu mau L2. Chay lai nhieu lan khong nhan doi (ON CONFLICT).
-- Muc tieu: sau khi seed, GET /tickets tra ve dung 3 phieu de demo.

INSERT INTO service_center (center_id, center_code, center_name, city) VALUES
  (1, 'TT01', 'TTBH Quan 10', 'TP. Ho Chi Minh'),
  (2, 'TT02', 'TTBH Quan Tan Binh', 'TP. Ho Chi Minh'),
  (3, 'TT03', 'TTBH TP. Thu Duc', 'TP. Ho Chi Minh'),
  (4, 'TT04', 'TTBH Ninh Kieu', 'Can Tho'),
  (5, 'TT05', 'TTBH Cai Rang', 'Can Tho'),
  (6, 'TT06', 'TTBH Cau Giay', 'Ha Noi')
ON CONFLICT (center_id) DO UPDATE
  SET center_code = EXCLUDED.center_code,
      center_name = EXCLUDED.center_name,
      city = EXCLUDED.city;

INSERT INTO issue_category (category_id, category_name, default_priority) VALUES
  (1, 'MAN_HINH', 'CAO'),
  (2, 'PIN', 'TRUNG_BINH'),
  (3, 'SAC', 'TRUNG_BINH'),
  (4, 'PHAN_MEM', 'THAP'),
  (5, 'NUOC_VAO', 'CAO'),
  (6, 'KHAC', 'TRUNG_BINH')
ON CONFLICT (category_id) DO UPDATE
  SET category_name = EXCLUDED.category_name,
      default_priority = EXCLUDED.default_priority;

INSERT INTO customer (customer_id, full_name, phone, email, address) VALUES
  (1, 'Nguyen Van Binh', '0901234567', 'binh@example.com', 'Can Tho'),
  (2, 'Tran Thi Lan', '0912345678', 'lan@example.com', 'Can Tho'),
  (3, 'Le Minh Khoa', '0987654321', 'khoa@example.com', 'Ha Noi')
ON CONFLICT (customer_id) DO UPDATE
  SET full_name = EXCLUDED.full_name,
      phone = EXCLUDED.phone,
      email = EXCLUDED.email,
      address = EXCLUDED.address;

INSERT INTO device (device_id, customer_id, serial_no, purchase_date, warranty_months) VALUES
  (10, 1, 'SN-10293', DATE '2026-03-01', 12),
  (11, 2, 'SN-20481', DATE '2026-01-15', 12),
  (12, 3, 'SN-30755', DATE '2025-11-20', 12)
ON CONFLICT (device_id) DO UPDATE
  SET customer_id = EXCLUDED.customer_id,
      serial_no = EXCLUDED.serial_no,
      purchase_date = EXCLUDED.purchase_date,
      warranty_months = EXCLUDED.warranty_months;

INSERT INTO ticket (
  ticket_id, ticket_code, customer_id, device_id, center_id, request_type,
  issue_desc, category_id, priority, status, received_at, due_date, is_warranty, request_id
) VALUES
  (1, 'BH-000001/2026', 1, 10, 1, 'BAO_HANH', 'May khong sac duoc', 3, 'CAO', 'MOI',
   now() - interval '2 hours', now() + interval '22 hours', true, 'seed-req-0001'),
  (2, 'BH-000002/2026', 2, 11, 1, 'BAO_HANH', 'Man hinh bi soc', 1, 'TRUNG_BINH', 'DANG_XU_LY',
   now() - interval '1 day', now() + interval '2 days', true, 'seed-req-0002'),
  (3, 'BH-000003/2026', 3, 12, 2, 'BAO_HANH', 'Pin tut nhanh', 2, 'THAP', 'MOI',
   now() - interval '3 hours', now() + interval '117 hours', true, 'seed-req-0003')
ON CONFLICT (ticket_id) DO UPDATE
  SET ticket_code = EXCLUDED.ticket_code,
      customer_id = EXCLUDED.customer_id,
      device_id = EXCLUDED.device_id,
      center_id = EXCLUDED.center_id,
      issue_desc = EXCLUDED.issue_desc,
      category_id = EXCLUDED.category_id,
      priority = EXCLUDED.priority,
      status = EXCLUDED.status,
      received_at = EXCLUDED.received_at,
      due_date = EXCLUDED.due_date,
      is_warranty = EXCLUDED.is_warranty,
      request_id = EXCLUDED.request_id;

-- Lich su trang thai dau tien cho moi phieu, chi them neu chua co.
INSERT INTO ticket_status_log (ticket_id, from_status, to_status, changed_at, changed_by, note)
SELECT t.ticket_id, NULL, 'MOI', t.received_at, 1, 'Tiep nhan phieu moi'
FROM ticket t
WHERE t.ticket_id IN (1, 2, 3)
  AND NOT EXISTS (
    SELECT 1 FROM ticket_status_log log WHERE log.ticket_id = t.ticket_id
  );

-- Dua TAT CA sequence vuot qua du lieu seed.
-- Vi sao bat buoc: cac INSERT tren ghi ID thu cong (1, 2, 3, 10, 11, 12) nen
-- sequence khong tu tang. Neu khong setval, phieu/khach/thiet bi tao moi qua API
-- se nhan nextval = 1 va vi pham khoa chinh -> loi 500 ngay lan dau su dung.
-- Dung GREATEST(..., 1) de bang rong van co nextval hop le.
SELECT setval(
  pg_get_serial_sequence('customer', 'customer_id'),
  GREATEST((SELECT COALESCE(max(customer_id), 1) FROM customer), 1),
  true
);
SELECT setval(
  pg_get_serial_sequence('device', 'device_id'),
  GREATEST((SELECT COALESCE(max(device_id), 1) FROM device), 1),
  true
);
SELECT setval(
  pg_get_serial_sequence('service_center', 'center_id'),
  GREATEST((SELECT COALESCE(max(center_id), 1) FROM service_center), 1),
  true
);
SELECT setval(
  pg_get_serial_sequence('issue_category', 'category_id'),
  GREATEST((SELECT COALESCE(max(category_id), 1) FROM issue_category), 1),
  true
);
SELECT setval(
  pg_get_serial_sequence('ticket', 'ticket_id'),
  GREATEST((SELECT COALESCE(max(ticket_id), 1) FROM ticket), 1),
  true
);
SELECT setval(
  pg_get_serial_sequence('ticket_status_log', 'log_id'),
  GREATEST((SELECT COALESCE(max(log_id), 1) FROM ticket_status_log), 1),
  true
);
