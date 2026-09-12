"use server";

import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { signSession } from "@/lib/auth/jwt";
import { SESSION_COOKIE, SESSION_COOKIE_OPTIONS } from "@/lib/auth/constants";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { logAudit } from "@/lib/audit";

export interface LoginResult {
  success: boolean;
  error?: string;
}

/**
 * Credentials check against the `admins` table (§5.3) — no Supabase Auth
 * involved. Deliberately returns the SAME generic error for "no such
 * login_id" and "wrong password", so the login form can't be used to
 * enumerate valid login IDs.
 */
export async function loginAction(input: LoginInput): Promise<LoginResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Enter a login ID and password." };
  }

  const { loginId, password } = parsed.data;
  const supabase = createServiceRoleClient();

  const { data: admin, error } = await supabase
    .from("admins")
    .select("id, login_id, name, password_hash, status, role_id, roles(id, name, slug, is_super)")
    .eq("login_id", loginId)
    .maybeSingle();

  const GENERIC_ERROR = "Incorrect login ID or password.";

  if (error || !admin) {
    return { success: false, error: GENERIC_ERROR };
  }

  const passwordMatches = await bcrypt.compare(password, admin.password_hash);
  if (!passwordMatches) {
    return { success: false, error: GENERIC_ERROR };
  }

  if (admin.status !== "active") {
    // Deliberately more specific than GENERIC_ERROR here: the credentials
    // *were* correct, and telling a legitimately-disabled admin to contact
    // superAdmin is more useful than a generic "wrong password" — it's not
    // an enumeration risk since they already proved they know the password.
    return { success: false, error: "This account has been disabled. Contact a superAdmin." };
  }

  const role = Array.isArray(admin.roles) ? admin.roles[0] : admin.roles;
  if (!role) {
    return { success: false, error: GENERIC_ERROR };
  }

  const token = signSession({
    adminId: admin.id,
    roleId: role.id,
    roleSlug: role.slug,
    isSuper: role.is_super,
    name: admin.name,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, { ...SESSION_COOKIE_OPTIONS, maxAge: 60 * 60 * 8 });

  await supabase.from("admins").update({ last_login_at: new Date().toISOString() }).eq("id", admin.id);
  await logAudit({ adminId: admin.id, action: "login", entity: "admins", entityId: admin.id });

  return { success: true };
}

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  redirect("/admin/login");
}
