import type { Metadata } from "next";
import Link from "next/link";
import { requirePermission } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { InquiriesTable, type InquiryRow } from "@/components/admin/InquiriesTable";
import { ExportInquiriesButton } from "@/components/admin/ExportInquiriesButton";
import { cn } from "@/lib/utils";
import type { ContactSubmission, ContactSubmissionStatus } from "@/types/domain";

export const metadata: Metadata = { title: "Inquiries" };

// §5.2: "/admin/inquiries | inquiries.view / manage | Contact form
// submissions, mark read/archived, export." Was scoped nowhere explicitly
// in §9's phase breakdown (a genuine gap between Phase 2's "just wire the
// permission/sidebar/dashboard-count" and Phase 3's CMS-entity list, which
// only covers Practice Areas/Team/Offices/Insights) — built now, in Phase
// 4, because the public contact form (this phase) is the first thing that
// actually writes real rows here.
const STATUS_TABS: { value: "all" | ContactSubmissionStatus; label: string }[] = [
  { value: "all", label: "All" },
  { value: "new", label: "New" },
  { value: "read", label: "Read" },
  { value: "archived", label: "Archived" },
];

function preview(message: string, max = 80): string {
  const trimmed = message.trim();
  return trimmed.length > max ? trimmed.slice(0, max).trimEnd() + "…" : trimmed;
}

export default async function InquiriesListPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const actor = await requirePermission("inquiries.view");
  const { status: activeStatusParam } = await searchParams;
  const activeStatus = (activeStatusParam as ContactSubmissionStatus | undefined) ?? "all";

  const supabase = createServiceRoleClient();
  let query = supabase.from("contact_submissions").select("*").order("created_at", { ascending: false });
  if (activeStatus !== "all") {
    query = query.eq("status", activeStatus);
  }
  const { data, error } = await query;
  const submissions = (data ?? []) as ContactSubmission[];

  const canManage = hasPermission(actor, "inquiries.manage");

  const rows: InquiryRow[] = submissions.map((s) => ({
    id: s.id,
    name: s.name,
    email: s.email,
    practiceAreaInterest: s.practice_area_interest,
    messagePreview: preview(s.message),
    status: s.status,
    created_at: s.created_at,
    canManage,
  }));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="font-serif text-h3 text-navy-700">Inquiries</h1>
        <ExportInquiriesButton submissions={submissions} filename={`inquiries-${activeStatus}.csv`} />
      </div>

      <div className="mb-4 flex flex-wrap gap-1 border-b border-gray-300">
        {STATUS_TABS.map((tab) => (
          <Link
            key={tab.value}
            href={tab.value === "all" ? "/admin/inquiries" : `/admin/inquiries?status=${tab.value}`}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-[13px] font-semibold",
              activeStatus === tab.value ? "border-navy-700 text-navy-700" : "border-transparent text-gray-500 hover:text-navy-700"
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-sm border border-error bg-error-bg px-3.5 py-3 text-[13px] text-error">
          Couldn&apos;t load inquiries: {error.message}
        </div>
      )}

      <InquiriesTable rows={rows} />
    </div>
  );
}
