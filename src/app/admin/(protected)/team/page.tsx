import Link from "next/link";
import type { Metadata } from "next";
import { createColumnHelper } from "@tanstack/react-table";
import { requirePermission } from "@/lib/auth/session";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { OrderControls } from "@/components/admin/OrderControls";
import { DataTable } from "@/components/admin/DataTable";
import { deleteTeamMemberAction, reorderTeamMemberAction } from "@/actions/team";

export const metadata: Metadata = { title: "Team" };

interface TeamRow {
  id: string;
  name: string;
  designation: string | null;
  status: string;
  order_index: number;
  isFirst: boolean;
  isLast: boolean;
}

const columnHelper = createColumnHelper<TeamRow>();

// §5.2 specs "ordering" for Team alongside CRUD/photo/practice-area links.
// The Order column uses the same up/down OrderControls as Practice
// Areas/Offices (see PHASE-3-NOTES.md re: drag-to-reorder substitution) —
// isFirst/isLast are precomputed from the order_index-sorted array *before*
// this data reaches DataTable, so they stay correct even if the admin has
// since sorted/searched the table by another column; the reorder action
// itself always operates on the full order_index-ordered list server-side
// regardless of what's currently visible.
const columns = [
  columnHelper.display({
    id: "order",
    header: "Order",
    cell: (info) => (
      <OrderControls id={info.row.original.id} isFirst={info.row.original.isFirst} isLast={info.row.original.isLast} action={reorderTeamMemberAction} />
    ),
  }),
  columnHelper.accessor("name", { header: "Name", cell: (info) => <span className="font-medium">{info.getValue()}</span> }),
  columnHelper.accessor("designation", { header: "Designation", cell: (info) => info.getValue() ?? "—" }),
  columnHelper.accessor("status", { header: "Status", cell: (info) => <StatusBadge status={info.getValue()} /> }),
  columnHelper.display({
    id: "edit",
    header: "",
    cell: (info) => (
      <Link href={`/admin/team/${info.row.original.id}`} className="font-semibold text-navy-700 hover:text-gold-700">
        Edit →
      </Link>
    ),
  }),
  columnHelper.display({
    id: "delete",
    header: "",
    cell: (info) => (
      <DeleteButton
        id={info.row.original.id}
        action={deleteTeamMemberAction}
        confirmMessage={`Delete "${info.row.original.name}"? This can't be undone.`}
      />
    ),
  }),
];

export default async function TeamListPage() {
  await requirePermission("team.manage");

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("team_members")
    .select("id, name, designation, status, order_index")
    .order("order_index", { ascending: true });

  const rows: TeamRow[] = (data ?? []).map((row, i, arr) => ({
    ...row,
    isFirst: i === 0,
    isLast: i === arr.length - 1,
  }));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-serif text-h3 text-navy-700">Team</h1>
        <Link href="/admin/team/new">
          <Button variant="primary">New team member</Button>
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-sm border border-error bg-error-bg px-3.5 py-3 text-[13px] text-error">
          Couldn&apos;t load team members: {error.message}
        </div>
      )}

      <DataTable columns={columns} data={rows} searchPlaceholder="Search by name…" emptyMessage="No team members yet." />
    </div>
  );
}
