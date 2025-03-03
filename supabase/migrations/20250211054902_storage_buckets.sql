/*
 * Copyright 2025 LLM-Play Contributors
 *
 * Migration Name: storage_buckets_setup
 * Description: Creates the necessary storage buckets and security policies for environment uploads
 * 
 * This migration:
 * 1. Creates a dedicated 'environments' bucket for environment file uploads
 * 2. Configures proper security policies to restrict read/write access
 * 3. Sets up public read-only access for all environment files
 *
 * Version: 1.0
 * Created: 2025-02-11
 */

-- Create environments bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'environments',
  'environments',
  true,
  10485760, -- 10MB limit
  ARRAY [
    'text/x-python',
    'application/x-python',
    'text/x-python-script',
    'application/javascript',
    'text/javascript',
    'application/json',
    'text/plain',
    'text/markdown',
    'application/x-yaml',
    'text/yaml'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY [
    'text/x-python',
    'application/x-python',
    'text/x-python-script',
    'application/javascript',
    'text/javascript',
    'application/json',
    'text/plain',
    'text/markdown',
    'application/x-yaml',
    'text/yaml'
  ];

COMMENT ON ROW storage.buckets WHERE id = 'environments' IS 
'Storage bucket for environment files uploaded by users. Contains code files, configuration files, and other assets needed for environments to function. All files are publicly readable but write access is restricted to authenticated users.';

-- Create bucket policy for READ access (public)
CREATE POLICY "Environment files are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'environments');

COMMENT ON POLICY "Environment files are publicly accessible" ON storage.objects IS
'Allows public read access to all files in the environments bucket. This is necessary so that environments can be downloaded and run by anyone.';

-- Create bucket policy for INSERT access (authenticated users only)
CREATE POLICY "Users can upload environment files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'environments'
  AND auth.uid() IS NOT NULL
);

COMMENT ON POLICY "Users can upload environment files" ON storage.objects IS
'Allows authenticated users to upload files to the environments bucket. This restricts file uploads to registered users only.';

-- Create bucket policy for UPDATE access (owner only)
CREATE POLICY "Users can update their own environment files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'environments'
  AND auth.uid() = owner
)
WITH CHECK (
  bucket_id = 'environments'
  AND auth.uid() = owner
);

COMMENT ON POLICY "Users can update their own environment files" ON storage.objects IS
'Allows users to update only their own files in the environments bucket.';

-- Create bucket policy for DELETE access (owner only)
CREATE POLICY "Users can delete their own environment files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'environments'
  AND auth.uid() = owner
);

COMMENT ON POLICY "Users can delete their own environment files" ON storage.objects IS
'Allows users to delete only their own files in the environments bucket.';

-- Create trigger function to set owner on upload
CREATE OR REPLACE FUNCTION storage.set_environment_file_owner()
RETURNS TRIGGER AS $$
BEGIN
  NEW.owner := auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION storage.set_environment_file_owner() IS
'Trigger function to automatically set the owner of an environment file to the current user. This ensures we have proper attribution for uploaded files.';

-- Create trigger to set owner on upload
DROP TRIGGER IF EXISTS set_environment_file_owner ON storage.objects;
CREATE TRIGGER set_environment_file_owner
BEFORE INSERT ON storage.objects
FOR EACH ROW
WHEN (NEW.bucket_id = 'environments')
EXECUTE FUNCTION storage.set_environment_file_owner();

COMMENT ON TRIGGER set_environment_file_owner ON storage.objects IS
'Trigger to automatically set the owner of an environment file to the current authenticated user.';