-- Tabel gadai perhiasan + menu RBAC
-- Fresh install: sudah termasuk di schema.sql
-- Database lama: jalankan file ini sekali

CREATE TABLE IF NOT EXISTS gadai_perhiasan (
  no_invoice VARCHAR(50) PRIMARY KEY DEFAULT ('GAD-' || EXTRACT(EPOCH FROM NOW())::TEXT),
  customer_id UUID REFERENCES customers(customer_id) ON DELETE SET NULL,
  nama VARCHAR(255) NOT NULL,
  nik VARCHAR(32),
  perhiasan VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  kadar SMALLINT,
  berat DECIMAL(10, 2) NOT NULL,
  harga_barang DECIMAL(15, 2) NOT NULL,
  uang_dipinjam DECIMAL(15, 2) NOT NULL,
  bunga DECIMAL(15, 2) NOT NULL DEFAULT 0,
  total_pelunasan DECIMAL(15, 2) NOT NULL DEFAULT 0,
  tgl_peminjaman DATE NOT NULL DEFAULT CURRENT_DATE,
  tgl_pelunasan DATE,
  foto_pelunasan TEXT,
  created_by UUID REFERENCES login(user_id) ON DELETE SET NULL,
  created_by_nama VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON COLUMN gadai_perhiasan.customer_id IS 'Member ID pelanggan (opsional, FK customers)';
COMMENT ON COLUMN gadai_perhiasan.nik IS 'Nomor Induk Kependudukan';
COMMENT ON COLUMN gadai_perhiasan.bunga IS 'Bunga pinjaman (Rp)';
COMMENT ON COLUMN gadai_perhiasan.total_pelunasan IS 'Total pelunasan = uang dipinjam + bunga (Rp)';
COMMENT ON COLUMN gadai_perhiasan.foto_pelunasan IS 'URL foto bukti pelunasan';

CREATE INDEX IF NOT EXISTS idx_gadai_tgl_peminjaman ON gadai_perhiasan(tgl_peminjaman DESC);
CREATE INDEX IF NOT EXISTS idx_gadai_tgl_pelunasan ON gadai_perhiasan(tgl_pelunasan DESC);
CREATE INDEX IF NOT EXISTS idx_gadai_nama ON gadai_perhiasan(nama);
CREATE INDEX IF NOT EXISTS idx_gadai_customer ON gadai_perhiasan(customer_id);

ALTER TABLE gadai_perhiasan ENABLE ROW LEVEL SECURITY;

INSERT INTO group_menu_permissions (group_id, menu_key, can_read, can_create, can_update, can_delete)
SELECT g.group_id, 'gadai', TRUE, TRUE, TRUE, TRUE
FROM user_groups g
WHERE g.name = 'Administrator'
ON CONFLICT (group_id, menu_key) DO UPDATE SET
  can_read = EXCLUDED.can_read,
  can_create = EXCLUDED.can_create,
  can_update = EXCLUDED.can_update,
  can_delete = EXCLUDED.can_delete;
