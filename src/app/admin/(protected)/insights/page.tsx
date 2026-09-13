import Link from "next/link";
import type { Metadata } from "next";
import { requireAnyPermission } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui";
import { InsightsTable, type InsightRow } from "@/components/admin/InsightsTable";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Insights" };

// §5.2: "/admin/insights | insights.* | List with status filters
// (draft/pending/published/rejected/external), search". Status filtering is
// a server-side query-param filter (tabs below); "external" filters by
// post_type instead of status, so it's handled as a separate tab value.
const STATUS_TABS: { value: string; label: string }[] = [
  { value: "all", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "pending_review", label: "Pending Review" },
  { value: "published", label: "Published" },
  { value: "rejected", label: "Rejected" },
  { value: "external_link", label: "External" },
];

interface InsightsListPageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function InsightsListPage({ searchParams }: InsightsListPageProps) {
  const actor = await requireAnyPermission(["insights.create", "insights.edit_own", "insights.edit_any", "insights.publish", "insights.delete"]);
  const { status: activeStatus = "all" } = await searchParams;

  const supabase = createServiceRoleClient();
  let query = supabase
    .from("insights")
    .select("id, title, status, post_type, submitted_by, updated_at, team_members(name)")
    .order("updated_at", { ascending: false });

  if (activeStatus === "external_link") {
    query = query.eq("post_type", "external_link");
  } else if (activeStatus !== "all") {
    query = query.eq("status", activeStatus);
  }

  const { data, error } = await query;

  const canEditAny = hasPermission(actor, "insights.edit_any");
  const canEditOwn = hasPermission(actor, "insights.edit_own");
  const canDelete = hasPermission(actor, "insights.delete");

  const rows: InsightRow[] = (data ?? []).map((row) => {
    const author = Array.isArray(row.team_members) ? row.team_members[0] : row.team_members;
    return {
      id: row.id,
      title: row.title,
      status: row.status,
      post_type: row.post_type,
      authorName: author?.name ?? "—",
      submittedBy: row.submitted_by,
      updated_at: row.updated_at,
      canEdit: canEditAny || (canEditOwn && row.submitted_by === actor.adminId),
      canDelete,
    };
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-serif text-h3 text-navy-700">Insights</h1>
        <div className="flex gap-3">
          <Link href="/admin/insights/categories">
            <Button variant="outline">Categories</Button>
          </Link>
          {hasPermission(actor, "insights.create") && (
            <Link href="/admin/insights/new">
              <Button variant="primary">New insight</Button>
            </Link>
          )}
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-1 border-b border-gray-300">
        {STATUS_TABS.map((tab) => (
          <Link
            key={tab.value}
            href={tab.value === "all" ? "/admin/insights" : `/admin/insights?status=${tab.value}`}
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
          Couldn&apos;t load insights: {error.message}
        </div>
      )}

      <InsightsTable rows={rows} />
    </div>
  );
}
