// Granular capability strings, not hardcoded roles. Roles (in the DB) are just
// named sets of these keys — adding a future role (e.g. blogAdmin) is a new
// `roles` row + `role_permissions` rows, never a schema or code change here.
//
// Phase 6 §11: offices.manage and settings.manage removed — both admin
// screens they gated (/admin/offices, /admin/settings) were removed in §1
// (that data now lives in src/config/content.json, no DB table, no CRUD).
// roles.manage stays for now: §11/§12 retire the custom role-builder UI in
// step 8 of the work sequence, not this schema step, so it's still an
// active permission until then.
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
  "roles.manage",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

// Default grant for the launch "admin" role. superAdmin implicitly
// has every permission via `role.is_super` and is never stored as a list.
export const DEFAULT_ADMIN_PERMISSIONS: Permission[] = ["insights.create", "insights.edit_own"];
