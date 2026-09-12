export const SESSION_COOKIE = "utkarsh_admin_session";

/** Shared by the set (login, src/actions/auth.ts) and clear (logout) calls. */
export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};
