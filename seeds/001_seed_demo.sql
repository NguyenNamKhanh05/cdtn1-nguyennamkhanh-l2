-- Du lieu mau L2; INSERT ON CONFLICT de chay lai khong bi nhan doi.
INSERT INTO service_center (center_id, center_name, city) VALUES
  (1, 'Trung tam Can Tho', 'Can Tho'),
  (2, 'Trung tam Ho Chi Minh', 'Ho Chi Minh')
ON CONFLICT (center_id) DO NOTHING;

INSERT INTO issue_category (category_id, category_name, default_priority) VALUES
  (1, 'MAN_HINH', 'CAO'),
  (2, 'PIN', 'TRUNG_BINH'),
  (3, 'SAC', 'TRUNG_BINH'),
  (4, 'PHAN_MEM', 'THAP'),
  (5, 'NUOC_VAO', 'CAO'),
  (6, 'KHAC', 'THAP')
ON CONFLICT (category_id) DO NOTHING;

INSERT INTO customer (full_name, phone, email, address)
SELECT 'Khach hang ' || so, '090' || lpad(so::text, 7, '0'), 'khach' || so || '@example.com', 'Can Tho'
FROM generate_series(1, 20) AS so
ON CONFLICT (phone) DO NOTHING;

INSERT INTO device (customer_id, serial_no, purchase_date, warranty_months)
SELECT customer_id, 'SN-' || lpad(customer_id::text, 5, '0'), DATE '2026-03-01', 12
FROM customer
WHERE customer_id BETWEEN 1 AND 20
ON CONFLICT (serial_no) DO NOTHING;

INSERT INTO ticket (ticket_code, customer_id, device_id, center_id, request_type, issue_desc, category_id, priority, status, due_date, is_warranty)
SELECT 'BH-DEMO-' || lpad(customer_id::text, 4, '0'), customer_id, device_id, 1, 'BAO_HANH',
       'Thiet bi can kiem tra', 3, 'TRUNG_BINH', 'MOI', now() + interval '72 hours', true
FROM device
WHERE device_id BETWEEN 1 AND 20
ON CONFLICT (ticket_code) DO NOTHING;

INSERT INTO ticket_status_log (ticket_id, from_status, to_status, changed_by, note)
SELECT ticket_id, NULL, 'MOI', 1, 'Tao du lieu mau L2'
FROM ticket
WHERE ticket_code LIKE 'BH-DEMO-%'
  AND NOT EXISTS (SELECT 1 FROM ticket_status_log log WHERE log.ticket_id = ticket.ticket_id);
