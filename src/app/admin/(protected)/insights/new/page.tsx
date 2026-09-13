import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth/session";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { InsightForm } from "@/components/admin/InsightForm";

export const metadata: Metadata = { title: "New Insight" };

export default async function NewInsightPage() {
  await requirePermission("insights.create");

  const supabase = createServiceRoleClient();
  const [{ data: categories }, { data: teamMembers }] = await Promise.all([
    supabase.from("insight_categories").select("id, name, slug").order("name"),
    supabase.from("team_members").select("id, name").order("name"),
  ]);

  return (
    <div>
      <h1 className="mb-6 font-serif text-h3 text-navy-700">New insight</h1>
      <InsightForm mode="create" categories={categories ?? []} teamMembers={teamMembers ?? []} />
    </div>
  );
}
