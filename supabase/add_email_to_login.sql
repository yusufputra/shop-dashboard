-- Kolom email opsional untuk login (unik jika diisi)
ALTER TABLE login ADD COLUMN IF NOT EXISTS email VARCHAR(255);

CREATE UNIQUE INDEX IF NOT EXISTS login_email_unique
  ON login (email)
  WHERE email IS NOT NULL AND email <> '';
