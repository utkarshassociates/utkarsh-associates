import Link from "next/link";
import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth/session";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { Button, Tag } from "@/components/ui";

export const metadata: Metadata = { title: "Roles" };

export default async function RolesListPage() {
  await requirePermission("roles.manage");

  const supabase = createServiceRoleClient();
  const { data: roles, error } = await supabase
    .from("roles")
    .select("id, name, slug, is_super, role_permissions(id)")
    .order("created_at", { ascending: true });

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h1 className="font-serif text-h3 text-navy-700">Roles</h1>
        <Link href="/admin/roles/new">
          <Button variant="primary">New role</Button>
        </Link>
      </div>
      <p className="mb-6 max-w-[560px] text-small text-gray-700">
        Roles are named sets of permissions — adding a role like a future &quot;Blog Admin&quot;
        doesn&apos;t need a code change, just a new role here with the permissions it needs.
      </p>

      {error && (
        <div className="mb-4 rounded-sm border border-error bg-error-bg px-3.5 py-3 text-[13px] text-error">
          Couldn&apos;t load roles: {error.message}
        </div>
      )}

      {/* overflow-x-auto (responsive audit fix), see DataTable.tsx for why */}
      <div className="overflow-x-auto rounded-lg border border-gray-300 bg-white">
        <table className="w-full text-left text-small">
          <thead>
            <tr className="border-b border-gray-300 bg-gray-100 text-[12px] uppercase tracking-wide text-gray-500">
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Slug</th>
              <th className="px-4 py-3 font-semibold">Permissions</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {(roles ?? []).map((role) => (
              <tr key={role.id} className="border-b border-gray-300 last:border-0">
                <td className="px-4 py-3 font-medium text-ink-900">{role.name}</td>
                <td className="px-4 py-3 font-mono text-[13px] text-gray-700">{role.slug}</td>
                <td className="px-4 py-3 text-gray-700">
                  {role.is_super ? (
                    <Tag variant="gold">Implicit — all permissions</Tag>
                  ) : (
                    `${(role.role_permissions ?? []).length} granted`
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  {role.is_super ? (
                    <span className="text-gray-500">—</span>
                  ) : (
                    <Link href={`/admin/roles/${role.id}`} className="font-semibold text-navy-700 hover:text-gold-700">
                      Edit →
                    </Link>
                  )}
                </td>
              </tr>
            ))}
            {(roles ?? []).length === 0 && !error && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                  No roles yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
