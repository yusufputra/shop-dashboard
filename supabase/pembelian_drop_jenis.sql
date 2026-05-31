-- Hapus kolom jenis dari pembelian (kadar dipakai untuk klasifikasi emas).

ALTER TABLE pembelian_perhiasan
  DROP COLUMN IF EXISTS jenis;
