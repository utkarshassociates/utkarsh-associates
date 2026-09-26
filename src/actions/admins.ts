"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit";
import type { ActionResult } from "@/lib/action-result";
import {
  createAdminSchema,
  updateAdminSchema,
  resetPasswordSchema,
  toggleAdminStatusSchema,
  type CreateAdminInput,
  type UpdateAdminInput,
  type ResetPasswordInput,
  type ToggleAdminStatusInput,
} from "@/lib/validations/admin";

const BCRYPT_ROUNDS = 10; // matches scripts/hash-password.js

export async function createAdminAction(input: CreateAdminInput): Promise<ActionResult> {
  const actor = await requirePermission("admins.manage");

  const parsed = createAdminSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const { loginId, name, roleId, password, extraPermissions } = parsed.data;

  const supabase = createServiceRoleClient();

  // There is exactly one superAdmin, created once via the bootstrap seed
  // script — never through this action, for anyone, including an acting
  // superAdmin themselves. (Previously this only blocked a *non-super*
  // actor from assigning the superAdmin role — meaning a superAdmin could
  // still have created a second one by calling this action directly, even
  // though the UI's role dropdown never offered that option. Tightened to
  // an unconditional rejection so "only one superAdmin will ever exist" is
  // a real guarantee enforced here, not just something the UI happens not
  // to expose.)
  const { data: targetRole } = await supabase.from("roles").select("is_super").eq("id", roleId).single();
  if (targetRole?.is_super) {
    return {
      success: false,
      error: "A new superAdmin can't be created here — there is exactly one, set up once at bootstrap.",
    };
  }

  const { data: existing } = await supabase
    .from("admins")
    .select("id")
    .eq("login_id", loginId)
    .maybeSingle();
  if (existing) {
    return { success: false, error: `Login ID "${loginId}" is already in use.` };
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const { data: created, error } = await supabase
    .from("admins")
    .insert({
      login_id: loginId,
      name,
      role_id: roleId,
      password_hash: passwordHash,
      extra_permissions: extraPermissions,
      status: "active",
    })
    .select("id")
    .single();

  if (error || !created) {
    return { success: false, error: "Could not create admin. " + (error?.message ?? "") };
  }

  await logAudit({
    adminId: actor.adminId,
    action: "create",
    entity: "admins",
    entityId: created.id,
    meta: { loginId, roleId },
  });

  revalidatePath("/admin/admins");
  return { success: true };
}

export async function updateAdminAction(input: UpdateAdminInput): Promise<ActionResult> {
  const actor = await requirePermission("admins.manage");

  const parsed = updateAdminSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const { adminId, name, roleId, extraPermissions, status } = parsed.data;

  const supabase = createServiceRoleClient();

  // Guardrail: don't let the very last active superAdmin be disabled or
  // demoted away from a super role — there'd be no one left who could undo it.
  const [{ data: targetBefore }, { data: newRole }] = await Promise.all([
    supabase.from("admins").select("id, status, roles(is_super)").eq("id", adminId).single(),
    supabase.from("roles").select("is_super").eq("id", roleId).single(),
  ]);

  const targetRole = Array.isArray(targetBefore?.roles) ? targetBefore.roles[0] : targetBefore?.roles;
  const targetWasSuper = targetRole?.is_super === true;
  const losingSuperStatus = status === "disabled" || newRole?.is_super !== true;

  // Security fix: only a superAdmin can touch an existing superAdmin's
  // account (name/role/status/permissions). Without this, anyone granted
  // admins.manage could edit, disable, or re-permission a superAdmin —
  // including their own account, to escalate.
  if (!actor.isSuper && targetWasSuper) {
    return { success: false, error: "Only a superAdmin can manage a superAdmin account." };
  }

  // There is exactly one superAdmin, created once via the bootstrap seed
  // script — this action can never promote an existing admin/author TO
  // superAdmin, for anyone, including an acting superAdmin. (Previously
  // this only blocked a *non-super* actor from promoting someone — tightened
  // for the same reason as the identical change in createAdminAction above:
  // "only one superAdmin will ever exist" should be a real, unconditional
  // guarantee, not just something the UI's role dropdown happens to hide.)
  const isPromotionToSuper = newRole?.is_super === true && !targetWasSuper;
  if (isPromotionToSuper) {
    return {
      success: false,
      error: "Can't promote an admin to superAdmin — there is exactly one, set up once at bootstrap.",
    };
  }

  // Only a superAdmin can change ANY admin's status (active/disabled) —
  // narrower than the admins.manage permission itself, which still lets a
  // regular Admin create new admins/authors and edit their name/role/extra
  // permissions. Disabling someone is treated as a step above that: it's
  // the one action here that can lock another admin out entirely, so it's
  // reserved for superAdmin specifically, per explicit product decision.
  if (!actor.isSuper && status !== targetBefore?.status) {
    return { success: false, error: "Only a superAdmin can change an admin's status." };
  }

  if (targetWasSuper && losingSuperStatus) {
    const { count } = await supabase
      .from("admins")
      .select("id, roles!inner(is_super)", { count: "exact", head: true })
      .eq("status", "active")
      .eq("roles.is_super", true);

    if ((count ?? 0) <= 1) {
      return {
        success: false,
        error:
          "Can't disable or demote the last active superAdmin — promote or activate another admin first.",
      };
    }
  }

  const { error } = await supabase
    .from("admins")
    .update({
      name,
      role_id: roleId,
      extra_permissions: extraPermissions,
      status,
    })
    .eq("id", adminId);

  if (error) {
    return { success: false, error: "Could not update admin. " + error.message };
  }

  await logAudit({
    adminId: actor.adminId,
    action: "update",
    entity: "admins",
    entityId: adminId,
    meta: { name, roleId, status },
  });

  revalidatePath("/admin/admins");
  revalidatePath(`/admin/admins/${adminId}`);
  return { success: true };
}

/**
 * Quick inline toggle for the admin list page — narrower payload than
 * updateAdminAction (just id + status), so the list page doesn't need to
 * fetch/resend each row's full name/role/extra-permissions just to flip
 * one field. Same superAdmin-only + last-active-superAdmin guardrails as
 * updateAdminAction's status-change path, kept small and self-contained
 * here rather than factored out, since both checks are only a few lines.
 */
export async function toggleAdminStatusAction(input: ToggleAdminStatusInput): Promise<ActionResult> {
  const actor = await requirePermission("admins.manage");

  if (!actor.isSuper) {
    return { success: false, error: "Only a superAdmin can change an admin's status." };
  }

  const parsed = toggleAdminStatusSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const { adminId, status } = parsed.data;

  const supabase = createServiceRoleClient();

  const { data: target } = await supabase
    .from("admins")
    .select("id, roles(is_super)")
    .eq("id", adminId)
    .single();
  const targetRole = Array.isArray(target?.roles) ? target.roles[0] : target?.roles;

  if (targetRole?.is_super === true && status === "disabled") {
    const { count } = await supabase
      .from("admins")
      .select("id, roles!inner(is_super)", { count: "exact", head: true })
      .eq("status", "active")
      .eq("roles.is_super", true);

    if ((count ?? 0) <= 1) {
      return { success: false, error: "Can't disable the last active superAdmin — activate another one first." };
    }
  }

  const { error } = await supabase.from("admins").update({ status }).eq("id", adminId);
  if (error) {
    return { success: false, error: "Could not update status. " + error.message };
  }

  await logAudit({ adminId: actor.adminId, action: "update", entity: "admins", entityId: adminId, meta: { status } });

  revalidatePath("/admin/admins");
  revalidatePath(`/admin/admins/${adminId}`);
  return { success: true };
}

export async function resetAdminPasswordAction(input: ResetPasswordInput): Promise<ActionResult> {
  const actor = await requirePermission("admins.manage");

  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const { adminId, newPassword } = parsed.data;

  const supabase = createServiceRoleClient();

  // Security fix: only a superAdmin can reset a superAdmin's password.
  // Without this, anyone granted admins.manage could take over a
  // superAdmin account just by resetting its password.
  const { data: target } = await supabase.from("admins").select("roles(is_super)").eq("id", adminId).single();
  const targetRole = Array.isArray(target?.roles) ? target.roles[0] : target?.roles;
  if (targetRole?.is_super && !actor.isSuper) {
    return { success: false, error: "Only a superAdmin can reset a superAdmin's password." };
  }

  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

  const { error } = await supabase.from("admins").update({ password_hash: passwordHash }).eq("id", adminId);
  if (error) {
    return { success: false, error: "Could not reset password. " + error.message };
  }

  // Manual reset is a deliberate, logged, superAdmin-driven flow — the
  // audit trail here is doing double duty as the record of "who reset whose
  // password and when."
  await logAudit({ adminId: actor.adminId, action: "reset_password", entity: "admins", entityId: adminId });

  revalidatePath(`/admin/admins/${adminId}`);
  return { success: true };
}
