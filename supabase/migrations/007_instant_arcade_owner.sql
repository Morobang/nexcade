set role postgres;

-- Instant arcade owner: creates arcade (inactive), promotes role immediately.
-- Platform admin review just flips is_active = true to make the arcade public.

-- Link arcade_applications to the created arcade
alter table public.arcade_applications
  add column if not exists arcade_id uuid references public.arcades(id) on delete cascade;

-- ── register_arcade_owner ─────────────────────────────────────────────────────
-- Called right after OTP verification (session now exists).
-- Creates the arcade as inactive, promotes the user to arcade_owner, and logs
-- the application for platform admin review.

create or replace function public.register_arcade_owner(
  p_arcade_name     text,
  p_city            text,
  p_city_lat        double precision default null,
  p_city_lng        double precision default null,
  p_address         text    default null,
  p_contact_email   text    default null,
  p_whatsapp_number text    default null,
  p_games_supported text[]  default '{}',
  p_description     text    default null,
  p_console_setup   text    default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid      uuid := auth.uid();
  v_slug     text;
  v_base     text;
  v_n        int := 0;
  v_arcade_id uuid;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  if exists (select 1 from public.arcade_applications where profile_id = v_uid and status = 'pending') then
    raise exception 'You already have a pending application';
  end if;

  -- Build unique slug
  v_base := trim(both '-' from lower(regexp_replace(p_arcade_name, '[^a-z0-9]+', '-', 'g')));
  v_slug  := v_base;
  while exists (select 1 from public.arcades where slug = v_slug) loop
    v_n    := v_n + 1;
    v_slug := v_base || '-' || v_n;
  end loop;

  -- Create arcade — inactive until approved
  insert into public.arcades (
    owner_id, name, slug, city, address,
    contact_email, whatsapp_number,
    games_supported, description, console_setup,
    is_active, latitude, longitude
  ) values (
    v_uid, p_arcade_name, v_slug, p_city, p_address,
    p_contact_email, p_whatsapp_number,
    p_games_supported, p_description, p_console_setup,
    false, p_city_lat, p_city_lng
  )
  returning id into v_arcade_id;

  -- Promote to arcade_owner immediately so they can access /admin
  update public.profiles set role = 'arcade_owner' where id = v_uid;

  -- Log application for platform admin review
  insert into public.arcade_applications (
    profile_id, arcade_id,
    arcade_name, city, city_lat, city_lng, address,
    contact_email, whatsapp_number, games_supported,
    description, console_setup, status
  ) values (
    v_uid, v_arcade_id,
    p_arcade_name, p_city, p_city_lat, p_city_lng, p_address,
    p_contact_email, p_whatsapp_number, p_games_supported,
    p_description, p_console_setup, 'pending'
  );

  return v_arcade_id;
end;
$$;

-- ── approve_arcade_application ────────────────────────────────────────────────
-- Arcade already exists — just make it visible to the public.

create or replace function public.approve_arcade_application(p_application_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_app public.arcade_applications%rowtype;
begin
  select * into v_app
  from public.arcade_applications
  where id = p_application_id and status = 'pending';

  if not found then
    raise exception 'Application not found or not pending';
  end if;

  update public.arcades set is_active = true where id = v_app.arcade_id;

  update public.arcade_applications
  set status = 'approved', reviewed_by = auth.uid(), reviewed_at = now()
  where id = p_application_id;
end;
$$;
