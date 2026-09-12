import type { Permission } from "./permissions";

export interface AdminNavItem {
  label: string;
  href: string;
  /** Omit for items every authenticated admin can see (Dashboard, Profile). */
  permission?: Permission;
  /** True items are hidden from anyone but superAdmin, regardless of extra_permissions — matches the §5.2 table's "(superAdmin only by default)" routes. Since per-admin overrides can still grant e.g. admins.manage to a non-super admin, this flag is advisory for the sidebar only — the actual page-level guard is requirePermission(), not requireSuperAdmin(), so a granted admin still gets in even though the item wouldn't otherwise show. Handled per-page, see src/app/admin/admins/page.tsx etc. */
  superOnlyByDefault?: boolean;
}

/**
 * Rendered by <Sidebar /> filtered against the logged-in admin's resolved
 * permission set (§5.2): "someone without team.manage simply never sees a
 * 'Team' item in their sidebar, rather than seeing it and hitting a blocked
 * page."
 *
 * Routes below marked (stub) don't have real CRUD yet — they're Phase 3
 * scope per project-plan.md §9. They render a lightweight
 * "coming in Phase 3" placeholder so the sidebar is fully wired now and
 * nothing links to a 404, without scope-creeping this phase into full CMS
 * entity CRUD.
 */
export const ADMIN_NAV: AdminNavItem[] = [
  { label: "Dashboard", href: "/admin" },
  { label: "Insights", href: "/admin/insights", permission: "insights.create" },
  { label: "Practice Areas", href: "/admin/practice-areas", permission: "practice_areas.manage" },
  { label: "Team", href: "/admin/team", permission: "team.manage" },
  { label: "Offices", href: "/admin/offices", permission: "offices.manage" },
  { label: "Inquiries", href: "/admin/inquiries", permission: "inquiries.view" },
  { label: "Admins", href: "/admin/admins", permission: "admins.manage", superOnlyByDefault: true },
  { label: "Roles", href: "/admin/roles", permission: "roles.manage", superOnlyByDefault: true },
  { label: "Settings", href: "/admin/settings", permission: "settings.manage", superOnlyByDefault: true },
];
