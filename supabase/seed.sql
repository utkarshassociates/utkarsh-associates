-- Seeds: roles, permissions, role_permissions, and the bootstrap superAdmin.
-- Run once against a fresh database (after 0001_init.sql).
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
  ('offices.manage',         'Manage offices',                'content'),
  ('inquiries.view',         'View contact inquiries',        'inquiries'),
  ('inquiries.manage',       'Manage contact inquiries',      'inquiries'),
  ('admins.manage',          'Create / edit / disable admins','system'),
  ('roles.manage',           'Create / edit roles',           'system'),
  ('settings.manage',        'Manage site settings',          'system');

-- ---- roles ----
-- superAdmin: is_super = true, implicitly has every permission — never given
-- an explicit role_permissions list (checked as `role.is_super` in code).
insert into roles (name, slug, is_super) values
  ('Super Admin', 'super-admin', true),
  ('Admin', 'admin', false);

-- admin's default grant: insights.create, insights.edit_own (§5.1)
insert into role_permissions (role_id, permission_id)
select r.id, p.id
from roles r, permissions p
where r.slug = 'admin'
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
