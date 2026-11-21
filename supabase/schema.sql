-- ============================================================================
-- VK Football Academy — Supabase schema
-- Run this in Supabase Dashboard → SQL Editor (whole file, in order).
-- It is safe to re-run: tables use IF NOT EXISTS and policies are dropped
-- and recreated.
--
-- Tables: profiles, coaches, teams, players, team_players,
--          training_sessions, session_plans, attendance, session_observations
-- Storage: private bucket "session-plans" (files are never public).
-- Auth: a trigger creates a profiles row for every new auth user.
--        Set the role in the user's metadata when creating them
--        ({"role": "admin"} for the admin, otherwise "coach" is the default).
-- Security: NEVER put the service_role key in frontend code. The anon key
--           is safe to ship; these row-level security (RLS) policies are
--           what actually protect the data.
-- ============================================================================

-- --------------------------------------------------------------------------
-- Tables
-- --------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'coach' check (role in ('admin', 'coach')),
  created_at timestamptz not null default now()
);

create table if not exists public.coaches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references public.profiles (id) on delete set null,
  full_name text not null,
  email text,
  phone text,
  licence text,
  bio text,
  is_active boolean not null default true,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  age_group text not null check (age_group in ('U12', 'U14', 'U16', 'U18')),
  coach_id uuid references public.coaches (id) on delete set null,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  date_of_birth date,
  age_group text check (age_group in ('U12', 'U14', 'U16', 'U18')),
  position text,
  parent_name text,
  parent_phone text,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.team_players (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  player_id uuid not null references public.players (id) on delete cascade,
  joined_at timestamptz not null default now(),
  unique (team_id, player_id)
);

create table if not exists public.training_sessions (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  title text,
  session_date date not null,
  start_time time not null,
  duration_minutes integer not null default 90 check (duration_minutes between 15 and 300),
  pitch text,
  category text not null default 'Technical'
    check (category in ('Technical', 'Tactical', 'Physical', 'Goalkeeping', 'Other')),
  objectives text,
  description text,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'completed', 'cancelled')),
  created_by uuid references public.profiles (id) on delete set null,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.session_plans (
  id uuid primary key default gen_random_uuid(),
  training_session_id uuid not null references public.training_sessions (id) on delete cascade,
  coach_id uuid references public.coaches (id) on delete set null,
  team_id uuid references public.teams (id) on delete set null,
  title text not null,
  description text,
  -- Structured plan sections (only filled-in sections are stored):
  -- objectives, warm_up, technical_drills, tactical_activities,
  -- small_sided_games, physical_conditioning, cool_down, equipment,
  -- coaching_points, post_session_observations
  content jsonb not null default '{}'::jsonb,
  file_name text,
  file_path text,
  file_type text,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  training_session_id uuid not null references public.training_sessions (id) on delete cascade,
  player_id uuid not null references public.players (id) on delete cascade,
  status text not null check (status in ('present', 'absent', 'late', 'excused')),
  marked_by uuid references public.profiles (id) on delete set null,
  marked_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  is_demo boolean not null default false,
  unique (training_session_id, player_id)
);

