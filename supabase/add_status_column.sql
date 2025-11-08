-- Add status column to stok_perhiasan table
ALTER TABLE stok_perhiasan 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'sold'));

-- Update existing records to have 'available' status
UPDATE stok_perhiasan SET status = 'available' WHERE status IS NULL;

-- Create index for status column for better performance
CREATE INDEX IF NOT EXISTS idx_stok_status ON stok_perhiasan(status);
