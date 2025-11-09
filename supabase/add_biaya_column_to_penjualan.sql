-- Add biaya (cost) column to penjualan_perhiasan table
ALTER TABLE penjualan_perhiasan 
ADD COLUMN IF NOT EXISTS biaya DECIMAL(12,2) DEFAULT NULL;

-- Add comment to the column
COMMENT ON COLUMN penjualan_perhiasan.biaya IS 'Biaya tambahan untuk penjualan (opsional)';
