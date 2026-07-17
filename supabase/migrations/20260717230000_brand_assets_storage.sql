-- Public bucket for logos, headshots, and campaign banners used inside signatures.
-- Public READ is required: email clients fetch these images anonymously.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'brand-assets',
  'brand-assets',
  true,
  2097152, -- 2MB
  ARRAY['image/png','image/jpeg','image/webp','image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Anyone can view (signatures render in recipients' inboxes)
CREATE POLICY "brand_assets_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'brand-assets');

-- Only signed-in users can upload
CREATE POLICY "brand_assets_auth_insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'brand-assets');

-- Owners can replace / delete their own uploads
CREATE POLICY "brand_assets_owner_update"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'brand-assets' AND owner = auth.uid());

CREATE POLICY "brand_assets_owner_delete"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'brand-assets' AND owner = auth.uid());
