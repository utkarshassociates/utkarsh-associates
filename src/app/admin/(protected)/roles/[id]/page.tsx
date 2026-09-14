import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth/session";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { RoleForm } from "@/components/admin/RoleForm";
import type { Permission } from "@/config/permissions";

export const metadata: Metadata = { title: "Edit Role" };

interface EditRolePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditRolePage({ params }: EditRolePageProps) {
  await requirePermission("roles.manage");
  const { id } = await params;

  const supabase = createServiceRoleClient();
  const [{ data: role }, { data: permissions }, { data: grantedRows }] = await Promise.all([
    supabase.from("roles").select("id, name, slug, is_super").eq("id", id).maybeSingle(),
    supabase.from("permissions").select("id, key, label, category").order("category"),
    supabase.from("role_permissions").select("permissions(key)").eq("role_id", id),
  ]);

  if (!role) notFound();

  // superAdmin has no editable permission list (it's implicit, checked via
  // is_super) — bounce back to the list rather than showing a broken form.
  if (role.is_super) redirect("/admin/roles");

  // Without generated Supabase Database types, TS infers `permissions` on
  // this embed as *always* an array shape, which narrows the ternary's
  // single-object branch below to `never` (caught by `npm run typecheck`
  // after Phase 3 shipped — this file predates Phase 3 and was never
  // typechecked before). Real Supabase behavior for a to-one embed like this
  // (role_permissions.permission_id → permissions) is a single object at
  // runtime, not an array, so the original defensive ternary was correct —
  // it just needed an honest type instead of trusting TS's array-only guess.
  type PermissionKeyRow = { permissions: { key: Permission } | { key: Permission }[] | null };
  const permissionKeys = ((grantedRows ?? []) as PermissionKeyRow[])
    .map((row) => (Array.isArray(row.permissions) ? row.permissions[0]?.key : row.permissions?.key))
    .filter((key): key is NonNullable<typeof key> => Boolean(key));

  return (
    <div>
      <h1 className="mb-1 font-serif text-h3 text-navy-700">{role.name}</h1>
      <p className="mb-6 font-mono text-[13px] text-gray-500">{role.slug}</p>

      <RoleForm
        mode="edit"
        permissions={permissions ?? []}
        initialValues={{
          roleId: role.id,
          name: role.name,
          slug: role.slug,
          permissionKeys,
        }}
      />
    </div>
  );
}
