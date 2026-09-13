import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth/session";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { TeamMemberForm } from "@/components/admin/TeamMemberForm";
import type { TeamMemberWithPracticeAreas } from "@/types/domain";

export const metadata: Metadata = { title: "Edit Team Member" };

interface EditTeamMemberPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditTeamMemberPage({ params }: EditTeamMemberPageProps) {
  await requirePermission("team.manage");
  const { id } = await params;

  const supabase = createServiceRoleClient();
  const [{ data: teamMember }, { data: links }, { data: practiceAreas }] = await Promise.all([
    supabase.from("team_members").select("*").eq("id", id).maybeSingle(),
    supabase.from("team_practice_areas").select("practice_area_id").eq("team_member_id", id),
    supabase.from("practice_areas").select("id, title").order("order_index"),
  ]);

  if (!teamMember) notFound();

  const initialValues: TeamMemberWithPracticeAreas = {
    ...teamMember,
    practiceAreaIds: (links ?? []).map((l) => l.practice_area_id),
  };

  return (
    <div>
      <h1 className="mb-6 font-serif text-h3 text-navy-700">{teamMember.name}</h1>
      <TeamMemberForm mode="edit" initialValues={initialValues} practiceAreas={practiceAreas ?? []} />
    </div>
  );
}
