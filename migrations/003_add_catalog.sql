-- Danh muc bo tro cho L2: ma trung tam va ky thuat vien.
-- Ky thuat vien chi la du lieu danh muc; viec phan cong thuoc luong L4, ngoai pham vi BT2.
ALTER TABLE service_center ADD COLUMN IF NOT EXISTS center_code VARCHAR(20);

CREATE UNIQUE INDEX IF NOT EXISTS uq_service_center_code
  ON service_center(center_code)
  WHERE center_code IS NOT NULL;

CREATE TABLE IF NOT EXISTS technician (
  technician_id BIGSERIAL PRIMARY KEY,
  technician_code VARCHAR(20) NOT NULL UNIQUE,
  full_name VARCHAR(120) NOT NULL,
  center_id BIGINT NOT NULL REFERENCES service_center(center_id),
  level VARCHAR(20) NOT NULL CHECK (level IN ('SO_CAP', 'TRUNG_CAP', 'CAO_CAP')),
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS technician_skill (
  technician_id BIGINT NOT NULL REFERENCES technician(technician_id) ON DELETE CASCADE,
  category_id INT NOT NULL REFERENCES issue_category(category_id),
  proficiency SMALLINT NOT NULL CHECK (proficiency BETWEEN 1 AND 5),
  PRIMARY KEY (technician_id, category_id)
);

CREATE INDEX IF NOT EXISTS idx_technician_center ON technician(center_id);
