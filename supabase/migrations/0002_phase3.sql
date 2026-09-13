-- Phase 3 (CMS entities) — additive schema changes on top of 0001_init.sql.
-- Source of truth: utkarsh-associates-project-plan.md. See PHASE-3-NOTES.md
-- for why each of these exists — nothing here removes or renames anything
-- from 0001, so it's safe to run against a DB that already has real Phase 1/2
-- data in it.

-- ============ 1. insights.tags ============
-- Plan conflict: §5.2's dashboard-structure table lists "category, tags, SEO
-- fields" as fields on the Insights editor, but the §6 schema for `insights`
-- never defined a `tags` column (only `category_id`). Resolved by adding it
-- here, following the same `text[]` pattern already used for
-- `admins.extra_permissions` — additive, nullable-safe (defaults to '{}'),
-- no impact on existing rows or Phase 1/2 code.
alter table insights
  add column if not exists tags text[] not null default '{}';

-- ============ 2. Supabase Storage bucket for uploaded media ============
-- Per plan §2 (Media/Storage): Supabase Storage + sharp preprocessing.
-- One public bucket — images need to be publicly viewable on the marketing
-- site (team photos, insight cover images, in-content images). Uploads only
-- ever happen server-side via the service-role client (src/lib/media/upload.ts,
-- called from src/actions/media.ts after a permission check) — the bucket's
-- public-ness only affects *read* access, matching the same "anon can read
-- published stuff, anon can never write" posture as the table RLS in §6.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media',
  'media',
  true,
  10485760, -- 10MB raw-upload ceiling before sharp compresses it down (§2: "typical result ~150-300KB stored")
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

-- Public read on the media bucket (this is what makes next/image able to
-- fetch stored images without a signed URL).
create policy "public can read media bucket"
  on storage.objects for select
  using (bucket_id = 'media');

-- No insert/update/delete policy for the anon/authenticated Supabase roles on
-- this bucket at all — uploads go through the service-role key only (server
-- actions, after requirePermission()), which bypasses storage RLS the same
-- way it bypasses table RLS. This mirrors the "no policy = service-role only"
-- pattern already used for roles/permissions/admins/audit_log in 0001.

-- ============ 3. insight_categories — seed-friendly uniqueness note ============
-- No schema change needed here (name/slug already exist per 0001), but
-- documenting: `slug` is already unique, so category "quick add" from the
-- Insight form (src/actions/insights.ts → createCategoryAction) relies on
-- that constraint to reject accidental duplicates rather than checking first
-- and racing a concurrent insert.
