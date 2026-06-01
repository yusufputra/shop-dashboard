-- Kolom fyen pada stok perhiasan (teks bebas)

ALTER TABLE stok_perhiasan
  ADD COLUMN IF NOT EXISTS fyen VARCHAR(255);

COMMENT ON COLUMN stok_perhiasan.fyen IS 'Field fyen (string, opsional)';
