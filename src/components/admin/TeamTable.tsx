"use client";

import Link from "next/link";
import { createColumnHelper } from "@tanstack/react-table";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { OrderControls } from "@/components/admin/OrderControls";
import { DataTable } from "@/components/admin/DataTable";
import { deleteTeamMemberAction, reorderTeamMemberAction } from "@/actions/team";

export interface TeamRow {
  id: string;
  name: string;
  designation: string | null;
  status: string;
  order_index: number;
  isFirst: boolean;
  isLast: boolean;
}

// Pulled out of team/page.tsx into its own "use client" component. Root
// cause of the bug this fixes: `columns` is an array of closures that
// return JSX (TanStack Table's `cell` renderers). team/page.tsx is a Server
// Component — building that array there and passing it as a prop into
// <DataTable> (a Client Component) means a non-serializable function has to
// cross the server→client boundary, which Next.js only allows for plain
// data and Server Actions, hence the "Functions cannot be passed directly
// to Client Components" runtime error. Moving the column definitions in
// here means they're constructed entirely on the client — only the plain
// `rows` data crosses the boundary now. (The imported `*Action` functions
// are fine to reference either side — they're Server Actions, which Next.js
// specifically supports passing/importing across the boundary.)
const columnHelper = createColumnHelper<TeamRow>();

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

export function TeamTable({ rows }: { rows: TeamRow[] }) {
  return <DataTable columns={columns} data={rows} searchPlaceholder="Search by name…" emptyMessage="No team members yet." />;
}
