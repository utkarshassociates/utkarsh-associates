-- Phase 4 (Public site) — additive migration on top of 0001/0002.
--
-- Security fix found while wiring the public Team detail page to real data:
-- `team_practice_areas` (the join table linking team_members <-> practice_areas)
-- was created in 0001_init.sql but never had `alter table ... enable row level
-- security` run on it, and never got a policy. Every other public-facing table
-- (practice_areas, team_members, insights, offices, insight_categories,
-- site_settings) explicitly has RLS enabled with a scoped policy — this one
-- was just missed. With RLS off, Supabase's default grants mean the anon key
-- can read AND write this table completely unrestricted — a real gap against
-- plan §6's stated model ("the public anon key ... can never write").
--
-- Same "additive, flagged prominently, not a silent change" pattern as
-- 0002_phase3.sql's `tags` column — see PHASE-4 chat notes / the project
-- plan conflict-log for context. Reversible with a single
-- `alter table team_practice_areas disable row level security;` if ever
-- needed, though there's no reason this should be reverted.

alter table team_practice_areas enable row level security;

-- Public (anon key) may only ever READ this join table, and only rows whose
-- referenced team member is published — the same "published-only" gate
-- already used on team_members/practice_areas themselves, applied here too
-- so a link to/from a draft team member or draft practice area never leaks
-- through the join. Matches the same anon-SELECT-only, no-write posture as
-- every other public table.
create policy "public can read links for published team members"
  on team_practice_areas for select
  using (
    exists (
      select 1 from team_members tm
      where tm.id = team_practice_areas.team_member_id
        and tm.status = 'published'
    )
  );

-- No insert/update/delete policy for anon — all admin writes to this table
-- already go through the service-role key inside src/actions/team.ts
-- (the "full replace-the-set on every save" pattern noted in
-- PHASE-3-NOTES.md), which bypasses RLS entirely. This migration only
-- closes the anon-key gap; it changes nothing about how the admin CMS
-- itself writes to this table.
