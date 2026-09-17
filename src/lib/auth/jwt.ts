import jwt from "jsonwebtoken";

/**
 * Session strategy is `jwt`, not `database`. The
 * token carries only id + role (not the full resolved permission set) —
 * see src/lib/auth/permissions.ts for why permissions are resolved fresh
 * per request rather than embedded here.
 */

const SESSION_DURATION = "8h";

export interface SessionPayload {
  adminId: string;
  roleId: string;
  roleSlug: string;
  isSuper: boolean;
  name: string;
}

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    // Fail loudly and specifically rather than letting jsonwebtoken throw a
    // generic "secret or public key must be provided" error later.
    throw new Error(
      "JWT_SECRET is not set. Generate one with `openssl rand -base64 32` " +
        "and add it to .env.local (see .env.example)."
    );
  }
  return secret;
}

export function signSession(payload: SessionPayload): string {
  return jwt.sign(payload, getSecret(), { expiresIn: SESSION_DURATION });
}

/** Returns the decoded payload if `token` is a validly-signed, unexpired session — otherwise null. */
export function verifySession(token: string): SessionPayload | null {
  try {
    const decoded = jwt.verify(token, getSecret());
    if (typeof decoded === "string") return null;

    const { adminId, roleId, roleSlug, isSuper, name } = decoded as Record<string, unknown>;
    if (
      typeof adminId !== "string" ||
      typeof roleId !== "string" ||
      typeof roleSlug !== "string" ||
      typeof isSuper !== "boolean" ||
      typeof name !== "string"
    ) {
      return null;
    }

    return { adminId, roleId, roleSlug, isSuper, name };
  } catch {
    // Expired, malformed, or signed with a different secret — all treated
    // the same way: no session.
    return null;
  }
}
