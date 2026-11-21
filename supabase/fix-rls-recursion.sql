-- ============================================================================
-- VK Football Academy — Fix: infinite recursion in RLS policies
-- Run in Supabase Dashboard → SQL Editor AFTER schema.sql + migration-phase2.sql.
-- Safe to re-run: helpers use CREATE OR REPLACE, policies are dropped and
-- recreated.
--
-- ROOT CAUSE (found live 22 Nov 2026 — dashboard showed
-- "infinite recursion detected in policy for relation teams"):
--   * team_players_select_coach (schema.sql) reads the TEAMS table directly.
--   * teams_select_parent (migration-phase2.sql) reads the TEAM_PLAYERS table
--     directly.
-- Postgres applies RLS to every table a policy touches, so evaluating a
-- teams policy re-entered team_players policies, which re-entered teams
-- policies, forever. Any query touching teams / team_players / sessions /
-- attendance / matches / fees / reports hit the same cycle. (Announcements
-- and Coaches kept working precisely because their policies touch no other
-- table.)
--
-- FIX: every cross-table check now goes through a SECURITY DEFINER helper.
-- A security-definer function runs as the table owner, so its inner query
-- bypasses RLS entirely and can never re-enter a policy. Policies only
-- ever call helpers — they never read teams / team_players /
-- training_sessions directly.
-- Helpers (all SECURITY DEFINER, all defined BEFORE the policies that use
-- them — LANGUAGE sql functions validate their queries at creation):
--   my_player_ids()         — players linked to the signed-in parent
--   my_team_ids()           — teams the signed-in parent's children play in
--   my_coached_team_ids()   — teams coached by the signed-in coach
--   my_coached_player_ids() — players in the signed-in coach's teams
--   my_coached_session_ids()— sessions of the signed-in coach's teams
-- ============================================================================

-- --------------------------------------------------------------------------
-- Helpers
-- --------------------------------------------------------------------------
create or replace function public.my_team_ids()
returns setof uuid
language sql
stable
security definer
as $$
  select team_id from public.team_players
  where player_id in (select public.my_player_ids());
$$;

create or replace function public.my_coached_team_ids()
returns setof uuid
language sql
stable
security definer
as $$
  select id from public.teams where coach_id = public.my_coach_id();
$$;

create or replace function public.my_coached_player_ids()
returns setof uuid
language sql
stable
security definer
as $$
  select player_id from public.team_players
  where team_id in (select public.my_coached_team_ids());
$$;

create or replace function public.my_coached_session_ids()
returns setof uuid
language sql
stable
security definer
as $$
  select id from public.training_sessions
  where team_id in (select public.my_coached_team_ids());
$$;

-- --------------------------------------------------------------------------
-- teams — parent policy must not read team_players directly.
-- --------------------------------------------------------------------------
drop policy if exists "teams_select_parent" on public.teams;
create policy "teams_select_parent" on public.teams
  for select to authenticated using (
    teams.id in (select public.my_team_ids())
  );

-- --------------------------------------------------------------------------
-- players — coach policy must not join team_players / teams directly.
-- --------------------------------------------------------------------------
drop policy if exists "players_select_coach" on public.players;
create policy "players_select_coach" on public.players
  for select to authenticated using (
    players.id in (select public.my_coached_player_ids())
  );

-- --------------------------------------------------------------------------
-- team_players — coach policy must not read teams directly.
-- --------------------------------------------------------------------------
drop policy if exists "team_players_select_coach" on public.team_players;
create policy "team_players_select_coach" on public.team_players
  for select to authenticated using (
    team_players.team_id in (select public.my_coached_team_ids())
  );

-- --------------------------------------------------------------------------
-- training_sessions — coach + parent policies via helpers only.
-- --------------------------------------------------------------------------
drop policy if exists "sessions_select_coach" on public.training_sessions;
create policy "sessions_select_coach" on public.training_sessions
  for select to authenticated using (
    training_sessions.team_id in (select public.my_coached_team_ids())
  );
drop policy if exists "sessions_write" on public.training_sessions;
create policy "sessions_write" on public.training_sessions
  for all to authenticated using (
    public.is_admin()
    or training_sessions.team_id in (select public.my_coached_team_ids())
  ) with check (
    public.is_admin()
    or training_sessions.team_id in (select public.my_coached_team_ids())
  );
drop policy if exists "sessions_select_parent" on public.training_sessions;
create policy "sessions_select_parent" on public.training_sessions
  for select to authenticated using (
    training_sessions.team_id in (select public.my_team_ids())
  );

