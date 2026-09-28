-- SQL DDL skeleton cho luồng L2, PostgreSQL 16

CREATE TABLE customer (
  customer_id BIGSERIAL PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  phone VARCHAR(20) NOT NULL UNIQUE,
  email VARCHAR(120),
  address VARCHAR(255),
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
  product_id BIGINT,
  purchase_date DATE,
  warranty_months SMALLINT NOT NULL DEFAULT 12
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
  issue_desc TEXT NOT NULL,
  category_id INT REFERENCES issue_category(category_id),
  priority VARCHAR(10) NOT NULL CHECK (priority IN ('CAO', 'TRUNG_BINH', 'THAP')),
  status VARCHAR(20) NOT NULL DEFAULT 'MOI',
  received_at TIMESTAMP NOT NULL DEFAULT now(),
  due_date TIMESTAMP NOT NULL,
  closed_at TIMESTAMP,
  is_warranty BOOLEAN NOT NULL
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
