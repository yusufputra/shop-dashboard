-- Bunga & total pelunasan untuk gadai
-- Database lama: jalankan file ini sekali

ALTER TABLE gadai_perhiasan ADD COLUMN IF NOT EXISTS bunga DECIMAL(15, 2) NOT NULL DEFAULT 0;
ALTER TABLE gadai_perhiasan ADD COLUMN IF NOT EXISTS total_pelunasan DECIMAL(15, 2) NOT NULL DEFAULT 0;

COMMENT ON COLUMN gadai_perhiasan.bunga IS 'Bunga pinjaman (Rp)';
COMMENT ON COLUMN gadai_perhiasan.total_pelunasan IS 'Total pelunasan = uang dipinjam + bunga (Rp)';

-- Backfill total untuk data lama
UPDATE gadai_perhiasan
SET total_pelunasan = uang_dipinjam + bunga
WHERE total_pelunasan = 0 AND uang_dipinjam > 0;
