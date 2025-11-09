-- Migration: Add warna column to stok_perhiasan table
-- Date: 2025-11-09
-- Description: Adds a warna (color) field to store jewelry color (kuning, rosegold, putih)

ALTER TABLE stok_perhiasan 
ADD COLUMN IF NOT EXISTS warna VARCHAR(50);

-- Add comment to the column
COMMENT ON COLUMN stok_perhiasan.warna IS 'Warna emas: kuning, rosegold, atau putih';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_stok_warna ON stok_perhiasan(warna);
