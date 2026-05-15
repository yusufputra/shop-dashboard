-- Pelanggan (ID publik 10 digit), poin dari penjualan (1 poin / gram), kedaluwarsa 1 tahun.
-- Opsional: tautkan penjualan & pembelian ke pelanggan.

CREATE TABLE IF NOT EXISTS customers (
  customer_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  public_id CHAR(10) NOT NULL UNIQUE,
  nama VARCHAR(255) NOT NULL,
  nik VARCHAR(32),
  alamat TEXT,
  phone VARCHAR(20),
  email VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_public_id ON customers(public_id);

CREATE TABLE IF NOT EXISTS customer_point_ledger (
  ledger_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(customer_id) ON DELETE CASCADE,
  points INTEGER NOT NULL CHECK (points > 0),
  weight_grams DECIMAL(12, 3) NOT NULL DEFAULT 0,
  ref_type VARCHAR(32) NOT NULL,
  ref_key VARCHAR(64) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_point_ledger_customer ON customer_point_ledger(customer_id);
CREATE INDEX IF NOT EXISTS idx_point_ledger_expires ON customer_point_ledger(expires_at);

-- Satu baris poin per penjualan (hindari double credit)
CREATE UNIQUE INDEX IF NOT EXISTS idx_point_ledger_unique_sale
  ON customer_point_ledger (ref_type, ref_key)
  WHERE ref_type = 'penjualan';

ALTER TABLE penjualan_perhiasan
  ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(customer_id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_penjualan_customer ON penjualan_perhiasan(customer_id);

ALTER TABLE pembelian_perhiasan
  ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(customer_id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_pembelian_customer ON pembelian_perhiasan(customer_id);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_point_ledger ENABLE ROW LEVEL SECURITY;

-- Dev / anon policy (samakan dengan setup_rls_policies untuk tabel lain)
DROP POLICY IF EXISTS "Allow anon authenticated customers all" ON customers;
CREATE POLICY "Allow anon authenticated customers all"
  ON customers FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon authenticated ledger all" ON customer_point_ledger;
CREATE POLICY "Allow anon authenticated ledger all"
  ON customer_point_ledger FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

-- Menu RBAC "customers" untuk grup Administrator (by name)
INSERT INTO group_menu_permissions (group_id, menu_key, can_read, can_create, can_update, can_delete)
SELECT g.group_id, 'customers', TRUE, TRUE, TRUE, TRUE
FROM user_groups g
WHERE g.name = 'Administrator'
ON CONFLICT (group_id, menu_key) DO UPDATE SET
  can_read = EXCLUDED.can_read,
  can_create = EXCLUDED.can_create,
  can_update = EXCLUDED.can_update,
  can_delete = EXCLUDED.can_delete;
