-- Potongan / spread untuk pembelian perhiasan dari pelanggan

ALTER TABLE pembelian_perhiasan
  ADD COLUMN IF NOT EXISTS potongan DECIMAL(15, 2);

COMMENT ON COLUMN pembelian_perhiasan.potongan IS 'Potongan / spread pembelian (Rp, opsional)';
