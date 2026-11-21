-- ============================================================================
-- VK Football Academy — Phase 2 migration (Parent portal, Matches, Fees,
-- Announcements, Player Development)
-- Run this in Supabase Dashboard → SQL Editor AFTER supabase/schema.sql.
-- It is safe to re-run: tables use IF NOT EXISTS, policies are dropped
-- and recreated, and demo inserts use ON CONFLICT DO NOTHING on fixed UUIDs.
--
-- New tables: parents, matches, fee_structures, fee_records,
--             announcements, player_reports
-- Role change: profiles.role widens from ('admin','coach') to
--              ('admin','coach','parent').
-- Parent visibility: parents see ONLY their own children's data, enforced
-- by RLS (never by hiding buttons). Coaches see their own teams' matches,
-- reports and fee context; admins see everything.
-- Security: NEVER put the service_role key in frontend code. The anon key
--           is safe to ship; these row-level security (RLS) policies are
--           what actually protect the data.
-- ============================================================================

-- --------------------------------------------------------------------------
-- 1. Widen profiles.role to include 'parent'
-- The original CHECK constraint is auto-named; find and drop it by name,
-- then add the widened constraint. Existing 'admin'/'coach' rows are
-- unaffected.
-- --------------------------------------------------------------------------
do $$
declare
  cname text;
begin
  select conname into cname
  from pg_constraint
  where conrelid = 'public.profiles'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) like '%role%';
  if cname is not null then
    execute format('alter table public.profiles drop constraint %I', cname);
  end if;
end $$;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('admin', 'coach', 'parent'));

-- --------------------------------------------------------------------------
-- 2. New tables
-- --------------------------------------------------------------------------

-- Links a parent login (profiles.id) to one of their children (players.id).
-- One parent can have many children; one child can have several linked
-- parents (e.g. both parents). The parent's name/email live on profiles.
create table if not exists public.parents (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.profiles (id) on delete cascade,
  player_id uuid not null references public.players (id) on delete cascade,
  relationship text,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (parent_id, player_id)
);

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  opponent text not null,
  match_date date not null,
  start_time time not null,
  venue text,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'completed', 'cancelled')),
  home_score integer check (home_score is null or home_score >= 0),
  away_score integer check (away_score is null or away_score >= 0),
  goals text,
  observations text,
  created_by uuid references public.profiles (id) on delete set null,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- A fee structure is one billable item, e.g. "Term Fee — U14" for ₹4,500
