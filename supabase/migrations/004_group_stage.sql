-- Group assignments: which group each player is in for a group_ko tournament
create table if not exists group_assignments (
  id            uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references tournaments(id) on delete cascade,
  profile_id    uuid not null references profiles(id) on delete cascade,
  group_name    text not null,  -- 'A', 'B', 'C', ...
  created_at    timestamptz default now(),
  unique(tournament_id, profile_id)
);

-- Matches: per-game results within a tournament (group stage or knockout)
create table if not exists matches (
  id             uuid primary key default gen_random_uuid(),
  tournament_id  uuid not null references tournaments(id) on delete cascade,
  round_type     text not null default 'group' check (round_type in ('group', 'knockout')),
  group_name     text,           -- 'A', 'B', ... (null for knockout)
  player1_id     uuid not null references profiles(id),
  player2_id     uuid not null references profiles(id),
  player1_score  integer,
  player2_score  integer,
  winner_id      uuid references profiles(id),
  status         text not null default 'scheduled' check (status in ('scheduled', 'completed')),
  played_at      timestamptz,
  created_at     timestamptz default now()
);

-- RLS: public read, authenticated write
alter table group_assignments enable row level security;
create policy "ga_public_read"  on group_assignments for select using (true);
create policy "ga_auth_insert"  on group_assignments for insert with check (auth.role() = 'authenticated');
create policy "ga_auth_update"  on group_assignments for update using (auth.role() = 'authenticated');
create policy "ga_auth_delete"  on group_assignments for delete using (auth.role() = 'authenticated');

alter table matches enable row level security;
create policy "m_public_read"  on matches for select using (true);
create policy "m_auth_insert"  on matches for insert with check (auth.role() = 'authenticated');
create policy "m_auth_update"  on matches for update using (auth.role() = 'authenticated');
create policy "m_auth_delete"  on matches for delete using (auth.role() = 'authenticated');
