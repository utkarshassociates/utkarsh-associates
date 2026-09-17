// Granular capability strings, not hardcoded roles. Roles (in the DB) are just
// named sets of these keys — adding a future role (e.g. blogAdmin) is a new
// `roles` row + `role_permissions` rows, never a schema or code change here.
export const PERMISSIONS = [
  "insights.create",
  "insights.edit_own",
  "insights.edit_any",
  "insights.publish",
  "insights.delete",
  "practice_areas.manage",
  "team.manage",
  "offices.manage",
  "inquiries.view",
  "inquiries.manage",
  "admins.manage",
  "roles.manage",
  "settings.manage",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

// Default grant for the launch "admin" role. superAdmin implicitly
// has every permission via `role.is_super` and is never stored as a list.
export const DEFAULT_ADMIN_PERMISSIONS: Permission[] = ["insights.create", "insights.edit_own"];
