set role postgres;

-- ── avatars bucket ────────────────────────────────────────────────────────────
-- Stores player profile pictures. Path: {user_id}.{ext}

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152,  -- 2 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Public read
CREATE POLICY "avatars: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Authenticated user can upload / overwrite their own avatar
-- File path is {user_id}.{ext}, so split on '.' gives the user_id
CREATE POLICY "avatars: owner insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = split_part(name, '.', 1)
  );

CREATE POLICY "avatars: owner update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = split_part(name, '.', 1)
  );

CREATE POLICY "avatars: owner delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = split_part(name, '.', 1)
  );

-- ── arcade-assets bucket ──────────────────────────────────────────────────────
-- Stores arcade logos and cover photos.
-- Paths: logos/{arcade_id}.{ext}  /  covers/{arcade_id}.{ext}

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'arcade-assets',
  'arcade-assets',
  true,
  5242880,  -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Public read
CREATE POLICY "arcade-assets: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'arcade-assets');

-- Only the arcade's owner may upload into logos/ or covers/
-- Path is e.g. logos/{arcade_id}.jpg → arcade_id = split_part(split_part(name,'/',2),'.',1)
CREATE POLICY "arcade-assets: owner insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'arcade-assets'
    AND auth.uid() IN (
      SELECT owner_id FROM public.arcades
      WHERE id::text = split_part(split_part(name, '/', 2), '.', 1)
    )
  );

CREATE POLICY "arcade-assets: owner update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'arcade-assets'
    AND auth.uid() IN (
      SELECT owner_id FROM public.arcades
      WHERE id::text = split_part(split_part(name, '/', 2), '.', 1)
    )
  );

CREATE POLICY "arcade-assets: owner delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'arcade-assets'
    AND auth.uid() IN (
      SELECT owner_id FROM public.arcades
      WHERE id::text = split_part(split_part(name, '/', 2), '.', 1)
    )
  );
