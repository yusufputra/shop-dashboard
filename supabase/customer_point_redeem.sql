-- Redeem poin pelanggan (proses manual oleh staff)
-- Fresh install: sudah termasuk di schema.sql
-- Database lama: jalankan file ini saja jika tabel belum ada

CREATE TABLE IF NOT EXISTS customer_point_redeem (
  redeem_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(customer_id) ON DELETE CASCADE,
  points INTEGER NOT NULL CHECK (points > 0),
  keterangan TEXT,
  created_by UUID REFERENCES login(user_id) ON DELETE SET NULL,
  created_by_nama VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_point_redeem_customer ON customer_point_redeem(customer_id);
CREATE INDEX IF NOT EXISTS idx_point_redeem_created ON customer_point_redeem(created_at DESC);

ALTER TABLE customer_point_redeem ENABLE ROW LEVEL SECURITY;
