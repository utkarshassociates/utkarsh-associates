import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth/session";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { AdminForm } from "@/components/admin/AdminForm";
import { FIXED_ADMIN_ROLE_SLUGS } from "@/config/roles";

export const metadata: Metadata = { title: "New Admin" };

export default async function NewAdminPage() {
  await requirePermission("admins.manage");

  const supabase = createServiceRoleClient();
  const [{ data: roles }, { data: permissions }] = await Promise.all([
    supabase.from("roles").select("id, name, slug, is_super").order("name"),
    supabase.from("permissions").select("id, key, label, category").order("category"),
  ]);

  // Phase 6 §12: the role dropdown is fixed to Admin/Author now — SuperAdmin
  // is bootstrap-only and not creatable through this UI at all, even for a
  // superAdmin actor (tightened from the pre-Phase-6 behavior, where a
  // superAdmin actor could hand out the superAdmin role here; there's no
  // launch flow that needs a second one). The slug filter is defensive —
  // nothing can seed a role beyond these two now that /admin/roles is gone
  // — but it's cheap insurance against a stray DB row.
  const visibleRoles = (roles ?? []).filter((r) => (FIXED_ADMIN_ROLE_SLUGS as readonly string[]).includes(r.slug));

  return (
    <div>
      <h1 className="mb-6 font-serif text-h3 text-navy-700">New admin</h1>
      <AdminForm mode="create" roles={visibleRoles} permissions={permissions ?? []} />
    </div>
  );
}
