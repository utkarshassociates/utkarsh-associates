-- Seeds: roles, permissions, role_permissions, and the bootstrap superAdmin.
-- Run once against a fresh database, after every file in supabase/migrations/
-- has been run in order (0001 through the highest-numbered file — see
-- README.md's "Getting started" for the full sequence).
--
-- This is the only seed file (Phase 6 §10/§13 step 7 — no sample content;
-- every public listing has a defined empty state instead). The earlier
-- seed_phase3.sql/seed_phase4.sql sample-data files were removed when
-- migration 0006 dropped the `offices` table and renamed `icon_key`, which
-- both files referenced.
--
-- IMPORTANT: replace the password_hash placeholder below before running this
-- against anything but a local/dev database. Generate a real bcrypt hash with:
--   node scripts/hash-password.js "your-chosen-password"
-- then paste the output in place of the placeholder hash.

-- ---- permissions (mirrors src/config/permissions.ts — keep these in sync) ----
insert into permissions (key, label, category) values
  ('insights.create',        'Create insights',              'insights'),
  ('insights.edit_own',      'Edit own insights',             'insights'),
  ('insights.edit_any',      'Edit any insight',              'insights'),
  ('insights.publish',       'Publish / reject insights',     'insights'),
  ('insights.delete',        'Delete insights',               'insights'),
  ('practice_areas.manage',  'Manage practice areas',         'content'),
  ('team.manage',            'Manage team members',           'content'),
  ('inquiries.view',         'View contact inquiries',        'inquiries'),
  ('inquiries.manage',       'Manage contact inquiries',      'inquiries'),
  ('admins.manage',          'Create / edit / disable admins','system'),
  ('roles.manage',           'Create / edit roles',           'system');

-- ---- roles ----
-- Phase 6 §12: fixed 3-role model — SuperAdmin / Admin / Author, no custom
-- role builder (that UI, /admin/roles, is removed). superAdmin: is_super =
-- true, implicitly has every permission — never given an explicit
-- role_permissions list (checked as `role.is_super` in code).
insert into roles (name, slug, is_super) values
  ('Super Admin', 'super-admin', true),
  ('Admin', 'admin', false),
  ('Author', 'author', false);

-- Admin (§12): everything except managing a superAdmin's own account (that
-- restriction is enforced in code, not by withholding a permission key —
-- see src/actions/admins.ts). Practice Areas, Team, Insights (full
-- lifecycle), Inquiries, and creating/managing other Admins and Authors.
-- Deliberately does NOT include roles.manage — the screen it gated is gone.
insert into role_permissions (role_id, permission_id)
select r.id, p.id
from roles r, permissions p
where r.slug = 'admin'
  and p.key in (
    'insights.create', 'insights.edit_own', 'insights.edit_any', 'insights.publish', 'insights.delete',
    'practice_areas.manage', 'team.manage',
    'inquiries.view', 'inquiries.manage',
    'admins.manage'
  );

-- Author (§12): create/edit their own Insights, submit for review — cannot
-- publish, cannot edit others', cannot manage Practice Areas/Team/Inquiries/
-- other admins. This is exactly the old default 'admin' role's permission
-- set from before this phase — only the name changed.
insert into role_permissions (role_id, permission_id)
select r.id, p.id
from roles r, permissions p
where r.slug = 'author'
  and p.key in ('insights.create', 'insights.edit_own');

-- ---- bootstrap superAdmin ----
-- login_id is an internal identifier, not a deliverable inbox (§5.3) — the
-- "@utkarsh.internal" suffix is just a readable convention, not a real domain.
-- REPLACE THIS HASH — see comment at top of file.
insert into admins (login_id, name, password_hash, role_id, status)
select
  'superadmin@utkarsh.internal',
  'Super Admin',
  '$2a$10$REPLACE.WITH.REAL.BCRYPT.HASH.BEFORE.FIRST.RUN....',
  r.id,
  'active'
from roles r
where r.slug = 'super-admin';
