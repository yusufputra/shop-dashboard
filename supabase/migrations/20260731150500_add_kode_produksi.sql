-- Kode produksi untuk Logam Mulia (LM)

ALTER TABLE stok_perhiasan
  ADD COLUMN IF NOT EXISTS kode_produksi VARCHAR(100);

COMMENT ON COLUMN stok_perhiasan.kode_produksi IS 'Kode produksi, untuk logam mulia (LM)';
