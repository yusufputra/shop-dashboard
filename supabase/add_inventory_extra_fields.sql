-- Kode pabrik + dimensi per jenis perhiasan (stok)

ALTER TABLE stok_perhiasan
  ADD COLUMN IF NOT EXISTS kode_pabrik VARCHAR(100),
  ADD COLUMN IF NOT EXISTS ring_cm DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS panjang_cm DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS tipe_gelang VARCHAR(20),
  ADD COLUMN IF NOT EXISTS diameter_cm DECIMAL(10, 2);

COMMENT ON COLUMN stok_perhiasan.kode_pabrik IS 'Kode dari pabrik/pemasok';
COMMENT ON COLUMN stok_perhiasan.ring_cm IS 'Ukuran ring (cm), untuk cincin';
COMMENT ON COLUMN stok_perhiasan.panjang_cm IS 'Panjang (cm), untuk kalung atau gelang rantai';
COMMENT ON COLUMN stok_perhiasan.tipe_gelang IS 'Tipe gelang: rantai atau beagle';
COMMENT ON COLUMN stok_perhiasan.diameter_cm IS 'Diameter (cm), untuk gelang beagle';
