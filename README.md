# VK Football Academy — Website + Academy Management System

A completely new website for **VK Football Academy** (Urban Turf, Rustomjee
Urbania, Majiwada, Thane West), built from the academy's management-system
idea: a public website plus Coach, Parent and Admin portals, with
**attendance tracking** and **session plan tracking** as the two core features.

- **Public site:** Home, About, Programmes (U12/U14/U16/U18), Coaches,
  Contact — with the academy's real, verified facts only.
- **Coach portal:** Dashboard, My Teams, Training Sessions, Session Plans
  (structured editor + PDF/DOCX/image upload to Supabase Storage),
  Attendance (Present / Absent / Late / Excused, per session, with history
  and per-player percentages), Matches (create fixtures, record results),
  Player Development (per-player assessments and reports), Announcements,
  and a unified Session Details page.
- **Parent portal (view-only):** Dashboard for their linked children,
  per-child profile with upcoming training, attendance history, matches,
  development reports, fee details and announcements. Parents can never
  edit attendance, plans or assessments — enforced by RLS.
- **Admin:** manage coaches (and link their login accounts), teams
  (assign coach + players), players, parents (link logins to children),
  fee structures and payment records (manual records only — no payment
  gateway), announcements, and an academy-wide overview (teams, fees,
  matches, latest session plans).
- **Out of scope for this build (deliberately not included):** AI features,
  shareable attendance links / QR codes, online payment gateway.

## Tech

React 19 + TypeScript + Vite + Tailwind CSS v4 + React Router + Supabase
(Auth, Postgres with row-level security, Storage). No other backend.

Design follows the academy's Instagram (@vk_football_academy): dark
charcoal backgrounds, red primary accent, white typography, gold only for
premium elements. The crest is a code-drawn SVG shield with "VK" and a
football — see `src/components/Logo.tsx`.

## Run locally

```bash
npm install
cp .env.example .env   # then fill in your Supabase values (see below)
npm run dev            # http://localhost:5173
npm run build          # production build (runs tsc + vite build)
```

## Supabase setup

1. Create a new Supabase project (free tier is fine).
2. In the Supabase Dashboard, open **SQL Editor** and run, in order:
   - `supabase/schema.sql` — tables, RLS policies, auth trigger, the private
     `session-plans` storage bucket.
   - `supabase/migration-phase2.sql` — widens `profiles.role` to
     `('admin', 'coach', 'parent')` and adds the Parent portal, Matches,
     Fees, Announcements and Player Development tables (plus their RLS
     policies and demo seed). **Run this after `schema.sql`, never before.**
   - `supabase/seed.sql` — **optional** demo data only (two demo teams, demo
     players, one past session with a plan + attendance, one upcoming
     session). Every demo row is prefixed `Demo —` and has `is_demo = true`,
     and the app shows a "Demo data" badge on it. Delete it with the SQL in
     the seed file's header when real data is in.
3. Copy the project's URL and **anon** key from **Project Settings → API**
   into `.env`:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Restart the dev server.

> The service_role key must NEVER be put in `.env` or in frontend code.
> The anon key is safe to ship in the browser — the RLS policies in
> `schema.sql` are what actually protect the data.

### If Supabase is not configured

The public website still works. The portal routes show a clear
"Supabase not configured yet" page with the setup steps. Real academy data
is **never** silently stored in localStorage.

## Accounts & roles

There is no public sign-up. Accounts are created by an admin:

1. **Create the admin first.** In Supabase Dashboard → **Authentication →
   Add user**, create the admin's login with this User Metadata JSON:
   ```json
   { "role": "admin", "full_name": "Admin Name" }
   ```
   The `schema.sql` trigger creates a `profiles` row automatically.
2. **Create coach logins the same way**, with `{"role": "coach",
   "full_name": "Coach Name"}`.
3. **Link each coach login to a coach record:** sign in as admin → Manage
   Coaches → edit the coach → "Link login account" → pick the login. Until
   linked, a coach can sign in but sees no teams.
4. **Create parent logins the same way**, with `{"role": "parent",
   "full_name": "Parent Name"}`.
5. **Link each parent login to their children:** sign in as admin → Manage
   Parents → "Link parent to player" → pick the parent login, the player
   and the relationship. A parent can have several children; a child can
   have several linked parents. A parent with no links sees nothing until
   linked. Parents see ONLY their own children's data (enforced by RLS via
   the `parents` link table) — their portal is read-only.
6. **Admin setup:** Manage Coaches → add coaches; Manage Teams → create
   teams, assign a coach, assign players; Manage Players → register players;
   Manage Fees → define fee structures (e.g. a term fee per age group) and
   record payments manually; Manage Announcements → publish news to all,
   coaches only, or parents only.

### Fees — manual records only

There is **no payment gateway and no online payments** in this build. Money
is collected by the academy (cash / UPI / bank transfer) and recorded in
Manage Fees: pick a player and a fee structure, and the amount due is
filled in automatically; record the amount paid, date, method and receipt
number. Status (Paid / Part paid / Pending / Overdue) is computed from the
amounts and the structure's due date — it is never stored. Parents see
outstanding fees and payment history for their own children only.

### Matches & player development

- **Matches:** coaches create fixtures for their teams and record results
  (scores, goals, observations); admin sees academy-wide fixtures/results;
  parents see their children's fixtures/results.
- **Player development:** coaches add assessments per player with 1–10
  ratings across technical, tactical, physical, psychological, attitude and
  overall areas, plus strengths, weaknesses, development objectives and
  recommendations, optionally linked to a training session. Each report
  shows current vs previous ratings, areas of improvement and areas
  requiring attention. Parents see reports for their own children only.

### Demo accounts

None are shipped — accounts are real Supabase Auth users, created as above.
For a first look, run `seed.sql` and sign in with the admin account you
created; the demo teams and data will be visible immediately.

## Deploy (Vercel)

1. Push this folder to a GitHub repo.
2. In Vercel, import the repo (framework preset: Vite).
3. Set the environment variables `VITE_SUPABASE_URL` and
   `VITE_SUPABASE_ANON_KEY` (same values as `.env`), then deploy.

## Still to come (not part of this build)

- **Real logo file:** the academy has not supplied one yet. Swap
  `src/components/Logo.tsx` and `public/favicon.svg` for the real logo when
  it arrives — the crest is used in exactly those two places.
- **Real academy data:** real coaches, teams and players replace the demo
  seed (delete demo rows with the SQL in `seed.sql`'s header). The friend
  who asked for the site is another coach at the academy (not the founder);
  confirm with him who the admin user should be.
- **Coaches page:** only Dhyeya Tiwari (ex-player, AIFF D Licence) is
  verified, so only he is listed. Add other coaches only with confirmed
  names, roles and licences — nothing on that page is invented.
- **Later phases (if the academy wants them):** AI features, shareable
  attendance links / QR codes, online payment gateway.
