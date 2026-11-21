-- ============================================================================
-- VK Football Academy — DEMO seed data (OPTIONAL)
-- Run this in Supabase Dashboard → SQL Editor AFTER supabase/schema.sql.
--
-- EVERY row here is demo data: names are prefixed "Demo —" and is_demo is
-- true, so demo rows are trivially distinguishable from real academy data.
-- The app shows a "Demo data" badge on these rows.
--
-- To remove all demo data later, run:
--   delete from public.session_observations where is_demo = true;
--   delete from public.attendance where is_demo = true;
--   delete from public.session_plans where is_demo = true;
--   delete from public.training_sessions where is_demo = true;
--   delete from public.team_players where team_id in
--     (select id from public.teams where is_demo = true);
--   delete from public.teams where is_demo = true;
--   delete from public.players where is_demo = true;
--   delete from public.coaches where is_demo = true;
--
-- Safe to re-run: inserts use ON CONFLICT DO NOTHING on fixed UUIDs.
-- ============================================================================

-- Demo coach (NOT linked to a login — link a real coach record to a login
-- from the portal's Manage Coaches page instead).
insert into public.coaches (id, user_id, full_name, email, licence, bio, is_demo)
values (
  '11111111-1111-1111-1111-111111111111',
  null,
  'Demo — Coach Sample',
  'demo-coach@example.invalid',
  'Demo licence',
  'Sample coach record, for trying out the portal before real data is added.',
  true
)
on conflict (id) do nothing;

-- Demo teams
insert into public.teams (id, name, age_group, coach_id, is_demo)
values
  ('22222222-2222-2222-2222-222222222222', 'Demo U14 — Reds', 'U14',
   '11111111-1111-1111-1111-111111111111', true),
  ('33333333-3333-3333-3333-333333333333', 'Demo U16 — Reds', 'U16',
   '11111111-1111-1111-1111-111111111111', true)
on conflict (id) do nothing;

-- Demo players (U14)
insert into public.players (id, full_name, date_of_birth, age_group, position, parent_name, parent_phone, is_demo)
values
  ('44444444-4444-4444-4444-444444444441', 'Demo — Aarav', '2012-03-15', 'U14', 'Midfielder', 'Demo Parent A', '9000000001', true),
  ('44444444-4444-4444-4444-444444444442', 'Demo — Kabir', '2012-07-02', 'U14', 'Forward', 'Demo Parent B', '9000000002', true),
  ('44444444-4444-4444-4444-444444444443', 'Demo — Reyansh', '2013-01-20', 'U14', 'Defender', 'Demo Parent C', '9000000003', true),
  ('44444444-4444-4444-4444-444444444444', 'Demo — Vihaan', '2012-11-08', 'U14', 'Goalkeeper', 'Demo Parent D', '9000000004', true),
  ('44444444-4444-4444-4444-444444444445', 'Demo — Arjun', '2013-05-27', 'U14', 'Midfielder', 'Demo Parent E', '9000000005', true),
  ('44444444-4444-4444-4444-444444444446', 'Demo — Ishaan', '2012-09-14', 'U14', 'Forward', 'Demo Parent F', '9000000006', true)
on conflict (id) do nothing;

-- Demo players (U16)
insert into public.players (id, full_name, date_of_birth, age_group, position, parent_name, parent_phone, is_demo)
values
  ('55555555-5555-5555-5555-555555555551', 'Demo — Aditya', '2010-04-11', 'U16', 'Midfielder', 'Demo Parent G', '9000000007', true),
  ('55555555-5555-5555-5555-555555555552', 'Demo — Rohan', '2010-08-23', 'U16', 'Defender', 'Demo Parent H', '9000000008', true),
  ('55555555-5555-5555-5555-555555555553', 'Demo — Dev', '2011-02-05', 'U16', 'Forward', 'Demo Parent I', '9000000009', true),
  ('55555555-5555-5555-5555-555555555554', 'Demo — Yash', '2010-12-19', 'U16', 'Goalkeeper', 'Demo Parent J', '9000000010', true)
on conflict (id) do nothing;

-- Demo rosters
insert into public.team_players (team_id, player_id)
values
  ('22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444441'),
  ('22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444442'),
  ('22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444443'),
  ('22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444'),
  ('22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444445'),
  ('22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444446'),
  ('33333333-3333-3333-3333-333333333333', '55555555-5555-5555-5555-555555555551'),
  ('33333333-3333-3333-3333-333333333333', '55555555-5555-5555-5555-555555555552'),
  ('33333333-3333-3333-3333-333333333333', '55555555-5555-5555-5555-555555555553'),
  ('33333333-3333-3333-3333-333333333333', '55555555-5555-5555-5555-555555555554')
on conflict (team_id, player_id) do nothing;

-- Demo sessions: one in the past (with plan + attendance + observation),
-- one coming up (so the dashboard and attendance screen have something live).
insert into public.training_sessions
  (id, team_id, title, session_date, start_time, duration_minutes, pitch, category, objectives, description, status, is_demo)
values
  ('66666666-6666-6666-6666-666666666666',
   '22222222-2222-2222-2222-222222222222',
   'Demo — Passing under pressure',
   CURRENT_DATE - 7, '18:00', 90, 'Urban Turf', 'Technical',
   'Players receive on the half-turn and play forward under pressure.',
   'Sample completed session for the demo U14 team.',
   'completed', true),
  ('77777777-7777-7777-7777-777777777777',
   '22222222-2222-2222-2222-222222222222',
   'Demo — Small-sided games',
   CURRENT_DATE + 2, '18:00', 90, 'Urban Turf', 'Tactical',
   'Decision-making in 4v4 — when to keep the ball and when to attack.',
   'Sample upcoming session for the demo U14 team.',
   'scheduled', true)
on conflict (id) do nothing;

-- Demo session plan (structured sections only — no file attached).
insert into public.session_plans
  (id, training_session_id, coach_id, team_id, title, description, content, is_demo)
values (
  '88888888-8888-8888-8888-888888888888',
  '66666666-6666-6666-6666-666666666666',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  'Demo — Passing under pressure plan',
  'Sample plan showing how the structured editor stores each section.',
  '{
    "objectives": "Players receive on the half-turn and play forward under pressure.",
    "warm_up": "10 min — dynamic stretching, then rondos 4v1.",
    "technical_drills": "Passing lanes drill: two-touch maximum, scan before receiving.",
    "tactical_activities": "Build-up against a high press — third-man runs.",
    "small_sided_games": "4v4 + 2 neutrals, 15 x 20 m, 3 x 6 min blocks.",
    "physical_conditioning": "Short sprints between blocks — 5 x 20 m.",
    "cool_down": "Light jog and stretching, 5 min debrief.",
    "equipment": "12 cones, 8 bibs, 10 balls, 2 mini goals.",
    "coaching_points": "Scan before you receive. First touch sets the next pass.",
    "post_session_observations": "Receiving improved in the second block; still turning into pressure on the left side."
  }'::jsonb,
  true
)
on conflict (id) do nothing;

