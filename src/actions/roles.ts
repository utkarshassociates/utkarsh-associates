"use server";

import { revalidatePath } from "next/cache";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit";
import type { ActionResult } from "@/lib/action-result";
import {
  createRoleSchema,
  updateRolePermissionsSchema,
  type CreateRoleInput,
  type UpdateRolePermissionsInput,
} from "@/lib/validations/role";

/** Maps permission keys -> their row ids, since role_permissions stores the fk, not the key string. */
async function permissionIdsFor(
  supabase: ReturnType<typeof createServiceRoleClient>,
  keys: string[]
): Promise<string[]> {
  if (keys.length === 0) return [];
  const { data } = await supabase.from("permissions").select("id, key").in("key", keys);
  return (data ?? []).map((row) => row.id);
}

/**
 * Creates a new role. This is the concrete mechanism behind the plan's
 * "adding a future blogAdmin role is just a new row in `roles` with a
 * chosen permission set" — no schema or code change needed, exactly as
 * described. New roles are always created with is_super = false; superAdmin
 * status isn't grantable through this UI (it's a hand-picked, rare thing —
 * the bootstrap superAdmin comes from a seed script, and no launch flow
 * needs a second one).
 */
export async function createRoleAction(input: CreateRoleInput): Promise<ActionResult> {
  const actor = await requirePermission("roles.manage");

  const parsed = createRoleSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const { name, slug, permissionKeys } = parsed.data;

  const supabase = createServiceRoleClient();

  const { data: existing } = await supabase.from("roles").select("id").eq("slug", slug).maybeSingle();
  if (existing) {
    return { success: false, error: `Slug "${slug}" is already in use.` };
  }

  const { data: role, error } = await supabase
    .from("roles")
    .insert({ name, slug, is_super: false })
    .select("id")
    .single();

  if (error || !role) {
    return { success: false, error: "Could not create role. " + (error?.message ?? "") };
  }

  const permissionIds = await permissionIdsFor(supabase, permissionKeys);
  if (permissionIds.length > 0) {
    await supabase
      .from("role_permissions")
      .insert(permissionIds.map((permission_id) => ({ role_id: role.id, permission_id })));
  }

  await logAudit({
    adminId: actor.adminId,
    action: "create",
    entity: "roles",
    entityId: role.id,
    meta: { name, slug, permissionKeys },
  });

  revalidatePath("/admin/roles");
  return { success: true };
}

export async function updateRolePermissionsAction(
  input: UpdateRolePermissionsInput
): Promise<ActionResult> {
  const actor = await requirePermission("roles.manage");

  const parsed = updateRolePermissionsSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const { roleId, name, permissionKeys } = parsed.data;

  const supabase = createServiceRoleClient();

  const { data: role } = await supabase.from("roles").select("is_super").eq("id", roleId).single();
  if (role?.is_super) {
    return { success: false, error: "superAdmin's permissions can't be edited — it implicitly has every permission." };
  }

  const { error: updateError } = await supabase.from("roles").update({ name }).eq("id", roleId);
  if (updateError) {
    return { success: false, error: "Could not update role. " + updateError.message };
  }

  // No native "upsert the whole set" for a join table — clear and re-insert.
  // Fine for this table's scale (a handful of roles, edited rarely by
  // superAdmin only); not a hot path that needs to be transactional-safe
  // against concurrent editors.
  await supabase.from("role_permissions").delete().eq("role_id", roleId);
  const permissionIds = await permissionIdsFor(supabase, permissionKeys);
  if (permissionIds.length > 0) {
    await supabase
      .from("role_permissions")
      .insert(permissionIds.map((permission_id) => ({ role_id: roleId, permission_id })));
  }

  await logAudit({
    adminId: actor.adminId,
    action: "update_permissions",
    entity: "roles",
    entityId: roleId,
    meta: { name, permissionKeys },
  });

  revalidatePath("/admin/roles");
  revalidatePath(`/admin/roles/${roleId}`);
  return { success: true };
}
