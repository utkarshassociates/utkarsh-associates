import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth/session";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { PracticeAreaForm } from "@/components/admin/PracticeAreaForm";
import type { PracticeArea } from "@/types/domain";

export const metadata: Metadata = { title: "Edit Practice Area" };

interface EditPracticeAreaPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPracticeAreaPage({ params }: EditPracticeAreaPageProps) {
  await requirePermission("practice_areas.manage");
  const { id } = await params;

  const supabase = createServiceRoleClient();
  const { data: practiceArea } = await supabase.from("practice_areas").select("*").eq("id", id).maybeSingle();

  if (!practiceArea) notFound();

  return (
    <div>
      <h1 className="mb-6 font-serif text-h3 text-navy-700">{practiceArea.title}</h1>
      <PracticeAreaForm mode="edit" initialValues={practiceArea as PracticeArea} />
    </div>
  );
}
