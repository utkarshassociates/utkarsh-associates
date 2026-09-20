-- Utkarsh Associates — consolidated schema (replaces migrations 0001-0006)
--
-- This describes the FINAL state directly — no intermediate steps (no
-- create-then-rename, no create-then-drop). Written for a fresh Supabase
-- project (per the Phase 6 plan's relaunch decision) — run this once,
-- against an empty database, then run seed.sql.
--
-- Source of truth for the application code: utkarsh-associates-project-plan.md
-- §6, as revised by PHASE-6-PUBLIC-UX-AND-SIMPLIFICATION-PLAN.md §11.
-- Auth is self-managed (Credentials + JWT), NOT Supabase Auth.

create extension if not exists "pgcrypto";

-- ============ ENUM TYPES ============

create type team_tier as enum ('leadership', 'counsel', 'team');

-- ============ RBAC ============

create table roles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  is_super boolean not null default false,
  created_at timestamptz not null default now()
);

create table permissions (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  label text not null,
  category text
);

create table role_permissions (
  role_id uuid not null references roles(id) on delete cascade,
  permission_id uuid not null references permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

create table admins (
  id uuid primary key default gen_random_uuid(),
  login_id text not null unique, -- not required to be a deliverable email
  name text not null,
  password_hash text not null,
  avatar_url text,
  role_id uuid not null references roles(id),
  extra_permissions text[] not null default '{}',
  status text not null default 'active' check (status in ('active', 'disabled')),
  created_at timestamptz not null default now(),
  last_login_at timestamptz
  -- no auth_user_id: auth is self-managed, not Supabase Auth
);

-- ============ CONTENT ============

create table practice_areas (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  short_description text,
  content jsonb,
  -- Uploaded via the sharp/Storage pipeline (same as team_members.photo_url),
  -- not a fixed key. Null renders the generic fallback icon.
  icon_url text,
  order_index int not null default 0,
  status text not null default 'draft' check (status in ('draft', 'published')),
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table team_members (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  designation text,
  photo_url text,
  bio jsonb,
  email text,
  phone text,
  linkedin_url text,
  -- Drives the segregated Team page display (leadership shown separately
  -- from counsel/general team).
  tier team_tier not null default 'team',
  order_index int not null default 0,
  status text not null default 'draft' check (status in ('draft', 'published')),
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table team_practice_areas (
  team_member_id uuid not null references team_members(id) on delete cascade,
  practice_area_id uuid not null references practice_areas(id) on delete cascade,
  primary key (team_member_id, practice_area_id)
);

create table insight_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique
);

create table insights (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text,
  content jsonb, -- nullable for external_link posts
  cover_image_url text,
  category_id uuid references insight_categories(id),
  author_id uuid references team_members(id),
  tags text[] not null default '{}',
  post_type text not null default 'original' check (post_type in ('original', 'external_link')),
  external_url text,
  source_name text,
  -- Nullable FK, not a many-to-many join — one insight tags at most one
  -- practice area. Powers the Practice Area detail page's "related insights".
  practice_area_id uuid references practice_areas(id) on delete set null,
  status text not null default 'draft'
    check (status in ('draft', 'pending_review', 'published', 'rejected')),
  rejection_note text,
  submitted_by uuid references admins(id),
  published_at timestamptz,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index insights_practice_area_id_idx on insights (practice_area_id);

create table contact_submissions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  message text not null,
  practice_area_interest text,
  status text not null default 'new' check (status in ('new', 'read', 'archived')),
  created_at timestamptz not null default now()
);

create table audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references admins(id),
  action text not null,
  entity text not null,
  entity_id uuid,
  meta jsonb,
  created_at timestamptz not null default now()
);

-- Note: `offices` and `site_settings` are deliberately NOT created here —
-- both moved to src/config/content.json (Phase 6 §1). No DB table, no
-- admin CRUD, no RLS to maintain for either.

-- ============ STORAGE ============
-- One public bucket for uploaded media (team photos, practice area icons,
-- insight cover/content images). Uploads only ever happen server-side via
-- the service-role client (src/lib/media/upload.ts), gated by a permission
-- check in src/actions/media.ts — the bucket's public-ness only affects
-- *read* access.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media',
  'media',
  true,
  10485760, -- 10MB raw-upload ceiling before sharp compresses it down
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

create policy "public can read media bucket"
  on storage.objects for select
  using (bucket_id = 'media');

-- No insert/update/delete policy for anon/authenticated — uploads go
-- through the service-role key only, which bypasses storage RLS.

-- ============ ROW LEVEL SECURITY ============
-- Two-layer model: app-level permission checks are primary; RLS on the
-- anon key is a hard backstop — the public site can SELECT published rows
-- only, and can never write. All admin writes go through server actions
-- using the service role key (server-only), after the server action
-- verifies the caller's JWT and resolved permission set.

alter table practice_areas enable row level security;
alter table team_members enable row level security;
alter table team_practice_areas enable row level security;
alter table insights enable row level security;
alter table insight_categories enable row level security;
alter table contact_submissions enable row level security;

create policy "public can read published practice areas"
  on practice_areas for select using (status = 'published');

create policy "public can read published team members"
  on team_members for select using (status = 'published');

-- Public (anon key) may only read a join row when BOTH sides are published
-- — a link to/from a draft team member or a draft practice area never
-- leaks through.
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

create policy "public can read published insights"
  on insights for select using (status = 'published');

create policy "public can read insight categories"
  on insight_categories for select using (true);

-- No public select/update policy at all — anon key can only insert via the
-- honeypot-guarded server action, never read back.
create policy "public can submit contact form"
  on contact_submissions for insert with check (true);

-- roles/permissions/role_permissions/admins/audit_log intentionally have NO
-- policies for the anon key — they are only ever touched by server actions
-- using the service role key, which bypasses RLS. Nothing here should be
-- public-readable.
alter table roles enable row level security;
alter table permissions enable row level security;
alter table role_permissions enable row level security;
alter table admins enable row level security;
alter table audit_log enable row level security;
