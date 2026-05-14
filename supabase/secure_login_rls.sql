-- Kredensial di tabel `login` tidak boleh dibaca/diubah dari browser (anon key).
-- Hanya server dengan SUPABASE_DATABASE_SERVICE_ROLE / service_role yang bisa mengakses.

ALTER TABLE login ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access" ON login;
DROP POLICY IF EXISTS "Allow public insert" ON login;
DROP POLICY IF EXISTS "Allow public update" ON login;
DROP POLICY IF EXISTS "Allow public delete" ON login;

-- Tanpa policy untuk role authenticated/anon: client anon tidak bisa SELECT hash password.
-- Service role tetap bypass RLS.
