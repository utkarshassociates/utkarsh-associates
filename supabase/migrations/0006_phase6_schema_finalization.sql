-- Phase 6 §11 — consolidated schema finalization.
--
-- Per PHASE-6-PUBLIC-UX-AND-SIMPLIFICATION-PLAN.md §11: "Consolidated list —
-- everything below should ship as one clean, final migration, not another
-- incremental Phase-style file, since the plan is to relaunch on a fresh
-- Supabase project regardless (§10)." On a fresh project, 0001-0006 all run
-- in sequence together; this file is "final" in the sense of "last schema
-- change needed for launch," not a standalone bootstrap script.
--
-- Four changes:
--   1. team_members.tier            — new, drives the segregated Team page.
--   2. practice_areas.icon_key      — renamed to icon_url, now nullable
--                                      (upload field replacing the fixed
--                                      picker; null = generic fallback icon).
--   3. offices table                — dropped (data now in content.json).
--   4. site_settings table          — dropped (data now in content.json).
--   5. permissions                  — offices.manage / settings.manage
--                                      pruned (nothing left that needs them).

-- ============ 1. team_members.tier ============

create type team_tier as enum ('leadership', 'counsel', 'team');

alter table team_members
  add column tier team_tier not null default 'team';

-- ============ 2. practice_areas.icon_key -> icon_url ============

alter table practice_areas
  rename column icon_key to icon_url;

-- Was `not null` (a required pick from ASSETS.practiceIcons); now optional —
-- a practice area with no uploaded icon renders the generic fallback
-- (src/lib/utils.ts's getPracticeAreaIconSrc) instead of blocking creation.
alter table practice_areas
  alter column icon_url drop not null;

comment on column practice_areas.icon_url is
  'Phase 6 §7: uploaded via the sharp/Storage pipeline (same as team_members.photo_url), not a fixed key. Null renders the generic fallback icon.';

-- Existing rows (if any — most deployments relaunch on a fresh DB per §10)
-- had icon_key values like "litigation" that are not valid image URLs
-- post-rename. Null them out rather than leave a broken <img src>; the
-- generic fallback icon covers the gap until a real icon is uploaded.
update practice_areas
  set icon_url = null
  where icon_url is not null and icon_url !~ '^(https?://|/)';

-- ============ 3 & 4. Drop offices / site_settings ============
-- Both moved to src/config/content.json (Phase 6 §1) — no DB table, no
-- admin CRUD, no RLS to maintain here anymore.

drop table if exists offices cascade;
drop table if exists site_settings cascade;

-- ============ 5. Prune permissions ============
-- offices.manage / settings.manage gated the two admin screens just
-- removed. Deleting the permission rows also cascades through
-- role_permissions (FK ON DELETE CASCADE per 0001_init.sql); any admin's
-- extra_permissions text[] entry for either key becomes inert (the app's
-- permission check is "is this key in the resolved set", and the key no
-- longer exists in src/config/permissions.ts's PERMISSIONS union either,
-- so nothing can re-grant it going forward).

delete from permissions where key in ('offices.manage', 'settings.manage');
