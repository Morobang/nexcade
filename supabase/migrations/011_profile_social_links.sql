-- Add social/bio fields to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS website_url    text,
  ADD COLUMN IF NOT EXISTS twitter_handle text,
  ADD COLUMN IF NOT EXISTS instagram_handle text,
  ADD COLUMN IF NOT EXISTS tiktok_handle  text,
  ADD COLUMN IF NOT EXISTS youtube_handle text;
