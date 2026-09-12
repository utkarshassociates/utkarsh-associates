import { NextResponse, type NextRequest } from "next/server";
import { verifySession } from "@/lib/auth/jwt";
import { SESSION_COOKIE } from "@/lib/auth/constants";

/**
 * Per project-plan.md §5.3: "middleware.ts verifies this JWT on every
 * /admin/* request before the page even renders."
 *
 * Scope: this checks the JWT's signature + expiry only (is this a real,
 * unexpired session at all?) and redirects to /admin/login if not. It does
 * NOT check fine-grained permissions or admin.status='active' — that needs a
 * DB round-trip, which src/lib/auth/session.ts's requireAdmin() /
 * requirePermission() do at the layout/page level (see src/app/admin/layout.tsx).
 * Two layers, same split as the RLS/server-action pattern in §6: middleware
 * is the fast authentication gate, the page-level checks are the
 * authorization/permission gate.
 *
 * Runtime note: verifySession() uses `jsonwebtoken`, which needs Node's
 * `crypto` module — not available in the default Edge middleware runtime.
 * Node.js middleware has been stable since Next.js 15.5, so `runtime: "nodejs"`
 * below should just work on 16.3.4, but this hasn't been run in this
 * sandbox (no network) — worth confirming with `npm run dev` and hitting
 * /admin/insights directly (should bounce to /admin/login) before relying on it.
 * If it ever throws an Edge-runtime error instead, the fallback is switching
 * jsonwebtoken for the `jose` package here specifically (Edge-compatible),
 * while keeping jsonwebtoken for the server-action/page-level code.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Let the login page itself through — everything else under /admin/* is guarded.
  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? verifySession(token) : null;

  if (!session) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  runtime: "nodejs",
  matcher: ["/admin/:path*"],
};
