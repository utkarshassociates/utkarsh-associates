-- Phase 4 addendum — additive migration on top of 0001/0002/0003.
--
-- Adds a real relation between `insights` and `practice_areas`, closing the
-- gap flagged in PHASE-4-NOTES.md: plan §4's pages table lists "related
-- insights" as content for the Practice Area detail page, but no join
-- existed to build that from (insights only related to insight_categories
-- and team_members/author). This was left out of the initial Phase 4
-- delivery rather than guessed at with a fragile category-name-matching
-- heuristic — now resolved with a real column, on your go-ahead.
--
-- This also directly serves plan §8 (SEO, Phase 5): "Internal linking —
-- practice area ↔ team member ↔ insight cross-links, which is exactly what
-- drives the multi-link sitelink presentation you're referencing." Building
-- this now means Phase 5 inherits a working relation instead of having to
-- add one mid-SEO-pass.
--
-- Deliberately a single NULLABLE FK, not a many-to-many join table — same
-- shape as the existing `author_id` relation, and nothing in the plan or
-- seed data suggests one insight ever needs to tag more than one practice
-- area. If that need shows up later, this is a straightforward migration
-- to a join table (add `insight_practice_areas`, backfill from this column,
-- drop the column) — not a breaking one, since nothing else depends on this
-- column's exact shape yet.

alter table insights
  add column practice_area_id uuid references practice_areas(id) on delete set null;

-- Supports the public Practice Area detail page's "related insights" query
-- (WHERE practice_area_id = ? AND status = 'published'), same reasoning as
-- every other foreign-key-driven public lookup in this schema.
create index insights_practice_area_id_idx on insights (practice_area_id);
