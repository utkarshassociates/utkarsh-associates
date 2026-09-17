import { createServiceRoleClient } from "@/lib/supabase/server";
import type { Permission } from "@/config/permissions";
import type { SessionPayload } from "./jwt";

export interface ResolvedAdmin {
  adminId: string;
  name: string;
  loginId: string;
  roleId: string;
  roleSlug: string;
  roleName: string;
  isSuper: boolean;
  /** Role permissions + this admin's individual extra_permissions, merged. Empty/irrelevant for superAdmins (isSuper implies everything). */
  permissions: Set<Permission>;
}

/**
 * Resolves the logged-in admin's *current* permission set from the database.
 *
 * Deliberately NOT cached in the JWT: a superAdmin can
 * grant/revoke a role's permissions or an individual admin's extra
 * permissions at any time from /admin/roles or /admin/admins/[id]. If we put
 * permissions in the token, a revoked admin would keep the old access until
 * their 8h session expired. Resolving fresh means a permission change takes
 * effect on the admin's very next request.
 *
 * Also re-checks `status` here — a disabled admin's still-valid JWT should
 * not grant access, so this doubles as the "did superAdmin deactivate this
 * account mid-session" check.
 */
export async function resolveAdmin(session: SessionPayload): Promise<ResolvedAdmin | null> {
  const supabase = createServiceRoleClient();

  const { data: admin, error } = await supabase
    .from("admins")
    .select(
      "id, login_id, name, status, extra_permissions, role_id, roles(id, name, slug, is_super)"
    )
    .eq("id", session.adminId)
    .single();

  if (error || !admin || admin.status !== "active") return null;

  const role = Array.isArray(admin.roles) ? admin.roles[0] : admin.roles;
  if (!role) return null;

  const permissions = new Set<Permission>((admin.extra_permissions ?? []) as Permission[]);

  if (!role.is_super) {
    const { data: rolePerms } = await supabase
      .from("role_permissions")
      .select("permissions(key)")
      .eq("role_id", role.id);

    for (const row of rolePerms ?? []) {
      const perm = Array.isArray(row.permissions) ? row.permissions[0] : row.permissions;
      if (perm?.key) permissions.add(perm.key as Permission);
    }
  }

  return {
    adminId: admin.id,
    loginId: admin.login_id,
    name: admin.name,
    roleId: role.id,
    roleSlug: role.slug,
    roleName: role.name,
    isSuper: role.is_super,
    permissions,
  };
}

export function hasPermission(admin: ResolvedAdmin, key: Permission): boolean {
  return admin.isSuper || admin.permissions.has(key);
}
