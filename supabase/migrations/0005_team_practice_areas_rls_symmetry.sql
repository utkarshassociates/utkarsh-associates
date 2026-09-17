-- Additive fix on top of 0003_phase4.sql.
--
-- 0003's own comment on this policy already claims "a link to/from a draft
-- team member or draft practice area never leaks through" — but the policy
-- it actually wrote only checked team_members.status, never
-- practice_areas.status. So a row linking a published team member to a
-- draft practice area was readable by the anon key even though the comment
-- said otherwise.
--
-- In practice this was low-impact: practice_areas has its own
-- "public can read published practice areas" policy (0001_init.sql), so a
-- nested select joining through to a draft practice area's own columns
-- would still come back empty — the leak was of the *join row* only (which
-- practice_area_id a published team member links to), not the draft
-- practice area's actual content. Still, the policy should do what its own
-- comment says, and a public page built directly against this table later
-- shouldn't have to know about that second layer to stay safe.
--
-- Not editing 0003 in place — it may already be applied against the live
-- Supabase project, and migrations here are treated as append-only, same
-- precedent as 0002's additive `tags` column and 0004's additive
-- `practice_area_id` column.

drop policy "public can read links for published team members" on team_practice_areas;

create policy "public can read links for published team members and practice areas"
  on team_practice_areas for select
  using (
    exists (
      select 1 from team_members tm
      where tm.id = team_practice_areas.team_member_id
        and tm.status = 'published'
    )
    and exists (
      select 1 from practice_areas pa
      where pa.id = team_practice_areas.practice_area_id
        and pa.status = 'published'
    )
  );

-- No insert/update/delete policy for anon, unchanged from 0003 — admin
-- writes to this table still go through the service-role key in
-- src/actions/team.ts, which bypasses RLS entirely.
