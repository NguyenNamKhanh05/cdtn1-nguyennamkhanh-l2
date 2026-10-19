-- SQL DDL skeleton cho luồng L2, PostgreSQL 16

CREATE TABLE customer (
  customer_id BIGSERIAL PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  phone VARCHAR(20) NOT NULL UNIQUE,
  email VARCHAR(120),
  address VARCHAR(255),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE service_center (
  center_id BIGSERIAL PRIMARY KEY,
  center_name VARCHAR(120) NOT NULL,
  city VARCHAR(80) NOT NULL
);

CREATE TABLE device (
  device_id BIGSERIAL PRIMARY KEY,
  customer_id BIGINT NOT NULL REFERENCES customer(customer_id),
  serial_no VARCHAR(50) NOT NULL UNIQUE,
  purchase_date DATE,
  warranty_months SMALLINT NOT NULL DEFAULT 12 CHECK (warranty_months > 0)
);

CREATE TABLE issue_category (
  category_id SERIAL PRIMARY KEY,
  category_name VARCHAR(60) NOT NULL UNIQUE,
  default_priority VARCHAR(10) NOT NULL CHECK (default_priority IN ('CAO', 'TRUNG_BINH', 'THAP')),
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE ticket (
  ticket_id BIGSERIAL PRIMARY KEY,
  ticket_code VARCHAR(20) NOT NULL UNIQUE,
  customer_id BIGINT NOT NULL REFERENCES customer(customer_id),
  device_id BIGINT NOT NULL REFERENCES device(device_id),
  center_id BIGINT NOT NULL REFERENCES service_center(center_id),
  request_type VARCHAR(20) NOT NULL DEFAULT 'BAO_HANH' CHECK (request_type IN ('BAO_HANH', 'DOI_TRA')),
  issue_desc TEXT NOT NULL,
  category_id INT REFERENCES issue_category(category_id),
  priority VARCHAR(10) NOT NULL CHECK (priority IN ('CAO', 'TRUNG_BINH', 'THAP')),
  status VARCHAR(20) NOT NULL DEFAULT 'MOI' CHECK (status IN ('MOI', 'DA_PHAN_CONG', 'DANG_XU_LY', 'CHO_LINH_KIEN', 'HOAN_TAT', 'DA_DONG', 'DA_HUY')),
  received_at TIMESTAMP NOT NULL DEFAULT now(),
  due_date TIMESTAMP NOT NULL,
  closed_at TIMESTAMP,
  is_warranty BOOLEAN NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT ck_ticket_closed_at CHECK (status = 'DA_DONG' OR closed_at IS NULL)
);

CREATE TABLE ticket_status_log (
  log_id BIGSERIAL PRIMARY KEY,
  ticket_id BIGINT NOT NULL REFERENCES ticket(ticket_id),
  from_status VARCHAR(20),
  to_status VARCHAR(20) NOT NULL,
  changed_at TIMESTAMP NOT NULL DEFAULT now(),
  changed_by BIGINT NOT NULL,
  note VARCHAR(255)
);

CREATE INDEX idx_ticket_status_due_date ON ticket(status, due_date);
CREATE INDEX idx_ticket_customer ON ticket(customer_id);
CREATE INDEX idx_ticket_status_log_ticket ON ticket_status_log(ticket_id, changed_at);
CREATE INDEX idx_customer_phone ON customer(phone);

-- ---------------------------------------------------------------------------
-- Phần bổ sung khi hiện thực BT2. Bản chạy thật nằm ở migrations/002 và 003;
-- file này chỉ là bản tóm tắt để đọc cùng hồ sơ thiết kế.
-- ---------------------------------------------------------------------------

-- NFR3: chống tạo trùng phiếu khi client gửi lại cùng request_id.
-- Dùng partial unique index để nhiều phiếu được phép có request_id NULL
-- (phiếu nhập tay không cần khóa idempotency).
ALTER TABLE ticket ADD COLUMN request_id VARCHAR(100);
CREATE UNIQUE INDEX uq_ticket_request_id ON ticket(request_id) WHERE request_id IS NOT NULL;

-- QT-14: lọc theo trung tâm là truy vấn thường xuyên.
CREATE INDEX idx_ticket_active_status ON ticket(is_active, status, due_date);

-- Danh mục bổ trợ: mã trung tâm và kỹ thuật viên (dữ liệu tham chiếu cho L4).
ALTER TABLE service_center ADD COLUMN center_code VARCHAR(20);
CREATE UNIQUE INDEX uq_service_center_code ON service_center(center_code) WHERE center_code IS NOT NULL;

CREATE TABLE technician (
  technician_id BIGSERIAL PRIMARY KEY,
  technician_code VARCHAR(20) NOT NULL UNIQUE,
  full_name VARCHAR(120) NOT NULL,
  center_id BIGINT NOT NULL REFERENCES service_center(center_id),
  level VARCHAR(20) NOT NULL CHECK (level IN ('SO_CAP', 'TRUNG_CAP', 'CAO_CAP')),
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE technician_skill (
  technician_id BIGINT NOT NULL REFERENCES technician(technician_id) ON DELETE CASCADE,
  category_id INT NOT NULL REFERENCES issue_category(category_id),
  proficiency SMALLINT NOT NULL CHECK (proficiency BETWEEN 1 AND 5),
  PRIMARY KEY (technician_id, category_id)
);

CREATE INDEX idx_technician_center ON technician(center_id);

-- Data-model review against Buoi 5:
-- 1NF: every column stores one scalar value; parts, status history and
--     categories are not packed into comma-separated text.
-- 2NF: tables use single-column surrogate keys; no non-key column depends
--     on only part of a composite key.
-- 3NF: customer, device, issue_category and service_center hold independent
--     facts; ticket stores foreign keys instead of duplicated names.
-- No isolated table: every table participates in at least one relationship.
-- No derived duration column is stored; processing duration is calculated
--     from received_at and closed_at when needed.
-- ticket_status_log preserves every transition instead of overwriting history.
