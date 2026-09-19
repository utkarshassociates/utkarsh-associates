"use client";

import Link from "next/link";
import { createColumnHelper } from "@tanstack/react-table";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { InquiryStatusActions } from "@/components/admin/InquiryStatusActions";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { DataTable } from "@/components/admin/DataTable";
import { deleteInquiryAction } from "@/actions/inquiries";
import { formatDateDDMMYYYY } from "@/lib/utils";
import type { ContactSubmissionStatus } from "@/types/domain";

// Same RSC-boundary reasoning as TeamTable.tsx/InsightsTable.tsx (see
// PHASE-3-NOTES.md's "Lessons learned" #1): the column definitions contain
// JSX-returning cell renderers, so they're built here, inside a "use
// client" component, and the Server Component page only ever passes down a
// plain array of rows.
export interface InquiryRow {
  id: string;
  name: string;
  email: string;
  practiceAreaInterest: string | null;
  messagePreview: string;
  status: ContactSubmissionStatus;
  created_at: string;
  canManage: boolean;
}

const columnHelper = createColumnHelper<InquiryRow>();

const columns = [
  columnHelper.accessor("name", {
    header: "From",
    cell: (info) => (
      <Link href={`/admin/inquiries/${info.row.original.id}`} className="font-medium text-navy-700 hover:text-gold-700">
        {info.getValue()}
      </Link>
    ),
  }),
  columnHelper.accessor("email", { header: "Email" }),
  columnHelper.accessor("practiceAreaInterest", {
    header: "Practice Area",
    cell: (info) => info.getValue() ?? "—",
  }),
  columnHelper.accessor("messagePreview", {
    header: "Message",
    cell: (info) => (
      <Link href={`/admin/inquiries/${info.row.original.id}`} className="text-gray-700 hover:text-navy-700">
        {info.getValue()}
      </Link>
    ),
  }),
  columnHelper.accessor("status", { header: "Status", cell: (info) => <StatusBadge status={info.getValue()} /> }),
  columnHelper.accessor("created_at", { header: "Received", cell: (info) => formatDateDDMMYYYY(info.getValue()) }),
  columnHelper.display({
    id: "actions",
    header: "",
    cell: (info) => (
      <div className="flex flex-wrap items-center gap-3">
        <Link href={`/admin/inquiries/${info.row.original.id}`} className="font-semibold text-navy-700 hover:text-gold-700">
          View →
        </Link>
        {info.row.original.canManage && (
          <>
            <InquiryStatusActions id={info.row.original.id} status={info.row.original.status} />
            <DeleteButton id={info.row.original.id} action={deleteInquiryAction} confirmMessage="Delete this inquiry? This can't be undone." />
          </>
        )}
      </div>
    ),
  }),
];

export function InquiriesTable({ rows }: { rows: InquiryRow[] }) {
  return <DataTable columns={columns} data={rows} searchPlaceholder="Search by name or email…" emptyMessage="No inquiries match this filter." />;
}
