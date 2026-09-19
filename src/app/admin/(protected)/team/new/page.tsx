import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth/session";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { TeamMemberForm } from "@/components/admin/TeamMemberForm";

export const metadata: Metadata = { title: "New Team Member" };

export default async function NewTeamMemberPage() {
  await requirePermission("team.manage");

  const supabase = createServiceRoleClient();
  const { data: practiceAreas } = await supabase.from("practice_areas").select("id, title").order("order_index");

  return (
    <div>
      <h1 className="mb-6 font-serif text-h3 text-navy-700">New Team Member</h1>
      <TeamMemberForm mode="create" practiceAreas={practiceAreas ?? []} />
    </div>
  );
}
