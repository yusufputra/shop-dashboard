-- Add images column to stok_perhiasan table
-- This will store an array of image URLs as JSON

ALTER TABLE stok_perhiasan 
ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN stok_perhiasan.images IS 'Array of image URLs for the jewelry item';
