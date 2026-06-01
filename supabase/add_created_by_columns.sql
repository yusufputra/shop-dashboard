-- Pelacak pengguna yang membuat stok, pembelian, dan penjualan (dari sesi dashboard).

ALTER TABLE stok_perhiasan
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES login(user_id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS created_by_nama VARCHAR(255);

ALTER TABLE pembelian_perhiasan
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES login(user_id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS created_by_nama VARCHAR(255);

ALTER TABLE penjualan_perhiasan
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES login(user_id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS created_by_nama VARCHAR(255);

COMMENT ON COLUMN stok_perhiasan.created_by IS 'user_id dari tabel login (sesi saat insert)';
COMMENT ON COLUMN stok_perhiasan.created_by_nama IS 'Nama pengguna saat data dibuat (denormalized untuk tampilan)';
COMMENT ON COLUMN pembelian_perhiasan.created_by IS 'user_id dari tabel login (sesi saat insert)';
COMMENT ON COLUMN pembelian_perhiasan.created_by_nama IS 'Nama pengguna saat data dibuat';
COMMENT ON COLUMN penjualan_perhiasan.created_by IS 'user_id dari tabel login (sesi saat insert)';
COMMENT ON COLUMN penjualan_perhiasan.created_by_nama IS 'Nama pengguna saat data dibuat';
