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
    // Responsive audit fix: `flex-col` (top bar + content stacked) below
    // `desktop`, `desktop:flex-row` (sidebar + content side by side) at and
    // above it — matches Sidebar.tsx's own breakpoint for switching between
    // its mobile top-bar and its persistent desktop aside.
    <div className="flex min-h-screen flex-col bg-cream desktop:flex-row">
      <Sidebar
        isSuper={admin.isSuper}
        permissions={Array.from(admin.permissions)}
        adminName={admin.name}
        roleName={admin.roleName}
      />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[1180px] px-4 py-6 tablet:px-8 tablet:py-8">{children}</div>
      </main>
    </div>
  );
}
