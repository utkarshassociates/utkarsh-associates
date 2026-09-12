import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySession, type SessionPayload } from "./jwt";
import { resolveAdmin, hasPermission, type ResolvedAdmin } from "./permissions";
import type { Permission } from "@/config/permissions";

import { SESSION_COOKIE } from "./constants";

// Re-exported so other files can `import { SESSION_COOKIE } from "./session"`
// for convenience — but middleware.ts and src/actions/auth.ts import
// directly from ./constants instead, so the middleware bundle doesn't pull
// in next/navigation, resolveAdmin, or any DB code just for a string constant.
export { SESSION_COOKIE, SESSION_COOKIE_OPTIONS } from "./constants";

/** Reads + verifies the session cookie. Returns null if missing/invalid/expired — never throws. */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}

/** getSession() + a DB round-trip to resolve current role/permissions/status. Null if not logged in, or the account was disabled/deleted since the JWT was issued. */
export async function getCurrentAdmin(): Promise<ResolvedAdmin | null> {
  const session = await getSession();
  if (!session) return null;
  return resolveAdmin(session);
}

/** For server components: redirects to /admin/login if there's no valid, active session. */
export async function requireAdmin(): Promise<ResolvedAdmin> {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}

/** For server components/actions: requireAdmin() + a specific permission check. Redirects to /admin (not /admin/login) on a permission failure, since the admin IS logged in — they just can't do this. */
export async function requirePermission(key: Permission): Promise<ResolvedAdmin> {
  const admin = await requireAdmin();
  if (!hasPermission(admin, key)) redirect("/admin");
  return admin;
}

/** For server components/actions restricted to superAdmin (Admins, Roles, Settings — §5.2). */
export async function requireSuperAdmin(): Promise<ResolvedAdmin> {
  const admin = await requireAdmin();
  if (!admin.isSuper) redirect("/admin");
  return admin;
}
