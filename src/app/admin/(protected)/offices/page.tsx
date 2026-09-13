import Link from "next/link";
import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth/session";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { Button, Tag } from "@/components/ui";
import { OrderControls } from "@/components/admin/OrderControls";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { deleteOfficeAction, reorderOfficeAction } from "@/actions/offices";

export const metadata: Metadata = { title: "Offices" };

export default async function OfficesListPage() {
  await requirePermission("offices.manage");

  const supabase = createServiceRoleClient();
  const { data: offices, error } = await supabase
    .from("offices")
    .select("id, name, city, phone, is_headquarters, order_index")
    .order("order_index", { ascending: true });

  const rows = offices ?? [];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-serif text-h3 text-navy-700">Offices</h1>
        <Link href="/admin/offices/new">
          <Button variant="primary">New office</Button>
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-sm border border-error bg-error-bg px-3.5 py-3 text-[13px] text-error">
          Couldn&apos;t load offices: {error.message}
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-gray-300 bg-white">
        <table className="w-full text-left text-small">
          <thead>
            <tr className="border-b border-gray-300 bg-gray-100 text-[12px] uppercase tracking-wide text-gray-500">
              <th className="px-4 py-3 font-semibold">Order</th>
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">City</th>
              <th className="px-4 py-3 font-semibold">Phone</th>
              <th className="px-4 py-3 font-semibold"></th>
              <th className="px-4 py-3" />
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((office, i) => (
              <tr key={office.id} className="border-b border-gray-300 last:border-0">
                <td className="px-4 py-3">
                  <OrderControls id={office.id} isFirst={i === 0} isLast={i === rows.length - 1} action={reorderOfficeAction} />
                </td>
                <td className="px-4 py-3 font-medium text-ink-900">{office.name}</td>
                <td className="px-4 py-3 text-gray-700">{office.city ?? "—"}</td>
                <td className="px-4 py-3 text-gray-700">{office.phone ?? "—"}</td>
                <td className="px-4 py-3">{office.is_headquarters && <Tag variant="gold">HQ</Tag>}</td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/offices/${office.id}`} className="font-semibold text-navy-700 hover:text-gold-700">
                    Edit →
                  </Link>
                </td>
                <td className="px-4 py-3 text-right">
                  <DeleteButton id={office.id} action={deleteOfficeAction} confirmMessage={`Delete "${office.name}"? This can't be undone.`} />
                </td>
              </tr>
            ))}
            {rows.length === 0 && !error && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  No offices yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
