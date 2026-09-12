import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth/session";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { RoleForm } from "@/components/admin/RoleForm";

export const metadata: Metadata = { title: "New Role" };

export default async function NewRolePage() {
  await requirePermission("roles.manage");

  const supabase = createServiceRoleClient();
  const { data: permissions } = await supabase
    .from("permissions")
    .select("id, key, label, category")
    .order("category");

  return (
    <div>
      <h1 className="mb-6 font-serif text-h3 text-navy-700">New role</h1>
      <RoleForm mode="create" permissions={permissions ?? []} />
    </div>
  );
}
