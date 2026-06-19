-- Poin ledger: simpan desimal (1 gram = 1 poin, mis. 0.8g -> 0.8 poin)
-- Fresh install: sudah DECIMAL(12, 3) di schema.sql
-- Database lama: jalankan file ini jika kolom points masih INTEGER

ALTER TABLE customer_point_ledger
  ALTER COLUMN points TYPE DECIMAL(12, 3) USING points::DECIMAL(12, 3);