-- --------------------------------------------------------------------------
-- session_plans — coach policies via helper only.
-- --------------------------------------------------------------------------
drop policy if exists "plans_select_coach" on public.session_plans;
create policy "plans_select_coach" on public.session_plans
  for select to authenticated using (
    session_plans.team_id in (select public.my_coached_team_ids())
  );
drop policy if exists "plans_write" on public.session_plans;
create policy "plans_write" on public.session_plans
  for all to authenticated using (
    public.is_admin()
    or session_plans.team_id in (select public.my_coached_team_ids())
  ) with check (
    public.is_admin()
    or session_plans.team_id in (select public.my_coached_team_ids())
  );

-- --------------------------------------------------------------------------
-- attendance — coach policies via session helper only.
-- (The parent policy already uses my_player_ids() only — untouched.)
-- --------------------------------------------------------------------------
drop policy if exists "attendance_select_coach" on public.attendance;
create policy "attendance_select_coach" on public.attendance
  for select to authenticated using (
    attendance.training_session_id in (select public.my_coached_session_ids())
  );
drop policy if exists "attendance_write" on public.attendance;
create policy "attendance_write" on public.attendance
  for all to authenticated using (
    public.is_admin()
    or attendance.training_session_id in (select public.my_coached_session_ids())
  ) with check (
    public.is_admin()
    or attendance.training_session_id in (select public.my_coached_session_ids())
  );

-- --------------------------------------------------------------------------
-- session_observations — coach policies via session helper only.
-- --------------------------------------------------------------------------
drop policy if exists "observations_select_coach" on public.session_observations;
create policy "observations_select_coach" on public.session_observations
  for select to authenticated using (
    session_observations.training_session_id in (select public.my_coached_session_ids())
  );
drop policy if exists "observations_insert" on public.session_observations;
create policy "observations_insert" on public.session_observations
  for insert to authenticated with check (
    public.is_admin()
    or session_observations.training_session_id in (select public.my_coached_session_ids())
  );

-- --------------------------------------------------------------------------
-- matches — coach + parent policies via helpers only.
-- --------------------------------------------------------------------------
drop policy if exists "matches_select_coach" on public.matches;
create policy "matches_select_coach" on public.matches
  for select to authenticated using (
    matches.team_id in (select public.my_coached_team_ids())
  );
drop policy if exists "matches_select_parent" on public.matches;
create policy "matches_select_parent" on public.matches
  for select to authenticated using (
    matches.team_id in (select public.my_team_ids())
  );
drop policy if exists "matches_insert" on public.matches;
create policy "matches_insert" on public.matches
  for insert to authenticated with check (
    public.is_admin()
    or matches.team_id in (select public.my_coached_team_ids())
  );
drop policy if exists "matches_update" on public.matches;
create policy "matches_update" on public.matches
  for update to authenticated using (
    public.is_admin()
    or matches.team_id in (select public.my_coached_team_ids())
  ) with check (
    public.is_admin()
    or matches.team_id in (select public.my_coached_team_ids())
  );

-- --------------------------------------------------------------------------
-- fee_records — coach policy via player helper only.
-- (The parent policy already uses my_player_ids() only — untouched.)
-- --------------------------------------------------------------------------
drop policy if exists "fee_records_select_coach" on public.fee_records;
create policy "fee_records_select_coach" on public.fee_records
  for select to authenticated using (
    fee_records.player_id in (select public.my_coached_player_ids())
  );

-- --------------------------------------------------------------------------
-- player_reports — coach policies via player helper only.
-- (reports_update already uses my_coach_id() only — untouched. The parent
-- policy already uses my_player_ids() only — untouched.)
-- --------------------------------------------------------------------------
drop policy if exists "reports_select_coach" on public.player_reports;
create policy "reports_select_coach" on public.player_reports
  for select to authenticated using (
    player_reports.player_id in (select public.my_coached_player_ids())
  );
drop policy if exists "reports_insert" on public.player_reports;
create policy "reports_insert" on public.player_reports
  for insert to authenticated with check (
    public.is_admin()
    or player_reports.player_id in (select public.my_coached_player_ids())
  );

-- --------------------------------------------------------------------------
-- Grants for the helper functions are covered by the existing grants on the
-- schema (functions are executable by authenticated by default). No new
-- tables are created here, so no new table GRANTs are needed.
-- --------------------------------------------------------------------------
