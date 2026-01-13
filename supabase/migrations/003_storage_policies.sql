-- Create the mind_maps_images bucket if it doesn't exist, and ensure it's public
INSERT INTO storage.buckets (id, name, public)
VALUES ('mind_maps_images', 'mind_maps_images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing policies to ensure clean state
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own images" ON storage.objects;

-- Policy to allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'mind_maps_images' AND auth.role() = 'authenticated' );

-- Policy to allow anyone to view images (since it's a public bucket)
CREATE POLICY "Anyone can view images"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'mind_maps_images' );

-- Policy to allow users to update their own images
CREATE POLICY "Users can update own images"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'mind_maps_images' AND auth.uid() = owner );

-- Policy to allow users to delete their own images
CREATE POLICY "Users can delete own images"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'mind_maps_images' AND auth.uid() = owner );
