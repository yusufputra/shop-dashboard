-- Migration: Add status and pembelian_seri columns to stok_perhiasan table
-- Run this SQL in Supabase SQL Editor to update existing table

-- Add status column (default: 'available')
ALTER TABLE stok_perhiasan 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'available';

-- Add pembelian_seri column to track which purchase bought this item
ALTER TABLE stok_perhiasan 
ADD COLUMN IF NOT EXISTS pembelian_seri VARCHAR(50);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_stok_status ON stok_perhiasan(status);
CREATE INDEX IF NOT EXISTS idx_stok_pembelian_seri ON stok_perhiasan(pembelian_seri);

-- Add comment to explain the columns
COMMENT ON COLUMN stok_perhiasan.status IS 'Status of stock item: available or sold';
COMMENT ON COLUMN stok_perhiasan.pembelian_seri IS 'Serial number of the purchase transaction if item is sold';
