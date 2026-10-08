import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { InsightForm } from "@/components/admin/InsightForm";
import { InsightReviewPanel } from "@/components/admin/InsightReviewPanel";
import { StatusBadge } from "@/components/admin/StatusBadge";
import type { InsightWithRelations } from "@/types/domain";

export const metadata: Metadata = { title: "Edit Insight" };

interface EditInsightPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditInsightPage({ params }: EditInsightPageProps) {
  const actor = await requireAdmin();
  const { id } = await params;

  const supabase = createServiceRoleClient();
  const [{ data: insight }, { data: categories }, { data: teamMembers }, { data: practiceAreas }] = await Promise.all([
    supabase
      .from("insights")
      .select("*, category:insight_categories(id, name, slug), author:team_members!insights_author_id_fkey(id, name, slug), authorLinks:insight_authors(position, member:team_members(id, name, slug))")
      .eq("id", id)
      .maybeSingle(),
    supabase.from("insight_categories").select("id, name, slug").order("name"),
    supabase.from("team_members").select("id, name").order("name"),
    supabase.from("practice_areas").select("id, title").order("order_index"),
  ]);

  if (!insight) notFound();

  const category = Array.isArray(insight.category) ? insight.category[0] : insight.category;
  const author = Array.isArray(insight.author) ? insight.author[0] : insight.author;
  const authors = ((insight.authorLinks ?? []) as { position: number; member: unknown }[])
    .sort((x, y) => x.position - y.position)
    .map((l) => (Array.isArray(l.member) ? l.member[0] : l.member))
    .filter(Boolean);

  // insights.edit_any covers everyone's; insights.edit_own only the
  // admin's own. Mirrors the same check in updateInsightAction — this is the
  // page-level version, so a non-owner without edit_any sees a clear
  // explanation instead of a form that would fail on submit (same pattern as
  // the superAdmin-account guard on /admin/admins/[id] from Phase 2).
  const canEdit = hasPermission(actor, "insights.edit_any") || (hasPermission(actor, "insights.edit_own") && insight.submitted_by === actor.adminId);

  if (!canEdit) {
    return (
      <div>
        <h1 className="mb-1 font-serif text-h3 text-navy-700">{insight.title}</h1>
        <div className="mb-6 flex items-center gap-2">
          <StatusBadge status={insight.status} />
        </div>
        <div className="max-w-[480px] rounded-sm border border-warning bg-warning-bg px-4 py-3 text-[13px] text-warning">
          You don&apos;t have permission to edit this insight — only its author (with insights.edit_own) or an
          admin with insights.edit_any can.
        </div>
      </div>
    );
  }

  const canPublish = hasPermission(actor, "insights.publish");

  return (
    <div>
      <div className="mb-1 flex items-center gap-3">
        <h1 className="font-serif text-h3 text-navy-700">{insight.title}</h1>
        <StatusBadge status={insight.status} />
      </div>

      {insight.status === "rejected" && insight.rejection_note && (
        <p className="mb-4 max-w-[640px] rounded-sm border border-error bg-error-bg px-3.5 py-3 text-[13px] text-error">
          <strong>Rejection note:</strong> {insight.rejection_note}
        </p>
      )}

      <div className="mb-6" />

      {insight.status === "pending_review" && canPublish && <InsightReviewPanel insightId={insight.id} />}

      <InsightForm
        mode="edit"
        initialValues={{ ...insight, category: category ?? null, author: author ?? null, authors } as InsightWithRelations}
        categories={categories ?? []}
        teamMembers={teamMembers ?? []}
        practiceAreas={practiceAreas ?? []}
      />
    </div>
  );
}
