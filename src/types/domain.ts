import type { Permission } from "@/config/permissions";

/**
 * Hand-written domain types matching supabase/migrations/0001_init.sql.
 *
 * NOTE: this is deliberately NOT a full `supabase gen types typescript`
 * output — generating that requires the Supabase CLI linked to the live
 * project, which wasn't run in this environment (no network access here;
 * see PHASE-1-NOTES.md's environment note). Only the tables Phase 2 (Admin
 * core) touches are typed below. Recommended follow-up once convenient:
 *
 *   supabase gen types typescript --project-id <ref> > src/types/supabase.ts
 *
 * ...and swap these hand-written types for the generated ones. Until then,
 * keep this file in sync by hand if the schema changes.
 */

export type AdminStatus = "active" | "disabled";

export interface Role {
  id: string;
  name: string;
  slug: string;
  is_super: boolean;
  created_at: string;
}

export interface PermissionRow {
  id: string;
  key: Permission;
  label: string;
  category: string;
}

export interface Admin {
  id: string;
  login_id: string;
  name: string;
  password_hash: string;
  avatar_url: string | null;
  role_id: string;
  extra_permissions: Permission[];
  status: AdminStatus;
  created_at: string;
  last_login_at: string | null;
}

/** Admin row joined with its role — the shape most admin-list UI needs. */
export interface AdminWithRole extends Omit<Admin, "password_hash"> {
  role: Pick<Role, "id" | "name" | "slug" | "is_super">;
}

export interface RoleWithPermissions extends Role {
  permissionKeys: Permission[];
}

export interface SiteSetting {
  key: string;
  value: unknown; // jsonb
  updated_at: string;
  updated_by: string | null;
}

export interface AuditLogEntry {
  id: string;
  admin_id: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  meta: Record<string, unknown> | null;
  created_at: string;
}
