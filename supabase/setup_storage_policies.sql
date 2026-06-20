-- Bucket foto stok — public read untuk preview; upload/delete lewat API (service_role).
-- Jalankan setelah schema.sql pada instal baru, atau bagian dari revoke_anon_rls.sql untuk upgrade.

INSERT INTO storage.buckets (id, name, public)
VALUES ('jewelry-images', 'jewelry-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon uploads for development" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon updates for development" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon deletes for development" ON storage.objects;

-- Siapa saja boleh lihat gambar (URL public bucket)
CREATE POLICY "Allow public read access"
ON storage.objects
FOR SELECT
USING (bucket_id = 'jewelry-images');

-- INSERT / UPDATE / DELETE tidak dibuka ke anon/authenticated.
-- Server memakai SUPABASE_SERVICE_ROLE_KEY di /api/storage/upload dan /api/storage/remove.
