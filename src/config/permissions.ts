// Granular capability strings, not hardcoded roles. Roles (in the DB) are just
// named sets of these keys — adding a future role (e.g. blogAdmin) is a new
// `roles` row + `role_permissions` rows, never a schema or code change here.
//
// Phase 6 §11: offices.manage and settings.manage removed — both admin
// screens they gated (/admin/offices, /admin/settings) were removed in §1
// (that data now lives in src/config/content.json, no DB table, no CRUD).
// roles.manage removed too — the custom role-builder screen it gated
// (/admin/roles) was retired in §12's fixed 3-role model, and nothing left
// in the codebase checks this permission, so it had become a dead checkbox
// in the Admins UI's "Extra permissions" list (visibly checkable, silently
// did nothing). If a real live database was seeded before this change, its
// `permissions` table still has the old `roles.manage` row — this file only
// controls what a *fresh* seed inserts, so also run:
//   delete from role_permissions where permission_id in (select id from permissions where key = 'roles.manage');
//   delete from permissions where key = 'roles.manage';
// against an already-seeded database to remove it there too. The two pages
// that render the "Extra permissions" checklist also defensively filter out
// that key at query time regardless (see admins/new and admins/[id] pages),
// so the checkbox disappears immediately either way, whether or not that
// cleanup SQL has been run yet.
export const PERMISSIONS = [
  "insights.create",
  "insights.edit_own",
  "insights.edit_any",
  "insights.publish",
  "insights.delete",
  "practice_areas.manage",
  "team.manage",
  "inquiries.view",
  "inquiries.manage",
  "admins.manage",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

// Default grant for the launch "admin" role. superAdmin implicitly
// has every permission via `role.is_super` and is never stored as a list.
export const DEFAULT_ADMIN_PERMISSIONS: Permission[] = ["insights.create", "insights.edit_own"];
