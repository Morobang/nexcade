-- Arcade applications — submitted by prospective arcade owners, reviewed by platform admin

create table if not exists public.arcade_applications (
  id            uuid primary key default gen_random_uuid(),
  profile_id    uuid not null references public.profiles(id) on delete cascade,
  arcade_name   text not null,
  city          text not null,
  address       text,
  contact_email text not null,
  whatsapp_number text,
  games_supported text[] not null default '{}',
  description   text,
  console_setup text,
  status        text not null default 'pending'
                  check (status in ('pending', 'approved', 'rejected')),
  rejection_reason text,
  reviewed_by   uuid references public.profiles(id),
  reviewed_at   timestamptz,
  created_at    timestamptz not null default now(),
  constraint one_application_per_user unique (profile_id)
);

alter table public.arcade_applications enable row level security;

-- Applicant can insert and view their own
create policy "Applications insert self" on public.arcade_applications
  for insert with check (auth.uid() = profile_id);

create policy "Applications select self" on public.arcade_applications
  for select using (auth.uid() = profile_id);

-- Platform admin can see and update all
create policy "Applications select admin" on public.arcade_applications
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'platform_admin')
  );

create policy "Applications update admin" on public.arcade_applications
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'platform_admin')
  );

-- ── Approve application ────────────────────────────────────────────────────────
-- Creates the arcade, promotes the user to arcade_owner, marks application approved.
-- SECURITY DEFINER so it bypasses RLS and runs as postgres.

create or replace function public.approve_arcade_application(p_application_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_app   public.arcade_applications%rowtype;
  v_slug  text;
  v_base  text;
  v_n     int := 0;
begin
  select * into v_app
  from public.arcade_applications
  where id = p_application_id and status = 'pending';

  if not found then
    raise exception 'Application not found or not pending';
  end if;

  -- Build a unique slug from the arcade name
  v_base := trim(both '-' from lower(regexp_replace(v_app.arcade_name, '[^a-z0-9]+', '-', 'g')));
  v_slug := v_base;

  while exists (select 1 from public.arcades where slug = v_slug) loop
    v_n    := v_n + 1;
    v_slug := v_base || '-' || v_n;
  end loop;

  -- Create the arcade
  insert into public.arcades (
    owner_id, name, slug, city, address,
    contact_email, whatsapp_number,
    games_supported, description, is_active
  ) values (
    v_app.profile_id,
    v_app.arcade_name,
    v_slug,
    v_app.city,
    v_app.address,
    v_app.contact_email,
    v_app.whatsapp_number,
    v_app.games_supported,
    v_app.description,
    true
  );

  -- Promote user to arcade_owner
  update public.profiles set role = 'arcade_owner' where id = v_app.profile_id;

  -- Mark approved
  update public.arcade_applications
  set status = 'approved', reviewed_by = auth.uid(), reviewed_at = now()
  where id = p_application_id;
end;
$$;

-- ── Reject application ─────────────────────────────────────────────────────────

create or replace function public.reject_arcade_application(
  p_application_id uuid,
  p_reason         text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.arcade_applications
  set
    status           = 'rejected',
    rejection_reason = p_reason,
    reviewed_by      = auth.uid(),
    reviewed_at      = now()
  where id = p_application_id and status = 'pending';
end;
$$;
