set role postgres;

-- Auto-update tournament status to 'full' when registrations hit max_players,
-- and back to 'open' if a registration is cancelled and spots free up.

create or replace function public.sync_tournament_capacity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tournament tournaments%rowtype;
  v_reg_count  int;
begin
  -- Work with the tournament affected by this registration change
  select * into v_tournament
  from public.tournaments
  where id = coalesce(NEW.tournament_id, OLD.tournament_id);

  if not found then
    return coalesce(NEW, OLD);
  end if;

  -- Only manage open/full status — don't touch live/completed/cancelled
  if v_tournament.status not in ('open', 'full') then
    return coalesce(NEW, OLD);
  end if;

  -- Count active (non-cancelled) registrations
  select count(*) into v_reg_count
  from public.registrations
  where tournament_id = v_tournament.id
    and registration_status != 'cancelled';

  if v_reg_count >= v_tournament.max_players and v_tournament.status = 'open' then
    update public.tournaments set status = 'full' where id = v_tournament.id;
  elsif v_reg_count < v_tournament.max_players and v_tournament.status = 'full' then
    update public.tournaments set status = 'open' where id = v_tournament.id;
  end if;

  return coalesce(NEW, OLD);
end;
$$;

create or replace trigger trg_tournament_capacity
  after insert or update of registration_status or delete
  on public.registrations
  for each row
  execute function public.sync_tournament_capacity();
