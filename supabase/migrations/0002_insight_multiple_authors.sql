-- 0002 — multiple authors per Insight.
-- Run AFTER schema.sql. Safe to re-run (idempotent).
--
-- Adds a join table so one insight can credit several team members, in a
-- chosen order. `insights.author_id` is KEPT as the "lead author" (always
-- the first author, written by the app on every save) so nothing that
-- still reads it breaks.

create table if not exists insight_authors (
  insight_id     uuid not null references insights(id) on delete cascade,
  -- No ON DELETE action, same as insights.author_id: deleting a team member
  -- who is credited on an insight fails loudly instead of silently dropping
  -- the credit.
  team_member_id uuid not null references team_members(id),
  position       smallint not null default 0,  -- 0 = lead author
  primary key (insight_id, team_member_id)
);

create index if not exists insight_authors_team_member_id_idx on insight_authors (team_member_id);

-- RLS: anon may only SELECT, and only when both the insight and the team
-- member are published. No write policies — admin writes use the service role.
alter table insight_authors enable row level security;

drop policy if exists "public can read authors of published insights" on insight_authors;
create policy "public can read authors of published insights"
  on insight_authors for select
  using (
    exists (select 1 from insights i where i.id = insight_authors.insight_id and i.status = 'published')
    and exists (select 1 from team_members tm where tm.id = insight_authors.team_member_id and tm.status = 'published')
  );

-- Backfill: every existing single author becomes the lead author.
insert into insight_authors (insight_id, team_member_id, position)
select id, author_id, 0 from insights where author_id is not null
on conflict do nothing;
