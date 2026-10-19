-- NFR4: chong tao trung phieu khi client gui lai cung request_id.
ALTER TABLE ticket ADD COLUMN IF NOT EXISTS request_id VARCHAR(100);

CREATE UNIQUE INDEX IF NOT EXISTS uq_ticket_request_id
  ON ticket(request_id)
  WHERE request_id IS NOT NULL;

-- QT-13: khong xoa vat ly phieu; cot is_active da co trong 001.
CREATE INDEX IF NOT EXISTS idx_ticket_active_status ON ticket(is_active, status, due_date);
