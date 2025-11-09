# Supabase Storage Setup for Jewelry Images

## Steps to create the storage bucket:

1. Go to your Supabase Dashboard
2. Navigate to **Storage** in the sidebar
3. Click **Create a new bucket**
4. Fill in the details:
   - **Name**: `jewelry-images`
   - **Public bucket**: ✅ Yes (check this to make images publicly accessible)
   - **File size limit**: 5 MB (recommended)
   - **Allowed MIME types**: `image/*`

5. Click **Create bucket**

## Storage Policies (RLS)

After creating the bucket, you need to set up storage policies to allow uploads and public access.

### Policy 1: Allow authenticated users to upload
```sql
CREATE POLICY "Allow authenticated uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'jewelry-images');
```

### Policy 2: Allow public read access
```sql
CREATE POLICY "Allow public read"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'jewelry-images');
```

### Policy 3: Allow authenticated users to delete their uploads
```sql
CREATE POLICY "Allow authenticated delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'jewelry-images');
```

## Alternative: Using Supabase SQL Editor

You can also run this complete setup script in the Supabase SQL Editor:

```sql
-- Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('jewelry-images', 'jewelry-images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up policies
CREATE POLICY IF NOT EXISTS "Allow authenticated uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'jewelry-images');

CREATE POLICY IF NOT EXISTS "Allow public read"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'jewelry-images');

CREATE POLICY IF NOT EXISTS "Allow authenticated delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'jewelry-images');
```

## Testing

After setup, test by:
1. Navigate to `/dashboard/inventory/new`
2. Upload an image
3. Check that the image preview appears
4. Submit the form
5. Verify the image URL is stored in the database
