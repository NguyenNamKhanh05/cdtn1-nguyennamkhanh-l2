-- Tao cau truc CSDL L2; co the chay lai an toan.
CREATE TABLE IF NOT EXISTS customer (
  customer_id BIGSERIAL PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  phone VARCHAR(20) NOT NULL UNIQUE,
  email VARCHAR(120),
  address VARCHAR(255),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS service_center (
  center_id BIGSERIAL PRIMARY KEY,
  center_name VARCHAR(120) NOT NULL,
  city VARCHAR(80) NOT NULL
);

CREATE TABLE IF NOT EXISTS device (
  device_id BIGSERIAL PRIMARY KEY,
  customer_id BIGINT NOT NULL REFERENCES customer(customer_id),
  serial_no VARCHAR(50) NOT NULL UNIQUE,
  purchase_date DATE,
  warranty_months SMALLINT NOT NULL DEFAULT 12 CHECK (warranty_months > 0)
);

CREATE TABLE IF NOT EXISTS issue_category (
  category_id SERIAL PRIMARY KEY,
  category_name VARCHAR(60) NOT NULL UNIQUE,
  default_priority VARCHAR(10) NOT NULL CHECK (default_priority IN ('CAO', 'TRUNG_BINH', 'THAP')),
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS ticket (
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

CREATE TABLE IF NOT EXISTS ticket_status_log (
  log_id BIGSERIAL PRIMARY KEY,
  ticket_id BIGINT NOT NULL REFERENCES ticket(ticket_id),
  from_status VARCHAR(20),
  to_status VARCHAR(20) NOT NULL,
  changed_at TIMESTAMP NOT NULL DEFAULT now(),
  changed_by BIGINT NOT NULL,
  note VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_ticket_status_due_date ON ticket(status, due_date);
CREATE INDEX IF NOT EXISTS idx_ticket_customer ON ticket(customer_id);
CREATE INDEX IF NOT EXISTS idx_ticket_status_log_ticket ON ticket_status_log(ticket_id, changed_at);
CREATE INDEX IF NOT EXISTS idx_customer_phone ON customer(phone);
