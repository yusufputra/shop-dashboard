-- Create the jewelry-images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('jewelry-images', 'jewelry-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes" ON storage.objects;

-- Policy 1: Allow anyone to read/view images (public access)
CREATE POLICY "Allow public read access"
ON storage.objects
FOR SELECT
USING (bucket_id = 'jewelry-images');

-- Policy 2: Allow authenticated users to upload images
CREATE POLICY "Allow authenticated uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'jewelry-images');

-- Policy 3: Allow authenticated users to update images
CREATE POLICY "Allow authenticated updates"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'jewelry-images')
WITH CHECK (bucket_id = 'jewelry-images');

-- Policy 4: Allow authenticated users to delete images
CREATE POLICY "Allow authenticated deletes"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'jewelry-images');

-- For development: Allow anonymous users to upload (REMOVE IN PRODUCTION!)
CREATE POLICY "Allow anon uploads for development"
ON storage.objects
FOR INSERT
TO anon
WITH CHECK (bucket_id = 'jewelry-images');

CREATE POLICY "Allow anon updates for development"
ON storage.objects
FOR UPDATE
TO anon
USING (bucket_id = 'jewelry-images')
WITH CHECK (bucket_id = 'jewelry-images');

CREATE POLICY "Allow anon deletes for development"
ON storage.objects
FOR DELETE
TO anon
USING (bucket_id = 'jewelry-images');
