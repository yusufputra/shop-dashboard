-- Nomor pelanggan manual tanpa batas 10 karakter
ALTER TABLE customers
  ALTER COLUMN public_id TYPE VARCHAR(255);

COMMENT ON COLUMN customers.public_id IS 'Nomor/ID pelanggan unik (input manual)';
