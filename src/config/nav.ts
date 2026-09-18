import type { Permission } from "./permissions";

export interface AdminNavItem {
  label: string;
  href: string;
  /** Omit for items every authenticated admin can see (Dashboard, Profile). */
  permission?: Permission;
  /** For items reachable via more than one permission (e.g. Insights — see requireAnyPermission in src/lib/auth/session.ts). Checked as "has at least one of these". Takes precedence over `permission` if both are set. */
  anyPermission?: Permission[];
  /** True items are hidden from anyone but superAdmin, regardless of extra_permissions. Since per-admin overrides can still grant e.g. admins.manage to a non-super admin, this flag is advisory for the sidebar only — the actual page-level guard is requirePermission(), not requireSuperAdmin(), so a granted admin still gets in even though the item wouldn't otherwise show. Handled per-page, see src/app/admin/(protected)/admins/page.tsx etc. */
  superOnlyByDefault?: boolean;
}

/**
 * Rendered by <Sidebar /> filtered against the logged-in admin's resolved
 * permission set: someone without team.manage simply never sees a "Team"
 * item in their sidebar, rather than seeing it and hitting a blocked page.
 *
 * Phase 3 update: Insights now uses `anyPermission` instead of a single
 * `permission` — /admin/insights itself is gated by requireAnyPermission()
 * (any of create/edit_own/edit_any/publish/delete), so an admin who only
 * has e.g. insights.publish (a future blogAdmin who reviews but never
 * drafts) should still see the nav item, which the old
 * single-`permission: "insights.create"` check would have hidden from them.
 */
export const ADMIN_NAV: AdminNavItem[] = [
  { label: "Dashboard", href: "/admin" },
  {
    label: "Insights",
    href: "/admin/insights",
    anyPermission: ["insights.create", "insights.edit_own", "insights.edit_any", "insights.publish", "insights.delete"],
  },
  { label: "Practice Areas", href: "/admin/practice-areas", permission: "practice_areas.manage" },
  { label: "Team", href: "/admin/team", permission: "team.manage" },
  { label: "Inquiries", href: "/admin/inquiries", permission: "inquiries.view" },
  { label: "Admins", href: "/admin/admins", permission: "admins.manage", superOnlyByDefault: true },
  { label: "Roles", href: "/admin/roles", permission: "roles.manage", superOnlyByDefault: true },
];
