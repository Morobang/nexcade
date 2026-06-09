-- Run this if you already have the arcades table and need to add coordinates
ALTER TABLE public.arcades
  ADD COLUMN IF NOT EXISTS latitude float8,
  ADD COLUMN IF NOT EXISTS longitude float8;

-- Update demo arcades with SA coordinates
UPDATE public.arcades SET latitude = -33.9249, longitude = 18.4241 WHERE slug = 'rocket-arena';
UPDATE public.arcades SET latitude = -26.2041, longitude = 28.0473 WHERE slug = 'neon-rift';
