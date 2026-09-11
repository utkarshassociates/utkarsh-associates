-- Utkarsh Associates — initial schema
-- Source of truth: utkarsh-associates-project-plan.md §6
-- Auth is self-managed (Credentials + JWT), NOT Supabase Auth — see §5.3.

create extension if not exists "pgcrypto";

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
  icon_key text not null, -- one of the locked keys in src/config/assets.ts
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
  post_type text not null default 'original' check (post_type in ('original', 'external_link')),
  external_url text,
  source_name text,
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

create table offices (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  city text,
  phone text,
  email text,
  map_embed_url text,
  is_headquarters boolean not null default false,
  order_index int not null default 0
);

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

create table site_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references admins(id)
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

-- ============ ROW LEVEL SECURITY ============
-- Two-layer model (§6): app-level permission checks are primary; RLS on the
-- anon key is a hard backstop — public site can SELECT published rows only,
-- and can never write. All admin writes go through server actions using the
-- service role key (server-only), after the server action verifies the JWT.

alter table practice_areas enable row level security;
alter table team_members enable row level security;
alter table insights enable row level security;
alter table offices enable row level security;
alter table insight_categories enable row level security;
alter table site_settings enable row level security;
alter table contact_submissions enable row level security;

create policy "public can read published practice areas"
  on practice_areas for select using (status = 'published');

create policy "public can read published team members"
  on team_members for select using (status = 'published');

create policy "public can read published insights"
  on insights for select using (status = 'published');

create policy "public can read offices"
  on offices for select using (true);

create policy "public can read insight categories"
  on insight_categories for select using (true);

create policy "public can read site settings"
  on site_settings for select using (true);

-- contact_submissions: no public select/update policy at all — anon key can
-- only insert via the honeypot-guarded server action, never read back.
create policy "public can submit contact form"
  on contact_submissions for insert with check (true);

-- roles/permissions/admins/audit_log intentionally have NO RLS policies for
-- the anon key — they are only ever touched by server actions using the
-- service role key, which bypasses RLS. Nothing here should be public-readable.
alter table roles enable row level security;
alter table permissions enable row level security;
alter table role_permissions enable row level security;
alter table admins enable row level security;
alter table audit_log enable row level security;