create table if not exists public.session_observations (
  id uuid primary key default gen_random_uuid(),
  training_session_id uuid not null references public.training_sessions (id) on delete cascade,
  coach_id uuid references public.coaches (id) on delete set null,
  observation text not null,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

-- --------------------------------------------------------------------------
-- Helpers
-- NOTE: defined AFTER the tables on purpose. LANGUAGE sql functions have
-- their queries validated at creation time, and is_admin()/my_coach_id()
-- reference public.profiles / public.coaches, so those tables must exist
-- first or creation fails with "relation does not exist".
-- --------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- The coach record linked to the signed-in user (null for admins / unlinked).
create or replace function public.my_coach_id()
returns uuid
language sql
stable
security definer
as $$
  select id from public.coaches where user_id = auth.uid() limit 1;
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- --------------------------------------------------------------------------
-- Indexes
-- --------------------------------------------------------------------------
create index if not exists idx_team_players_team on public.team_players (team_id);
create index if not exists idx_team_players_player on public.team_players (player_id);
create index if not exists idx_sessions_team_date on public.training_sessions (team_id, session_date);
create index if not exists idx_plans_session on public.session_plans (training_session_id);
create index if not exists idx_plans_team on public.session_plans (team_id);
create index if not exists idx_attendance_session on public.attendance (training_session_id);
create index if not exists idx_attendance_player on public.attendance (player_id);
create index if not exists idx_observations_session on public.session_observations (training_session_id);

-- --------------------------------------------------------------------------
-- updated_at triggers
-- --------------------------------------------------------------------------
drop trigger if exists trg_coaches_updated on public.coaches;
create trigger trg_coaches_updated before update on public.coaches
  for each row execute function public.set_updated_at();
drop trigger if exists trg_teams_updated on public.teams;
create trigger trg_teams_updated before update on public.teams
  for each row execute function public.set_updated_at();
drop trigger if exists trg_players_updated on public.players;
create trigger trg_players_updated before update on public.players
  for each row execute function public.set_updated_at();
drop trigger if exists trg_sessions_updated on public.training_sessions;
create trigger trg_sessions_updated before update on public.training_sessions
  for each row execute function public.set_updated_at();
drop trigger if exists trg_plans_updated on public.session_plans;
create trigger trg_plans_updated before update on public.session_plans
  for each row execute function public.set_updated_at();
drop trigger if exists trg_attendance_updated on public.attendance;
create trigger trg_attendance_updated before update on public.attendance
  for each row execute function public.set_updated_at();

-- --------------------------------------------------------------------------
-- Auth trigger: create a profiles row for every new auth user.
-- Role comes from the user's metadata ("admin" or "coach", default "coach").
-- Create users in Dashboard → Authentication → Add user, with User Metadata:
--   {"role": "admin", "full_name": "Vaibhav Karpe"}   (admin example)
--   {"role": "coach", "full_name": "Dhyeya Tiwari"}   (coach example)
-- --------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    nullif(coalesce(new.raw_user_meta_data ->> 'full_name', ''), ''),
    coalesce(nullif(new.raw_user_meta_data ->> 'role', ''), 'coach')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- --------------------------------------------------------------------------
-- Row-level security
-- --------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.coaches enable row level security;
alter table public.teams enable row level security;
alter table public.players enable row level security;
alter table public.team_players enable row level security;
alter table public.training_sessions enable row level security;
alter table public.session_plans enable row level security;
alter table public.attendance enable row level security;
alter table public.session_observations enable row level security;

-- profiles: a user sees their own row; admins see all; admins can change roles.
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select to authenticated using (id = auth.uid());
drop policy if exists "profiles_select_admin" on public.profiles;
create policy "profiles_select_admin" on public.profiles
  for select to authenticated using (public.is_admin());
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated using (id = auth.uid());
drop policy if exists "profiles_update_admin" on public.profiles;
create policy "profiles_update_admin" on public.profiles
  for update to authenticated using (public.is_admin());

-- coaches: readable by any signed-in user (directory); writes are admin-only.
drop policy if exists "coaches_select" on public.coaches;
create policy "coaches_select" on public.coaches
  for select to authenticated using (true);
drop policy if exists "coaches_write_admin" on public.coaches;
create policy "coaches_write_admin" on public.coaches
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- teams: readable by any signed-in user; writes are admin-only.
drop policy if exists "teams_select" on public.teams;
create policy "teams_select" on public.teams
  for select to authenticated using (true);
drop policy if exists "teams_write_admin" on public.teams;
create policy "teams_write_admin" on public.teams
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- players: admins see all; coaches see only players in their own teams.
drop policy if exists "players_select_admin" on public.players;
create policy "players_select_admin" on public.players
  for select to authenticated using (public.is_admin());
drop policy if exists "players_select_coach" on public.players;
create policy "players_select_coach" on public.players
  for select to authenticated using (
    exists (
      select 1 from public.team_players tp
      join public.teams t on t.id = tp.team_id
      where tp.player_id = players.id
        and t.coach_id = public.my_coach_id()
    )
  );
drop policy if exists "players_write_admin" on public.players;
create policy "players_write_admin" on public.players
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- team_players: admins see all; coaches see their own teams' rosters.
drop policy if exists "team_players_select_admin" on public.team_players;
create policy "team_players_select_admin" on public.team_players
  for select to authenticated using (public.is_admin());
drop policy if exists "team_players_select_coach" on public.team_players;
create policy "team_players_select_coach" on public.team_players
  for select to authenticated using (
    exists (
      select 1 from public.teams t
      where t.id = team_players.team_id
        and t.coach_id = public.my_coach_id()
    )
  );
drop policy if exists "team_players_write_admin" on public.team_players;
create policy "team_players_write_admin" on public.team_players
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- training_sessions: admins see all; coaches see (and manage) their own teams' sessions.
drop policy if exists "sessions_select_admin" on public.training_sessions;
create policy "sessions_select_admin" on public.training_sessions
  for select to authenticated using (public.is_admin());
drop policy if exists "sessions_select_coach" on public.training_sessions;
create policy "sessions_select_coach" on public.training_sessions
  for select to authenticated using (
    exists (
      select 1 from public.teams t
      where t.id = training_sessions.team_id
        and t.coach_id = public.my_coach_id()
    )
  );
drop policy if exists "sessions_write" on public.training_sessions;
create policy "sessions_write" on public.training_sessions
  for all to authenticated using (
    public.is_admin() or exists (
      select 1 from public.teams t
      where t.id = training_sessions.team_id
        and t.coach_id = public.my_coach_id()
    )
  ) with check (
    public.is_admin() or exists (
      select 1 from public.teams t
      where t.id = training_sessions.team_id
        and t.coach_id = public.my_coach_id()
    )
  );

-- session_plans: admins see all; coaches see (and manage) their own teams' plans.
drop policy if exists "plans_select_admin" on public.session_plans;
create policy "plans_select_admin" on public.session_plans
  for select to authenticated using (public.is_admin());
drop policy if exists "plans_select_coach" on public.session_plans;
create policy "plans_select_coach" on public.session_plans
  for select to authenticated using (
    exists (
      select 1 from public.teams t
      where t.id = session_plans.team_id
        and t.coach_id = public.my_coach_id()
    )
  );
drop policy if exists "plans_write" on public.session_plans;
create policy "plans_write" on public.session_plans
  for all to authenticated using (
    public.is_admin() or exists (
      select 1 from public.teams t
      where t.id = session_plans.team_id
        and t.coach_id = public.my_coach_id()
    )
  ) with check (
    public.is_admin() or exists (
      select 1 from public.teams t
      where t.id = session_plans.team_id
        and t.coach_id = public.my_coach_id()
    )
  );

-- attendance: admins see all; coaches see (and mark) their own teams' sessions.
drop policy if exists "attendance_select_admin" on public.attendance;
create policy "attendance_select_admin" on public.attendance
  for select to authenticated using (public.is_admin());
drop policy if exists "attendance_select_coach" on public.attendance;
create policy "attendance_select_coach" on public.attendance
  for select to authenticated using (
    exists (
      select 1 from public.training_sessions s
      join public.teams t on t.id = s.team_id
      where s.id = attendance.training_session_id
        and t.coach_id = public.my_coach_id()
    )
  );
drop policy if exists "attendance_write" on public.attendance;
create policy "attendance_write" on public.attendance
  for all to authenticated using (
    public.is_admin() or exists (
      select 1 from public.training_sessions s
      join public.teams t on t.id = s.team_id
      where s.id = attendance.training_session_id
        and t.coach_id = public.my_coach_id()
    )
  ) with check (
    public.is_admin() or exists (
      select 1 from public.training_sessions s
      join public.teams t on t.id = s.team_id
      where s.id = attendance.training_session_id
        and t.coach_id = public.my_coach_id()
    )
  );

-- session_observations: admins see all; coaches see their own teams'; coaches
-- can add observations for their own teams; only admins can edit/delete them.
drop policy if exists "observations_select_admin" on public.session_observations;
create policy "observations_select_admin" on public.session_observations
  for select to authenticated using (public.is_admin());
drop policy if exists "observations_select_coach" on public.session_observations;
create policy "observations_select_coach" on public.session_observations
  for select to authenticated using (
    exists (
      select 1 from public.training_sessions s
      join public.teams t on t.id = s.team_id
      where s.id = session_observations.training_session_id
        and t.coach_id = public.my_coach_id()
    )
  );
drop policy if exists "observations_insert" on public.session_observations;
create policy "observations_insert" on public.session_observations
  for insert to authenticated with check (
    public.is_admin() or exists (
      select 1 from public.training_sessions s
      join public.teams t on t.id = s.team_id
      where s.id = session_observations.training_session_id
        and t.coach_id = public.my_coach_id()
    )
  );
drop policy if exists "observations_delete_admin" on public.session_observations;
create policy "observations_delete_admin" on public.session_observations
  for delete to authenticated using (public.is_admin());

-- --------------------------------------------------------------------------
-- Storage: private bucket for session-plan files (PDF / DOCX / images).
-- Files are NOT publicly accessible; the app opens them with signed URLs
-- (valid 1 hour). Only signed-in coaches and admins can read/write.
-- --------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('session-plans', 'session-plans', false)
on conflict (id) do nothing;

drop policy if exists "plan_files_select" on storage.objects;
create policy "plan_files_select" on storage.objects
  for select to authenticated using (bucket_id = 'session-plans');
drop policy if exists "plan_files_insert" on storage.objects;
create policy "plan_files_insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'session-plans');
drop policy if exists "plan_files_update" on storage.objects;
create policy "plan_files_update" on storage.objects
  for update to authenticated using (bucket_id = 'session-plans');
drop policy if exists "plan_files_delete" on storage.objects;
create policy "plan_files_delete" on storage.objects
  for delete to authenticated using (bucket_id = 'session-plans');

-- --------------------------------------------------------------------------
-- Grants: RLS policies alone do NOT give the app roles any table access.
-- Postgres also requires explicit GRANTs — without them every query from
-- the app fails with 42501 "permission denied for table ..." even when an
-- RLS policy would allow the row. (Found live 22 Nov 2026: the portal
-- showed "ACCOUNT NOT SET UP YET" because the profiles query was denied.)
-- RLS still governs what each role can actually see/change; these grants
-- only let the roles reach the tables at all. Anon gets SELECT only, and
-- with no anon RLS policy it still sees zero rows.
-- --------------------------------------------------------------------------
grant select on all tables in schema public to anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;
