set role postgres;

-- Add lat/lng to arcade_applications so city selection can carry coordinates through to the arcade

alter table public.arcade_applications
  add column if not exists city_lat double precision,
  add column if not exists city_lng double precision;

-- Re-create approve function to also copy coordinates when creating the arcade
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

  v_base := trim(both '-' from lower(regexp_replace(v_app.arcade_name, '[^a-z0-9]+', '-', 'g')));
  v_slug := v_base;

  while exists (select 1 from public.arcades where slug = v_slug) loop
    v_n    := v_n + 1;
    v_slug := v_base || '-' || v_n;
  end loop;

  insert into public.arcades (
    owner_id, name, slug, city, address,
    contact_email, whatsapp_number,
    games_supported, description, is_active,
    latitude, longitude
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
    true,
    v_app.city_lat,
    v_app.city_lng
  );

  update public.profiles set role = 'arcade_owner' where id = v_app.profile_id;

  update public.arcade_applications
  set status = 'approved', reviewed_by = auth.uid(), reviewed_at = now()
  where id = p_application_id;
end;
$$;
