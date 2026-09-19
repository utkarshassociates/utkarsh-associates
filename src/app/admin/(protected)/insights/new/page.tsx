import type { Metadata } from "next";
import Link from "next/link";
import { requirePermission } from "@/lib/auth/session";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { InsightForm } from "@/components/admin/InsightForm";
import { Button } from "@/components/ui";

export const metadata: Metadata = { title: "New Insight" };

export default async function NewInsightPage() {
  await requirePermission("insights.create");

  const supabase = createServiceRoleClient();
  const [{ data: categories }, { data: teamMembers }, { data: practiceAreas }] = await Promise.all([
    supabase.from("insight_categories").select("id, name, slug").order("name"),
    supabase.from("team_members").select("id, name").order("name"),
    supabase.from("practice_areas").select("id, title").order("order_index"),
  ]);

  // Phase 6 §10: an Insight cannot exist without an author (insights.author_id
  // is a required FK to team_members). Rather than open a confusing form
  // with an empty, unexplained author dropdown, check for this dependency
  // upfront and guide the admin to the fix directly. No status filter here
  // (matches the author <select> below, which also has none) — a draft team
  // member is a valid author just as much as a published one.
  if (!teamMembers || teamMembers.length === 0) {
    return (
      <div>
        <h1 className="mb-6 font-serif text-h3 text-navy-700">New insight</h1>
        <div className="max-w-[480px] rounded-lg border border-gray-300 bg-gray-100 p-6">
          <p className="text-body text-ink-900">
            You need at least one Team Member before you can create an Insight, since every Insight needs an author.
          </p>
          <Link href="/admin/team/new" className="mt-4 inline-block">
            <Button variant="primary">Add a Team Member</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 font-serif text-h3 text-navy-700">New insight</h1>
      <InsightForm mode="create" categories={categories ?? []} teamMembers={teamMembers} practiceAreas={practiceAreas ?? []} />
    </div>
  );
}
