import { requireAdmin } from "@/lib/auth/session";
import { Sidebar } from "@/components/admin/Sidebar";

// IMPORTANT — this lives under the `(protected)` route group specifically so
// /admin/login (a sibling of `(protected)`, not inside it — see
// src/app/admin/login/page.tsx) is NOT wrapped by this layout. If
// requireAdmin() ran for /admin/login too, an unauthenticated visit would
// redirect to /admin/login, re-run this same layout, redirect again —
// an infinite loop. Route groups don't affect the URL (this layout still
// covers /admin, /admin/admins, /admin/roles, /admin/settings, etc.).
//
// middleware.ts already bounced unauthenticated requests before this layout
// runs; requireAdmin() here is the second, DB-backed layer — it also catches
// a session whose admin account was disabled after the JWT was issued (see
// src/lib/auth/permissions.ts).
export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();

  return (
    // `flex-col` (top bar + content stacked, natural page scroll) below
    // `desktop`; `desktop:flex-row desktop:h-screen` (sidebar + content side
    // by side, capped to the viewport) at and above it.
    //
    // The `desktop:h-screen` + `main`'s `desktop:min-h-0` pairing matters:
    // without it, `main`'s flex item defaults to a min-height equal to its
    // own content (the classic flexbox min-height:auto trap), so a tall page
    // (e.g. Settings) never actually triggers main's own overflow-y-auto —
    // the whole document grows and scrolls instead. Since the persistent
    // sidebar is a plain h-screen element, not position:sticky, that made it
    // scroll fully out of view after one screen height, leaving blank cream
    // behind it for the rest of the page. Capping the row to the viewport
    // height and letting `main` shrink lets `main` scroll internally while
    // the sidebar stays pinned in place, the way a persistent sidebar should.
    <div className="flex min-h-screen flex-col bg-cream desktop:h-screen desktop:flex-row">
      <Sidebar
        isSuper={admin.isSuper}
        permissions={Array.from(admin.permissions)}
        adminName={admin.name}
        roleName={admin.roleName}
      />
      <main className="flex-1 overflow-y-auto desktop:min-h-0">
        <div className="mx-auto max-w-[1180px] px-4 py-6 tablet:px-8 tablet:py-8">{children}</div>
      </main>
    </div>
  );
}
