import Link from "next/link";
import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth/session";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui";
import { StatusBadge } from "@/components/admin/StatusBadge";

export const metadata: Metadata = { title: "Admins" };

export default async function AdminsListPage() {
  await requirePermission("admins.manage");

  const supabase = createServiceRoleClient();
  const { data: admins, error } = await supabase
    .from("admins")
    .select("id, login_id, name, status, last_login_at, roles(name, is_super)")
    .order("created_at", { ascending: true });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-serif text-h3 text-navy-700">Admins</h1>
        <Link href="/admin/admins/new">
          <Button variant="primary">New admin</Button>
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-sm border border-error bg-error-bg px-3.5 py-3 text-[13px] text-error">
          Couldn&apos;t load admins: {error.message}
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-gray-300 bg-white">
        <table className="w-full text-left text-small">
          <thead>
            <tr className="border-b border-gray-300 bg-gray-100 text-[12px] uppercase tracking-wide text-gray-500">
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Login ID</th>
              <th className="px-4 py-3 font-semibold">Role</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Last login</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {(admins ?? []).map((admin) => {
              const role = Array.isArray(admin.roles) ? admin.roles[0] : admin.roles;
              return (
                <tr key={admin.id} className="border-b border-gray-300 last:border-0">
                  <td className="px-4 py-3 font-medium text-ink-900">{admin.name}</td>
                  <td className="px-4 py-3 font-mono text-[13px] text-gray-700">{admin.login_id}</td>
                  <td className="px-4 py-3 text-gray-700">
                    {role?.name}
                    {role?.is_super && " ⭐"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={admin.status} />
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {admin.last_login_at ? new Date(admin.last_login_at).toLocaleString() : "Never"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/admins/${admin.id}`} className="font-semibold text-navy-700 hover:text-gold-700">
                      Edit →
                    </Link>
                  </td>
                </tr>
              );
            })}
            {(admins ?? []).length === 0 && !error && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  No admins yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
