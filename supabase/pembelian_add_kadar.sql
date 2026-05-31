-- Kadar emas (karat), mengacu angka standar SNI / GOLD_STANDARDS di aplikasi

ALTER TABLE pembelian_perhiasan
  ADD COLUMN IF NOT EXISTS kadar SMALLINT;

COMMENT ON COLUMN pembelian_perhiasan.kadar IS 'Kadar emas (contoh: 18, 22, 24)';
