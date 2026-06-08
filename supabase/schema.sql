-- NexCade database schema
-- Tables: arcades, profiles, tournaments, registrations, results, season_points, arcade_sponsors, news_posts
-- Enums and RLS policies included for Supabase.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Game and tournament enums
CREATE TYPE public.game_type AS ENUM (
  'FC26',
  'Tekken8',
  'SF6',
  'MK1',
  'KOFXV',
  'Naruto'
);

CREATE TYPE public.tournament_format AS ENUM (
  'group_ko',
  'league',
  'knockout'
);

CREATE TYPE public.tournament_status AS ENUM (
  'open',
  'full',
  'live',
  'completed',
  'cancelled'
);

CREATE TYPE public.registration_status AS ENUM (
  'registered',
  'paid',
  'checked_in',
  'cancelled'
);

CREATE TYPE public.user_role AS ENUM (
  'player',
  'arcade_owner',
  'platform_admin'
);

CREATE TYPE public.payment_status AS ENUM (
  'pending',
  'paid',
  'refunded'
);

-- Profiles table for players and arcade owners
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  gamer_tag text NOT NULL UNIQUE,
  email text NOT NULL UNIQUE,
  role public.user_role NOT NULL DEFAULT 'player',
  phone text,
  psn_id text,
  home_arcade_id uuid,
  avatar_url text,
  bio text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Arcades table
CREATE TABLE public.arcades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  city text NOT NULL,
  address text,
  description text,
  contact_email text,
  whatsapp_number text,
  logo_url text,
  cover_url text,
  games_supported text[] NOT NULL DEFAULT ARRAY[]::text[],
  console_setup text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_home_arcade_fkey FOREIGN KEY (home_arcade_id)
  REFERENCES public.arcades(id) ON DELETE SET NULL;

-- Tournaments table
CREATE TABLE public.tournaments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  arcade_id uuid NOT NULL REFERENCES public.arcades(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  game_type public.game_type NOT NULL,
  format public.tournament_format NOT NULL,
  status public.tournament_status NOT NULL DEFAULT 'open',
  is_qualifier boolean NOT NULL DEFAULT false,
  description text,
  rules text,
  start_at timestamptz NOT NULL,
  end_at timestamptz,
  entry_fee numeric(10,2) NOT NULL DEFAULT 0,
  prize_pool numeric(10,2) NOT NULL DEFAULT 0,
  max_players int NOT NULL DEFAULT 16,
  is_streamed boolean NOT NULL DEFAULT false,
  stream_url text,
  venue text,
  registration_deadline timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Registrations table
CREATE TABLE public.registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  registration_status public.registration_status NOT NULL DEFAULT 'registered',
  payment_status public.payment_status NOT NULL DEFAULT 'pending',
  booking_ref text NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  team_name text,
  team_type text,
  character_1 text,
  character_2 text,
  character_3 text,
  support_character text,
  rules_agreed boolean NOT NULL DEFAULT false,
  registered_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz,
  checked_in_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Results table
CREATE TABLE public.results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  placement int NOT NULL,
  is_winner boolean NOT NULL DEFAULT false,
  points_awarded int NOT NULL DEFAULT 0,
  result_data jsonb,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Season points table
CREATE TABLE public.season_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  season text NOT NULL,
  points int NOT NULL DEFAULT 0,
  is_season_champion boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Arcade sponsors table
CREATE TABLE public.arcade_sponsors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  arcade_id uuid NOT NULL REFERENCES public.arcades(id) ON DELETE CASCADE,
  sponsor_name text NOT NULL,
  sponsor_logo_url text,
  website_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- News posts table
CREATE TABLE public.news_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  excerpt text,
  content text NOT NULL,
  category text,
  cover_image_url text,
  author_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  published_at timestamptz,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles public select" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Profiles insert self" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Profiles update self" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Profiles delete self" ON public.profiles FOR DELETE USING (auth.uid() = id);

ALTER TABLE public.arcades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Arcades public select" ON public.arcades FOR SELECT USING (true);
CREATE POLICY "Arcades insert owners" ON public.arcades FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND
  auth.uid() = owner_id
);
CREATE POLICY "Arcades update owner" ON public.arcades FOR UPDATE USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Arcades delete owner" ON public.arcades FOR DELETE USING (auth.uid() = owner_id);

ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tournaments public select" ON public.tournaments FOR SELECT USING (true);
CREATE POLICY "Tournaments insert arcade owner" ON public.tournaments FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM public.arcades WHERE id = arcade_id AND owner_id = auth.uid()
  )
);
CREATE POLICY "Tournaments update arcade owner" ON public.tournaments FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.arcades WHERE id = arcade_id AND owner_id = auth.uid()
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.arcades WHERE id = arcade_id AND owner_id = auth.uid()
  )
);
CREATE POLICY "Tournaments delete arcade owner" ON public.tournaments FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.arcades WHERE id = arcade_id AND owner_id = auth.uid()
  )
);

ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Registrations public select" ON public.registrations FOR SELECT USING (true);
CREATE POLICY "Registrations insert self" ON public.registrations FOR INSERT WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "Registrations update owner" ON public.registrations FOR UPDATE USING (
  auth.uid() = profile_id
) WITH CHECK (
  auth.uid() = profile_id
);
CREATE POLICY "Registrations delete owner" ON public.registrations FOR DELETE USING (auth.uid() = profile_id);

ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Results public select" ON public.results FOR SELECT USING (true);
CREATE POLICY "Results insert admins" ON public.results FOR INSERT WITH CHECK (
  auth.role() = 'authenticated'
);
CREATE POLICY "Results update admins" ON public.results FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Results delete admins" ON public.results FOR DELETE USING (auth.role() = 'authenticated');

ALTER TABLE public.season_points ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Season points public select" ON public.season_points FOR SELECT USING (true);
CREATE POLICY "Season points insert admins" ON public.season_points FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Season points update admins" ON public.season_points FOR UPDATE USING (auth.role() = 'authenticated');

ALTER TABLE public.arcade_sponsors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Sponsors public select" ON public.arcade_sponsors FOR SELECT USING (true);
CREATE POLICY "Sponsors insert arcade owner" ON public.arcade_sponsors FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.arcades WHERE id = arcade_id AND owner_id = auth.uid()
  )
);
CREATE POLICY "Sponsors update arcade owner" ON public.arcade_sponsors FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.arcades WHERE id = arcade_id AND owner_id = auth.uid()
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.arcades WHERE id = arcade_id AND owner_id = auth.uid()
  )
);
CREATE POLICY "Sponsors delete arcade owner" ON public.arcade_sponsors FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.arcades WHERE id = arcade_id AND owner_id = auth.uid()
  )
);

ALTER TABLE public.news_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "News public select" ON public.news_posts FOR SELECT USING (is_published OR auth.role() = 'authenticated');
CREATE POLICY "News insert admins" ON public.news_posts FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "News update admins" ON public.news_posts FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "News delete admins" ON public.news_posts FOR DELETE USING (auth.role() = 'authenticated');