-- Demo attendance for the completed session (4 present, 1 late, 1 absent).
insert into public.attendance (training_session_id, player_id, status, is_demo)
values
  ('66666666-6666-6666-6666-666666666666', '44444444-4444-4444-4444-444444444441', 'present', true),
  ('66666666-6666-6666-6666-666666666666', '44444444-4444-4444-4444-444444444442', 'present', true),
  ('66666666-6666-6666-6666-666666666666', '44444444-4444-4444-4444-444444444443', 'late', true),
  ('66666666-6666-6666-6666-666666666666', '44444444-4444-4444-4444-444444444444', 'present', true),
  ('66666666-6666-6666-6666-666666666666', '44444444-4444-4444-4444-444444444445', 'absent', true),
  ('66666666-6666-6666-6666-666666666666', '44444444-4444-4444-4444-444444444446', 'present', true)
on conflict (training_session_id, player_id) do nothing;

-- Demo observation on the completed session.
insert into public.session_observations
  (id, training_session_id, coach_id, observation, is_demo)
values (
  '99999999-9999-9999-9999-999999999999',
  '66666666-6666-6666-6666-666666666666',
  '11111111-1111-1111-1111-111111111111',
  'Demo observation: the group scanned much better after the first water break. Next session, start the pressing work earlier — the last block ran short.',
  true
)
on conflict (id) do nothing;
