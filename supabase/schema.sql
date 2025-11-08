-- Create login table
CREATE TABLE IF NOT EXISTS login (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create stok_perhiasan table
CREATE TABLE IF NOT EXISTS stok_perhiasan (
  seri VARCHAR(50) PRIMARY KEY DEFAULT ('STK-' || EXTRACT(EPOCH FROM NOW())::TEXT),
  tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
  jenis VARCHAR(100) NOT NULL,
  perhiasan VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  berat DECIMAL(10, 2) NOT NULL,
  harga DECIMAL(15, 2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'available',
  pembelian_seri VARCHAR(50),
  keterangan TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create pembelian_perhiasan table
CREATE TABLE IF NOT EXISTS pembelian_perhiasan (
  seri VARCHAR(50) PRIMARY KEY DEFAULT ('BUY-' || EXTRACT(EPOCH FROM NOW())::TEXT),
  tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
  nama VARCHAR(255) NOT NULL,
  alamat TEXT NOT NULL,
  jenis VARCHAR(100) NOT NULL,
  perhiasan VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  berat DECIMAL(10, 2) NOT NULL,
  harga DECIMAL(15, 2) NOT NULL,
  keterangan TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create pesanan_perhiasan table
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_stok_tanggal ON stok_perhiasan(tanggal DESC);
CREATE INDEX IF NOT EXISTS idx_stok_jenis ON stok_perhiasan(jenis);
CREATE INDEX IF NOT EXISTS idx_stok_status ON stok_perhiasan(status);
CREATE INDEX IF NOT EXISTS idx_stok_pembelian_seri ON stok_perhiasan(pembelian_seri);
CREATE INDEX IF NOT EXISTS idx_pembelian_tanggal ON pembelian_perhiasan(tanggal DESC);
CREATE INDEX IF NOT EXISTS idx_pesanan_tanggal ON pesanan_perhiasan(tanggal DESC);
CREATE INDEX IF NOT EXISTS idx_pesanan_nama ON pesanan_perhiasan(nama);

-- Enable Row Level Security
ALTER TABLE stok_perhiasan ENABLE ROW LEVEL SECURITY;
ALTER TABLE pembelian_perhiasan ENABLE ROW LEVEL SECURITY;
ALTER TABLE pesanan_perhiasan ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Allow authenticated users to view stok"
  ON stok_perhiasan FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert stok"
  ON stok_perhiasan FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update stok"
  ON stok_perhiasan FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to delete stok"
  ON stok_perhiasan FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to view pembelian"
  ON pembelian_perhiasan FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert pembelian"
  ON pembelian_perhiasan FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update pembelian"
  ON pembelian_perhiasan FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to delete pembelian"
  ON pembelian_perhiasan FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to view pesanan"
  ON pesanan_perhiasan FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert pesanan"
  ON pesanan_perhiasan FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update pesanan"
  ON pesanan_perhiasan FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to delete pesanan"
  ON pesanan_perhiasan FOR DELETE
  TO authenticated
  USING (true);
