-- Create penjualan_perhiasan table for tracking sales to customers
CREATE TABLE IF NOT EXISTS penjualan_perhiasan (
  no VARCHAR(50) PRIMARY KEY DEFAULT ('SALE-' || EXTRACT(EPOCH FROM NOW())::TEXT),
  tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
  stok_seri VARCHAR(50) NOT NULL REFERENCES stok_perhiasan(seri),
  nama_pembeli VARCHAR(255) NOT NULL,
  alamat TEXT NOT NULL,
  no_telp VARCHAR(20),
  harga_jual DECIMAL(15, 2) NOT NULL,
  keterangan TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_penjualan_tanggal ON penjualan_perhiasan(tanggal DESC);
CREATE INDEX IF NOT EXISTS idx_penjualan_stok_seri ON penjualan_perhiasan(stok_seri);
CREATE INDEX IF NOT EXISTS idx_penjualan_nama ON penjualan_perhiasan(nama_pembeli);

-- Enable Row Level Security
ALTER TABLE penjualan_perhiasan ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Allow authenticated users to view penjualan"
  ON penjualan_perhiasan FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert penjualan"
  ON penjualan_perhiasan FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update penjualan"
  ON penjualan_perhiasan FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to delete penjualan"
  ON penjualan_perhiasan FOR DELETE
  TO authenticated
  USING (true);
