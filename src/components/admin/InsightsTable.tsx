"use client";

import Link from "next/link";
import { createColumnHelper } from "@tanstack/react-table";
import { Tag } from "@/components/ui";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { DataTable } from "@/components/admin/DataTable";
import { deleteInsightAction } from "@/actions/insights";
import type { InsightStatus } from "@/types/domain";

export interface InsightRow {
  id: string;
  title: string;
  status: InsightStatus;
  post_type: "original" | "external_link";
  authorName: string;
  submittedBy: string | null;
  updated_at: string;
  canEdit: boolean;
  canDelete: boolean;
}

// See TeamTable.tsx for why this lives in its own "use client" component
// instead of being built inline in insights/page.tsx — same RSC-boundary
// fix, same root cause (a Server Component can't hand a Client Component an
// array of JSX-returning closures as a prop).
const columnHelper = createColumnHelper<InsightRow>();

const columns = [
  columnHelper.accessor("title", { header: "Title", cell: (info) => <span className="font-medium">{info.getValue()}</span> }),
  columnHelper.accessor("status", { header: "Status", cell: (info) => <StatusBadge status={info.getValue()} /> }),
  columnHelper.accessor("post_type", {
    header: "Type",
    cell: (info) => (info.getValue() === "external_link" ? <Tag variant="navy">External</Tag> : "Original"),
  }),
  columnHelper.accessor("authorName", { header: "Author" }),
  columnHelper.accessor("updated_at", { header: "Updated", cell: (info) => new Date(info.getValue()).toLocaleDateString() }),
  columnHelper.display({
    id: "edit",
    header: "",
    cell: (info) =>
      info.row.original.canEdit ? (
        <Link href={`/admin/insights/${info.row.original.id}/edit`} className="font-semibold text-navy-700 hover:text-gold-700">
          Edit →
        </Link>
      ) : (
        <span className="text-gray-300">Edit →</span>
      ),
  }),
  columnHelper.display({
    id: "delete",
    header: "",
    cell: (info) =>
      info.row.original.canDelete ? (
        <DeleteButton
          id={info.row.original.id}
          action={deleteInsightAction}
          confirmMessage={`Delete "${info.row.original.title}"? This can't be undone.`}
        />
      ) : null,
  }),
];

export function InsightsTable({ rows }: { rows: InsightRow[] }) {
  return <DataTable columns={columns} data={rows} searchPlaceholder="Search by title…" emptyMessage="No insights match this filter." />;
}
