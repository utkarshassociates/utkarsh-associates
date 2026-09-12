import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth/session";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { AdminForm } from "@/components/admin/AdminForm";
import { ResetPasswordForm } from "@/components/admin/ResetPasswordForm";

export const metadata: Metadata = { title: "Edit Admin" };

interface EditAdminPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditAdminPage({ params }: EditAdminPageProps) {
  await requirePermission("admins.manage");
  const { id } = await params;

  const supabase = createServiceRoleClient();
  const [{ data: admin }, { data: roles }, { data: permissions }] = await Promise.all([
    supabase
      .from("admins")
      .select("id, login_id, name, status, extra_permissions, role_id")
      .eq("id", id)
      .maybeSingle(),
    supabase.from("roles").select("id, name, slug, is_super").order("name"),
    supabase.from("permissions").select("id, key, label, category").order("category"),
  ]);

  if (!admin) notFound();

  return (
    <div>
      <h1 className="mb-1 font-serif text-h3 text-navy-700">{admin.name}</h1>
      <p className="mb-6 font-mono text-[13px] text-gray-500">{admin.login_id}</p>

      <AdminForm
        mode="edit"
        roles={roles ?? []}
        permissions={permissions ?? []}
        initialValues={{
          adminId: admin.id,
          loginId: admin.login_id,
          name: admin.name,
          roleId: admin.role_id,
          extraPermissions: admin.extra_permissions ?? [],
          status: admin.status,
        }}
      />

      <div className="mt-10 border-t border-gray-300 pt-8">
        <h2 className="mb-1 text-[14px] font-semibold uppercase tracking-wide text-gray-700">
          Reset password
        </h2>
        <p className="mb-4 max-w-[420px] text-[13px] text-gray-700">
          Per §5.3, there&apos;s no self-service &quot;forgot password&quot; flow since login IDs aren&apos;t
          real inboxes — this admin asks a superAdmin (or anyone with admins.manage) to set a new one here.
        </p>
        <ResetPasswordForm adminId={admin.id} />
      </div>
    </div>
  );
}
