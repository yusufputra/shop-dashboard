-- NIK & alamat pelanggan (jalankan di Supabase jika tabel sudah ada tanpa kolom ini)

ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS nik VARCHAR(32),
  ADD COLUMN IF NOT EXISTS alamat TEXT;

COMMENT ON COLUMN customers.nik IS 'Nomor Induk Kependudukan (opsional)';
COMMENT ON COLUMN customers.alamat IS 'Alamat pelanggan (opsional)';