-- due on a date. Admins define structures; fee_records track who owes
-- what against each structure. No payment gateway: payments are recorded
-- manually by an admin (cash / UPI / bank transfer).
create table if not exists public.fee_structures (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  age_group text check (age_group in ('U12', 'U14', 'U16', 'U18')),
  amount numeric(10, 2) not null check (amount >= 0),
  due_date date,
  description text,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.fee_records (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players (id) on delete cascade,
  fee_structure_id uuid references public.fee_structures (id) on delete set null,
  amount_due numeric(10, 2) not null check (amount_due >= 0),
  amount_paid numeric(10, 2) not null default 0 check (amount_paid >= 0),
  payment_date date,
  payment_method text check (payment_method in ('cash', 'upi', 'bank_transfer', 'other')),
  receipt_no text,
  notes text,
  recorded_by uuid references public.profiles (id) on delete set null,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  audience text not null default 'all'
    check (audience in ('all', 'coaches', 'parents')),
  created_by uuid references public.profiles (id) on delete set null,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- A coach's assessment of one player on one date. Ratings are 1–10 per
-- area, stored as JSON so areas can grow without a schema change.
-- training_session_id links the report to the session it followed, when
-- the assessment was made right after a session.
create table if not exists public.player_reports (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players (id) on delete cascade,
  coach_id uuid references public.coaches (id) on delete set null,
  assessment_date date not null,
  training_session_id uuid references public.training_sessions (id) on delete set null,
  ratings jsonb not null default '{}'::jsonb,
  strengths text,
  weaknesses text,
  objectives text,
  recommendations text,
  areas_of_improvement text,
  areas_requiring_attention text,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- --------------------------------------------------------------------------
-- 3. Helper: the players linked to the signed-in parent.
-- Defined AFTER the parents table on purpose (LANGUAGE sql functions
-- validate their queries at creation time).
-- --------------------------------------------------------------------------
create or replace function public.my_player_ids()
returns setof uuid
language sql
stable
security definer
as $$
  select player_id from public.parents where parent_id = auth.uid();
$$;

-- --------------------------------------------------------------------------
-- 4. updated_at triggers
-- --------------------------------------------------------------------------
drop trigger if exists trg_parents_updated on public.parents;
create trigger trg_parents_updated before update on public.parents
  for each row execute function public.set_updated_at();
drop trigger if exists trg_matches_updated on public.matches;
create trigger trg_matches_updated before update on public.matches
  for each row execute function public.set_updated_at();
drop trigger if exists trg_fee_structures_updated on public.fee_structures;
create trigger trg_fee_structures_updated before update on public.fee_structures
  for each row execute function public.set_updated_at();
drop trigger if exists trg_fee_records_updated on public.fee_records;
create trigger trg_fee_records_updated before update on public.fee_records
  for each row execute function public.set_updated_at();
drop trigger if exists trg_announcements_updated on public.announcements;
create trigger trg_announcements_updated before update on public.announcements
  for each row execute function public.set_updated_at();
drop trigger if exists trg_player_reports_updated on public.player_reports;
create trigger trg_player_reports_updated before update on public.player_reports
  for each row execute function public.set_updated_at();

-- --------------------------------------------------------------------------
-- 5. Indexes
-- --------------------------------------------------------------------------
create index if not exists idx_parents_parent on public.parents (parent_id);
create index if not exists idx_parents_player on public.parents (player_id);
create index if not exists idx_matches_team_date on public.matches (team_id, match_date);
create index if not exists idx_fee_structures_age on public.fee_structures (age_group);
create index if not exists idx_fee_records_player on public.fee_records (player_id);
create index if not exists idx_fee_records_structure on public.fee_records (fee_structure_id);
create index if not exists idx_announcements_created on public.announcements (created_at desc);
create index if not exists idx_reports_player_date on public.player_reports (player_id, assessment_date desc);

-- --------------------------------------------------------------------------
-- 6. Row-level security — new tables
-- --------------------------------------------------------------------------
alter table public.parents enable row level security;
alter table public.matches enable row level security;
alter table public.fee_structures enable row level security;
alter table public.fee_records enable row level security;
alter table public.announcements enable row level security;
alter table public.player_reports enable row level security;

-- parents: admins manage all links; a parent sees only their own links.
drop policy if exists "parents_select_admin" on public.parents;
create policy "parents_select_admin" on public.parents
  for select to authenticated using (public.is_admin());
drop policy if exists "parents_select_own" on public.parents;
create policy "parents_select_own" on public.parents
  for select to authenticated using (parent_id = auth.uid());
drop policy if exists "parents_write_admin" on public.parents;
create policy "parents_write_admin" on public.parents
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- matches: admins see all; coaches see (and manage) their own teams'
-- matches; parents see only matches of teams their children play in.
-- Only admins can delete a match; coaches cancel it via status instead.
drop policy if exists "matches_select_admin" on public.matches;
create policy "matches_select_admin" on public.matches
  for select to authenticated using (public.is_admin());
drop policy if exists "matches_select_coach" on public.matches;
create policy "matches_select_coach" on public.matches
  for select to authenticated using (
    exists (
      select 1 from public.teams t
      where t.id = matches.team_id
        and t.coach_id = public.my_coach_id()
    )
  );
drop policy if exists "matches_select_parent" on public.matches;
create policy "matches_select_parent" on public.matches
  for select to authenticated using (
    exists (
      select 1 from public.team_players tp
      where tp.team_id = matches.team_id
        and tp.player_id in (select public.my_player_ids())
    )
  );
drop policy if exists "matches_insert" on public.matches;
create policy "matches_insert" on public.matches
  for insert to authenticated with check (
    public.is_admin() or exists (
      select 1 from public.teams t
      where t.id = matches.team_id
        and t.coach_id = public.my_coach_id()
    )
  );
drop policy if exists "matches_update" on public.matches;
create policy "matches_update" on public.matches
  for update to authenticated using (
    public.is_admin() or exists (
      select 1 from public.teams t
      where t.id = matches.team_id
        and t.coach_id = public.my_coach_id()
    )
  ) with check (
    public.is_admin() or exists (
      select 1 from public.teams t
      where t.id = matches.team_id
        and t.coach_id = public.my_coach_id()
    )
  );
drop policy if exists "matches_delete_admin" on public.matches;
create policy "matches_delete_admin" on public.matches
  for delete to authenticated using (public.is_admin());

-- fee_structures: readable by every signed-in role (parents need to see
-- what a fee is for; coaches see the fee context); writes are admin-only.
drop policy if exists "fee_structures_select" on public.fee_structures;
create policy "fee_structures_select" on public.fee_structures
  for select to authenticated using (true);
drop policy if exists "fee_structures_write_admin" on public.fee_structures;
create policy "fee_structures_write_admin" on public.fee_structures
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- fee_records: admins manage all; coaches see records for players in
-- their own teams; parents see only their own children's records.
drop policy if exists "fee_records_select_admin" on public.fee_records;
create policy "fee_records_select_admin" on public.fee_records
  for select to authenticated using (public.is_admin());
drop policy if exists "fee_records_select_coach" on public.fee_records;
create policy "fee_records_select_coach" on public.fee_records
  for select to authenticated using (
    exists (
      select 1 from public.team_players tp
      join public.teams t on t.id = tp.team_id
      where tp.player_id = fee_records.player_id
        and t.coach_id = public.my_coach_id()
    )
  );
drop policy if exists "fee_records_select_parent" on public.fee_records;
create policy "fee_records_select_parent" on public.fee_records
  for select to authenticated using (
    fee_records.player_id in (select public.my_player_ids())
  );
drop policy if exists "fee_records_write_admin" on public.fee_records;
create policy "fee_records_write_admin" on public.fee_records
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- announcements: admins manage all; coaches see 'all' + 'coaches';
-- parents see 'all' + 'parents'.
drop policy if exists "announcements_select_admin" on public.announcements;
create policy "announcements_select_admin" on public.announcements
  for select to authenticated using (public.is_admin());
drop policy if exists "announcements_select_coach" on public.announcements;
create policy "announcements_select_coach" on public.announcements
  for select to authenticated using (audience in ('all', 'coaches'));
drop policy if exists "announcements_select_parent" on public.announcements;
create policy "announcements_select_parent" on public.announcements
  for select to authenticated using (audience in ('all', 'parents'));
drop policy if exists "announcements_write_admin" on public.announcements;
create policy "announcements_write_admin" on public.announcements
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- player_reports: admins see all; coaches see (and write) reports for
-- players in their own teams; parents see only their own children's
-- reports. Only admins can delete a report.
drop policy if exists "reports_select_admin" on public.player_reports;
create policy "reports_select_admin" on public.player_reports
  for select to authenticated using (public.is_admin());
drop policy if exists "reports_select_coach" on public.player_reports;
create policy "reports_select_coach" on public.player_reports
  for select to authenticated using (
    exists (
      select 1 from public.team_players tp
      join public.teams t on t.id = tp.team_id
      where tp.player_id = player_reports.player_id
        and t.coach_id = public.my_coach_id()
    )
  );
drop policy if exists "reports_select_parent" on public.player_reports;
create policy "reports_select_parent" on public.player_reports
  for select to authenticated using (
    player_reports.player_id in (select public.my_player_ids())
  );
drop policy if exists "reports_insert" on public.player_reports;
create policy "reports_insert" on public.player_reports
  for insert to authenticated with check (
    public.is_admin() or exists (
      select 1 from public.team_players tp
      join public.teams t on t.id = tp.team_id
      where tp.player_id = player_reports.player_id
        and t.coach_id = public.my_coach_id()
    )
  );
drop policy if exists "reports_update" on public.player_reports;
create policy "reports_update" on public.player_reports
  for update to authenticated using (
    public.is_admin() or player_reports.coach_id = public.my_coach_id()
  ) with check (
    public.is_admin() or player_reports.coach_id = public.my_coach_id()
  );
drop policy if exists "reports_delete_admin" on public.player_reports;
create policy "reports_delete_admin" on public.player_reports
  for delete to authenticated using (public.is_admin());

-- --------------------------------------------------------------------------
-- 7. Row-level security — parent visibility on EXISTING tables.
-- Parents see only their own children, their children's teams, sessions
-- and attendance. They do NOT get session_plans or session_observations
-- (those are coach tools, not part of the parent portal).
-- --------------------------------------------------------------------------
drop policy if exists "players_select_parent" on public.players;
create policy "players_select_parent" on public.players
  for select to authenticated using (
    players.id in (select public.my_player_ids())
  );

drop policy if exists "team_players_select_parent" on public.team_players;
create policy "team_players_select_parent" on public.team_players
  for select to authenticated using (
    team_players.player_id in (select public.my_player_ids())
  );

drop policy if exists "teams_select_parent" on public.teams;
create policy "teams_select_parent" on public.teams
  for select to authenticated using (
    exists (
      select 1 from public.team_players tp
      where tp.team_id = teams.id
        and tp.player_id in (select public.my_player_ids())
    )
  );

drop policy if exists "sessions_select_parent" on public.training_sessions;
create policy "sessions_select_parent" on public.training_sessions
  for select to authenticated using (
    exists (
      select 1 from public.team_players tp
      where tp.team_id = training_sessions.team_id
        and tp.player_id in (select public.my_player_ids())
    )
  );

drop policy if exists "attendance_select_parent" on public.attendance;
create policy "attendance_select_parent" on public.attendance
  for select to authenticated using (
    attendance.player_id in (select public.my_player_ids())
  );

-- --------------------------------------------------------------------------
-- 8. Demo seed additions (OPTIONAL — clearly-marked demo data only)
-- Uses the demo teams/players/coach/session from seed.sql, so run this
-- AFTER seed.sql. Every row is prefixed "Demo —" and has is_demo = true.
-- Safe to re-run: inserts use ON CONFLICT DO NOTHING on fixed UUIDs.
--
-- To remove all Phase 2 demo data later, run:
--   delete from public.player_reports where is_demo = true;
--   delete from public.announcements where is_demo = true;
--   delete from public.fee_records where is_demo = true;
--   delete from public.fee_structures where is_demo = true;
--   delete from public.matches where is_demo = true;
--   delete from public.parents where is_demo = true;
-- --------------------------------------------------------------------------

-- Demo fee structure + a part-paid record for Demo — Aarav (U14).
insert into public.fee_structures (id, name, age_group, amount, due_date, description, is_demo)
values (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Demo — Term Fee (U14)',
  'U14',
  4500.00,
  CURRENT_DATE + 30,
  'Sample term fee for the demo U14 team.',
  true
)
on conflict (id) do nothing;

insert into public.fee_records (id, player_id, fee_structure_id, amount_due, amount_paid, payment_date, payment_method, receipt_no, notes, is_demo)
values (
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  '44444444-4444-4444-4444-444444444441',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  4500.00,
  2000.00,
  CURRENT_DATE - 5,
  'upi',
  'DEMO-R-001',
  'Sample part-payment.',
  true
)
on conflict (id) do nothing;

-- Demo matches for the demo U14 team: one played, one coming up.
insert into public.matches (id, team_id, opponent, match_date, start_time, venue, status, home_score, away_score, goals, observations, is_demo)
values
  (
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    '22222222-2222-2222-2222-222222222222',
    'Demo — Reliance Young Champs',
    CURRENT_DATE - 3,
    '17:00',
    'Urban Turf',
    'completed',
    3,
    1,
    'Demo — Kabir 2, Demo — Arjun 1',
    'Sample completed match.',
    true
  ),
  (
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    '22222222-2222-2222-2222-222222222222',
    'Demo — Thane FC',
    CURRENT_DATE + 6,
    '18:00',
    'Urban Turf',
    'scheduled',
    null,
    null,
    null,
    null,
    true
  )
on conflict (id) do nothing;

-- Demo announcement, visible to everyone.
insert into public.announcements (id, title, body, audience, is_demo)
values (
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
  'Demo — Trials for U12 batch',
  'Sample announcement: the academy will hold open trials for the U12 batch next month. Details will be shared with coaches and parents.',
  'all',
  true
)
on conflict (id) do nothing;

-- Demo player report for Demo — Aarav, linked to the completed demo session.
insert into public.player_reports (id, player_id, coach_id, assessment_date, training_session_id, ratings, strengths, weaknesses, objectives, recommendations, areas_of_improvement, areas_requiring_attention, is_demo)
values (
  'ffffffff-ffff-ffff-ffff-ffffffffffff',
  '44444444-4444-4444-4444-444444444441',
  '11111111-1111-1111-1111-111111111111',
  CURRENT_DATE - 7,
  '66666666-6666-6666-6666-666666666666',
  '{"technical": 7, "tactical": 6, "physical": 7, "psychological": 6, "attitude": 8, "overall": 7}'::jsonb,
  'Sample strengths: first touch and scanning.',
  'Sample weakness: tracking back after losing the ball.',
  'Sample objective: scan before receiving in the next four sessions.',
  'Sample recommendation: extra 1v1 defending work on Tuesdays.',
  'Sample: receiving on the half-turn under pressure.',
  'Sample: none flagged in this assessment.',
  true
)
on conflict (id) do nothing;

-- --------------------------------------------------------------------------
-- Grants: RLS policies alone do NOT give the app roles any table access.
-- Postgres also requires explicit GRANTs — without them every query from
-- the app fails with 42501 "permission denied for table ...". (The Phase 1
-- tables hit exactly this on 22 Nov 2026; fixed by adding the same grants
-- to schema.sql.) RLS still governs what each role can see/change.
-- --------------------------------------------------------------------------
grant select on all tables in schema public to anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;
