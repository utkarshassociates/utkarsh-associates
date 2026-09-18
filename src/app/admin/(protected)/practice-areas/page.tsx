import Link from "next/link";
import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth/session";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { OrderControls } from "@/components/admin/OrderControls";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { deletePracticeAreaAction, reorderPracticeAreaAction } from "@/actions/practice-areas";
import { getPracticeAreaIconSrc } from "@/lib/utils";

export const metadata: Metadata = { title: "Practice Areas" };

export default async function PracticeAreasListPage() {
  await requirePermission("practice_areas.manage");

  const supabase = createServiceRoleClient();
  const { data: practiceAreas, error } = await supabase
    .from("practice_areas")
    .select("id, title, slug, icon_url, status, order_index")
    .order("order_index", { ascending: true });

  const rows = practiceAreas ?? [];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-serif text-h3 text-navy-700">Practice Areas</h1>
        <Link href="/admin/practice-areas/new">
          <Button variant="primary">New practice area</Button>
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-sm border border-error bg-error-bg px-3.5 py-3 text-[13px] text-error">
          Couldn&apos;t load practice areas: {error.message}
        </div>
      )}

      {/* overflow-x-auto (responsive audit fix), see DataTable.tsx for why */}
      <div className="overflow-x-auto rounded-lg border border-gray-300 bg-white">
        <table className="w-full text-left text-small">
          <thead>
            <tr className="border-b border-gray-300 bg-gray-100 text-[12px] uppercase tracking-wide text-gray-500">
              <th className="px-4 py-3 font-semibold">Order</th>
              <th className="px-4 py-3 font-semibold">Title</th>
              <th className="px-4 py-3 font-semibold">Icon</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3" />
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((pa, i) => (
              <tr key={pa.id} className="border-b border-gray-300 last:border-0">
                <td className="px-4 py-3">
                  <OrderControls id={pa.id} isFirst={i === 0} isLast={i === rows.length - 1} action={reorderPracticeAreaAction} />
                </td>
                <td className="px-4 py-3 font-medium text-ink-900">{pa.title}</td>
                <td className="px-4 py-3">
                  {/* eslint-disable-next-line @next/next/no-img-element -- small admin-list thumbnail, either a Storage URL or the local fallback SVG, not a next/image candidate */}
                  <img src={getPracticeAreaIconSrc(pa.icon_url)} alt="" width={24} height={24} className="h-6 w-6" />
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={pa.status} />
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/practice-areas/${pa.id}`} className="font-semibold text-navy-700 hover:text-gold-700">
                    Edit →
                  </Link>
                </td>
                <td className="px-4 py-3 text-right">
                  <DeleteButton
                    id={pa.id}
                    action={deletePracticeAreaAction}
                    confirmMessage={`Delete "${pa.title}"? This can't be undone.`}
                  />
                </td>
              </tr>
            ))}
            {rows.length === 0 && !error && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  No practice areas yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
