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
  const actor = await requirePermission("admins.manage");
  const { id } = await params;

  const supabase = createServiceRoleClient();
  const [{ data: admin }, { data: roles }, { data: permissions }] = await Promise.all([
    supabase
      .from("admins")
      .select("id, login_id, name, status, extra_permissions, role_id, roles(name, is_super)")
      .eq("id", id)
      .maybeSingle(),
    supabase.from("roles").select("id, name, slug, is_super").order("name"),
    supabase.from("permissions").select("id, key, label, category").order("category"),
  ]);

  if (!admin) notFound();

  const adminRole = Array.isArray(admin.roles) ? admin.roles[0] : admin.roles;
  const targetIsSuper = adminRole?.is_super === true;

  // Security fix: only a superAdmin can manage another superAdmin's account.
  // The server actions already enforce this (see src/actions/admins.ts) —
  // this is the page-level version, so a non-super admin with admins.manage
  // sees a clear explanation instead of an editable form that would just
  // fail with an error on submit.
  if (targetIsSuper && !actor.isSuper) {
    return (
      <div>
        <h1 className="mb-1 font-serif text-h3 text-navy-700">{admin.name}</h1>
        <p className="mb-6 font-mono text-[13px] text-gray-500">{admin.login_id}</p>
        <div className="max-w-[480px] rounded-sm border border-warning bg-warning-bg px-4 py-3 text-[13px] text-warning">
          This account is a superAdmin. Only another superAdmin can view or change its role, permissions,
          status, or password.
        </div>
      </div>
    );
  }

  const visibleRoles = actor.isSuper ? (roles ?? []) : (roles ?? []).filter((r) => !r.is_super);

  return (
    <div>
      <h1 className="mb-1 font-serif text-h3 text-navy-700">{admin.name}</h1>
      <p className="mb-6 font-mono text-[13px] text-gray-500">{admin.login_id}</p>

      <AdminForm
        mode="edit"
        roles={visibleRoles}
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
          There&apos;s no self-service &quot;forgot password&quot; flow since login IDs aren&apos;t
          real inboxes — this admin asks a superAdmin (or anyone with admins.manage) to set a new one here.
        </p>
        <ResetPasswordForm adminId={admin.id} />
      </div>
    </div>
  );
}
