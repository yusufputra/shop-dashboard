-- =============================================================================
-- Shop Dashboard — baseline schema (fresh install)
-- Jalankan file ini sekali di Supabase SQL Editor untuk setup database lengkap.
-- Untuk database lama, gunakan file migrasi incremental di folder supabase/.
-- Setelah schema: jalankan setup_storage_policies.sql untuk bucket foto stok.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Auth & RBAC
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS user_groups (
  group_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS login (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  password VARCHAR(255) NOT NULL,
  group_id UUID REFERENCES user_groups(group_id) ON DELETE SET NULL,
  is_superuser BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS login_email_unique
  ON login (email)
  WHERE email IS NOT NULL AND email <> '';

CREATE TABLE IF NOT EXISTS group_menu_permissions (
  group_id UUID NOT NULL REFERENCES user_groups(group_id) ON DELETE CASCADE,
  menu_key VARCHAR(64) NOT NULL,
  can_read BOOLEAN NOT NULL DEFAULT FALSE,
  can_create BOOLEAN NOT NULL DEFAULT FALSE,
  can_update BOOLEAN NOT NULL DEFAULT FALSE,
  can_delete BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (group_id, menu_key)
);

CREATE TABLE IF NOT EXISTS login_user_groups (
  user_id UUID NOT NULL REFERENCES login(user_id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES user_groups(group_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, group_id)
);

CREATE INDEX IF NOT EXISTS idx_login_user_groups_user ON login_user_groups(user_id);
CREATE INDEX IF NOT EXISTS idx_login_user_groups_group ON login_user_groups(group_id);

-- -----------------------------------------------------------------------------
-- 2. Pelanggan & poin
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS customers (
  customer_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  public_id VARCHAR(255) NOT NULL UNIQUE,
  nama VARCHAR(255) NOT NULL,
  nik VARCHAR(32),
  alamat TEXT,
  phone VARCHAR(20),
  email VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_public_id ON customers(public_id);

COMMENT ON COLUMN customers.public_id IS 'Nomor/ID pelanggan unik (input manual)';
COMMENT ON COLUMN customers.nik IS 'Nomor Induk Kependudukan (opsional)';
COMMENT ON COLUMN customers.alamat IS 'Alamat pelanggan (opsional)';

CREATE TABLE IF NOT EXISTS customer_point_ledger (
  ledger_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(customer_id) ON DELETE CASCADE,
  points DECIMAL(12, 3) NOT NULL CHECK (points > 0),
  weight_grams DECIMAL(12, 3) NOT NULL DEFAULT 0,
  ref_type VARCHAR(32) NOT NULL,
  ref_key VARCHAR(64) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_point_ledger_customer ON customer_point_ledger(customer_id);
CREATE INDEX IF NOT EXISTS idx_point_ledger_expires ON customer_point_ledger(expires_at);

CREATE UNIQUE INDEX IF NOT EXISTS idx_point_ledger_unique_sale
  ON customer_point_ledger (ref_type, ref_key)
  WHERE ref_type = 'penjualan';

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

-- -----------------------------------------------------------------------------
-- 3. Stok, pembelian, pesanan, penjualan
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS stok_perhiasan (
  seri VARCHAR(50) PRIMARY KEY DEFAULT ('STK-' || EXTRACT(EPOCH FROM NOW())::TEXT),
  tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
  jenis VARCHAR(100) NOT NULL,
  perhiasan VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  fyen VARCHAR(255),
  kode_pabrik VARCHAR(100),
  ring_cm DECIMAL(10, 2),
  panjang_cm DECIMAL(10, 2),
  tipe_gelang VARCHAR(20),
  diameter_cm DECIMAL(10, 2),
  berat DECIMAL(10, 2) NOT NULL,
  harga DECIMAL(15, 2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'sold')),
  pembelian_seri VARCHAR(50),
  keterangan TEXT,
  images JSONB DEFAULT '[]'::jsonb,
  warna VARCHAR(50),
  created_by UUID REFERENCES login(user_id) ON DELETE SET NULL,
  created_by_nama VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON COLUMN stok_perhiasan.fyen IS 'Field fyen (string, opsional)';
COMMENT ON COLUMN stok_perhiasan.kode_pabrik IS 'Kode dari pabrik/pemasok';
COMMENT ON COLUMN stok_perhiasan.ring_cm IS 'Ukuran ring (cm), untuk cincin';
COMMENT ON COLUMN stok_perhiasan.panjang_cm IS 'Panjang (cm), untuk kalung atau gelang rantai';
COMMENT ON COLUMN stok_perhiasan.tipe_gelang IS 'Tipe gelang: rantai atau beagle';
COMMENT ON COLUMN stok_perhiasan.diameter_cm IS 'Diameter (cm), untuk gelang beagle';
COMMENT ON COLUMN stok_perhiasan.status IS 'Status of stock item: available or sold';
COMMENT ON COLUMN stok_perhiasan.pembelian_seri IS 'Serial number of the purchase transaction if item is sold';
COMMENT ON COLUMN stok_perhiasan.images IS 'Array of image URLs for the jewelry item';
COMMENT ON COLUMN stok_perhiasan.warna IS 'Warna emas: kuning, rosegold, atau putih';
COMMENT ON COLUMN stok_perhiasan.created_by IS 'user_id dari tabel login (sesi saat insert)';
COMMENT ON COLUMN stok_perhiasan.created_by_nama IS 'Nama pengguna saat data dibuat (denormalized untuk tampilan)';

CREATE TABLE IF NOT EXISTS pembelian_perhiasan (
  seri VARCHAR(50) PRIMARY KEY DEFAULT ('BUY-' || EXTRACT(EPOCH FROM NOW())::TEXT),
  tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
  nama VARCHAR(255) NOT NULL,
  alamat TEXT NOT NULL,
  kadar SMALLINT,
  perhiasan VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  berat DECIMAL(10, 2) NOT NULL,
  harga DECIMAL(15, 2) NOT NULL,
  keterangan TEXT,
  customer_id UUID REFERENCES customers(customer_id) ON DELETE SET NULL,
  created_by UUID REFERENCES login(user_id) ON DELETE SET NULL,
  created_by_nama VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON COLUMN pembelian_perhiasan.kadar IS 'Kadar emas (contoh: 18, 22, 24)';
COMMENT ON COLUMN pembelian_perhiasan.created_by IS 'user_id dari tabel login (sesi saat insert)';
COMMENT ON COLUMN pembelian_perhiasan.created_by_nama IS 'Nama pengguna saat data dibuat';

CREATE TABLE IF NOT EXISTS pesanan_perhiasan (
  no VARCHAR(50) PRIMARY KEY DEFAULT ('ORD-' || EXTRACT(EPOCH FROM NOW())::TEXT),
  tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
  nama VARCHAR(255) NOT NULL,
  alamat TEXT NOT NULL,
  no_telp VARCHAR(20) NOT NULL,
  bahan_perhiasan VARCHAR(100) NOT NULL,
  jenis_perhiasan VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  berat DECIMAL(10, 2) NOT NULL,
  dp_pembayaran DECIMAL(15, 2) NOT NULL DEFAULT 0,
  harga DECIMAL(15, 2) NOT NULL,
  keterangan TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS penjualan_perhiasan (
  no VARCHAR(50) PRIMARY KEY DEFAULT ('SALE-' || EXTRACT(EPOCH FROM NOW())::TEXT),
  tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
  stok_seri VARCHAR(50) NOT NULL REFERENCES stok_perhiasan(seri),
  nama_pembeli VARCHAR(255) NOT NULL,
  alamat TEXT NOT NULL,
  no_telp VARCHAR(20),
  harga_jual DECIMAL(15, 2) NOT NULL,
  biaya DECIMAL(12, 2),
  keterangan TEXT,
  customer_id UUID REFERENCES customers(customer_id) ON DELETE SET NULL,
  created_by UUID REFERENCES login(user_id) ON DELETE SET NULL,
  created_by_nama VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON COLUMN penjualan_perhiasan.biaya IS 'Biaya tambahan untuk penjualan (opsional)';
COMMENT ON COLUMN penjualan_perhiasan.created_by IS 'user_id dari tabel login (sesi saat insert)';
COMMENT ON COLUMN penjualan_perhiasan.created_by_nama IS 'Nama pengguna saat data dibuat';

-- -----------------------------------------------------------------------------
-- 4. Indexes
-- -----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_stok_tanggal ON stok_perhiasan(tanggal DESC);
CREATE INDEX IF NOT EXISTS idx_stok_jenis ON stok_perhiasan(jenis);
CREATE INDEX IF NOT EXISTS idx_stok_status ON stok_perhiasan(status);
CREATE INDEX IF NOT EXISTS idx_stok_pembelian_seri ON stok_perhiasan(pembelian_seri);
CREATE INDEX IF NOT EXISTS idx_stok_warna ON stok_perhiasan(warna);
CREATE INDEX IF NOT EXISTS idx_pembelian_tanggal ON pembelian_perhiasan(tanggal DESC);
CREATE INDEX IF NOT EXISTS idx_pembelian_customer ON pembelian_perhiasan(customer_id);
CREATE INDEX IF NOT EXISTS idx_pesanan_tanggal ON pesanan_perhiasan(tanggal DESC);
CREATE INDEX IF NOT EXISTS idx_pesanan_nama ON pesanan_perhiasan(nama);
CREATE INDEX IF NOT EXISTS idx_penjualan_tanggal ON penjualan_perhiasan(tanggal DESC);
CREATE INDEX IF NOT EXISTS idx_penjualan_stok_seri ON penjualan_perhiasan(stok_seri);
CREATE INDEX IF NOT EXISTS idx_penjualan_nama ON penjualan_perhiasan(nama_pembeli);
CREATE INDEX IF NOT EXISTS idx_penjualan_customer ON penjualan_perhiasan(customer_id);

-- -----------------------------------------------------------------------------
-- 5. Row Level Security — dashboard (browser memakai anon key)
-- -----------------------------------------------------------------------------

ALTER TABLE stok_perhiasan ENABLE ROW LEVEL SECURITY;
ALTER TABLE pembelian_perhiasan ENABLE ROW LEVEL SECURITY;
ALTER TABLE pesanan_perhiasan ENABLE ROW LEVEL SECURITY;
ALTER TABLE penjualan_perhiasan ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_point_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_point_redeem ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_menu_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_user_groups ENABLE ROW LEVEL SECURITY;

-- stok_perhiasan
DROP POLICY IF EXISTS "Allow authenticated users to view stok" ON stok_perhiasan;
DROP POLICY IF EXISTS "Allow authenticated users to insert stok" ON stok_perhiasan;
DROP POLICY IF EXISTS "Allow authenticated users to update stok" ON stok_perhiasan;
DROP POLICY IF EXISTS "Allow authenticated users to delete stok" ON stok_perhiasan;
DROP POLICY IF EXISTS "Allow public read access" ON stok_perhiasan;
DROP POLICY IF EXISTS "Allow public insert" ON stok_perhiasan;
DROP POLICY IF EXISTS "Allow public update" ON stok_perhiasan;
DROP POLICY IF EXISTS "Allow public delete" ON stok_perhiasan;
DROP POLICY IF EXISTS "Dashboard anon authenticated all" ON stok_perhiasan;
CREATE POLICY "Dashboard anon authenticated all"
  ON stok_perhiasan FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

-- pembelian_perhiasan
DROP POLICY IF EXISTS "Allow authenticated users to view pembelian" ON pembelian_perhiasan;
DROP POLICY IF EXISTS "Allow authenticated users to insert pembelian" ON pembelian_perhiasan;
DROP POLICY IF EXISTS "Allow authenticated users to update pembelian" ON pembelian_perhiasan;
DROP POLICY IF EXISTS "Allow authenticated users to delete pembelian" ON pembelian_perhiasan;
DROP POLICY IF EXISTS "Allow public read access" ON pembelian_perhiasan;
DROP POLICY IF EXISTS "Allow public insert" ON pembelian_perhiasan;
DROP POLICY IF EXISTS "Allow public update" ON pembelian_perhiasan;
DROP POLICY IF EXISTS "Allow public delete" ON pembelian_perhiasan;
DROP POLICY IF EXISTS "Dashboard anon authenticated all" ON pembelian_perhiasan;
CREATE POLICY "Dashboard anon authenticated all"
  ON pembelian_perhiasan FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

-- pesanan_perhiasan
DROP POLICY IF EXISTS "Allow authenticated users to view pesanan" ON pesanan_perhiasan;
DROP POLICY IF EXISTS "Allow authenticated users to insert pesanan" ON pesanan_perhiasan;
DROP POLICY IF EXISTS "Allow authenticated users to update pesanan" ON pesanan_perhiasan;
DROP POLICY IF EXISTS "Allow authenticated users to delete pesanan" ON pesanan_perhiasan;
DROP POLICY IF EXISTS "Allow public read access" ON pesanan_perhiasan;
DROP POLICY IF EXISTS "Allow public insert" ON pesanan_perhiasan;
DROP POLICY IF EXISTS "Allow public update" ON pesanan_perhiasan;
DROP POLICY IF EXISTS "Allow public delete" ON pesanan_perhiasan;
DROP POLICY IF EXISTS "Dashboard anon authenticated all" ON pesanan_perhiasan;
CREATE POLICY "Dashboard anon authenticated all"
  ON pesanan_perhiasan FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

-- penjualan_perhiasan
DROP POLICY IF EXISTS "Dashboard anon authenticated all" ON penjualan_perhiasan;
CREATE POLICY "Dashboard anon authenticated all"
  ON penjualan_perhiasan FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

-- customers
DROP POLICY IF EXISTS "Allow anon authenticated customers all" ON customers;
DROP POLICY IF EXISTS "Dashboard anon authenticated all" ON customers;
CREATE POLICY "Dashboard anon authenticated all"
  ON customers FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

-- customer_point_ledger
DROP POLICY IF EXISTS "Allow anon authenticated ledger all" ON customer_point_ledger;
DROP POLICY IF EXISTS "Dashboard anon authenticated all" ON customer_point_ledger;
CREATE POLICY "Dashboard anon authenticated all"
  ON customer_point_ledger FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

-- customer_point_redeem
DROP POLICY IF EXISTS "Dashboard anon authenticated all" ON customer_point_redeem;
CREATE POLICY "Dashboard anon authenticated all"
  ON customer_point_redeem FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

-- login: RLS aktif, tanpa policy anon/authenticated (hanya service_role via API)
ALTER TABLE login ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access" ON login;
DROP POLICY IF EXISTS "Allow public insert" ON login;
DROP POLICY IF EXISTS "Allow public update" ON login;
DROP POLICY IF EXISTS "Allow public delete" ON login;

-- -----------------------------------------------------------------------------
-- 6. Seed RBAC — grup Administrator
-- -----------------------------------------------------------------------------

INSERT INTO user_groups (group_id, name, description) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Administrator', 'Akses penuh semua menu')
ON CONFLICT (name) DO NOTHING;

INSERT INTO group_menu_permissions (group_id, menu_key, can_read, can_create, can_update, can_delete) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'dashboard', TRUE, TRUE, TRUE, TRUE),
  ('a0000000-0000-0000-0000-000000000001', 'inventory', TRUE, TRUE, TRUE, TRUE),
  ('a0000000-0000-0000-0000-000000000001', 'sales', TRUE, TRUE, TRUE, TRUE),
  ('a0000000-0000-0000-0000-000000000001', 'purchases', TRUE, TRUE, TRUE, TRUE),
  ('a0000000-0000-0000-0000-000000000001', 'orders', TRUE, TRUE, TRUE, TRUE),
  ('a0000000-0000-0000-0000-000000000001', 'calculator', TRUE, TRUE, TRUE, TRUE),
  ('a0000000-0000-0000-0000-000000000001', 'users', TRUE, TRUE, TRUE, TRUE),
  ('a0000000-0000-0000-0000-000000000001', 'user_groups', TRUE, TRUE, TRUE, TRUE),
  ('a0000000-0000-0000-0000-000000000001', 'customers', TRUE, TRUE, TRUE, TRUE),
  ('a0000000-0000-0000-0000-000000000001', 'point_redeem', TRUE, TRUE, TRUE, TRUE)
ON CONFLICT (group_id, menu_key) DO UPDATE SET
  can_read = EXCLUDED.can_read,
  can_create = EXCLUDED.can_create,
  can_update = EXCLUDED.can_update,
  can_delete = EXCLUDED.can_delete;

UPDATE login
SET group_id = 'a0000000-0000-0000-0000-000000000001'
WHERE group_id IS NULL;

INSERT INTO login_user_groups (user_id, group_id)
SELECT user_id, group_id FROM login
WHERE group_id IS NOT NULL
ON CONFLICT (user_id, group_id) DO NOTHING;
