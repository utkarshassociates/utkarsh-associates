import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth/session";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { AdminForm } from "@/components/admin/AdminForm";

export const metadata: Metadata = { title: "New Admin" };

export default async function NewAdminPage() {
  const actor = await requirePermission("admins.manage");

  const supabase = createServiceRoleClient();
  const [{ data: roles }, { data: permissions }] = await Promise.all([
    supabase.from("roles").select("id, name, slug, is_super").order("name"),
    supabase.from("permissions").select("id, key, label, category").order("category"),
  ]);

  const visibleRoles = actor.isSuper ? (roles ?? []) : (roles ?? []).filter((r) => !r.is_super);

  return (
    <div>
      <h1 className="mb-6 font-serif text-h3 text-navy-700">New admin</h1>
      <AdminForm mode="create" roles={visibleRoles} permissions={permissions ?? []} />
    </div>
  );
}
