import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth/session";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { OfficeForm } from "@/components/admin/OfficeForm";
import type { Office } from "@/types/domain";

export const metadata: Metadata = { title: "Edit Office" };

interface EditOfficePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditOfficePage({ params }: EditOfficePageProps) {
  await requirePermission("offices.manage");
  const { id } = await params;

  const supabase = createServiceRoleClient();
  const { data: office } = await supabase.from("offices").select("*").eq("id", id).maybeSingle();

  if (!office) notFound();

  return (
    <div>
      <h1 className="mb-6 font-serif text-h3 text-navy-700">{office.name}</h1>
      <OfficeForm mode="edit" initialValues={office as Office} />
    </div>
  );
}
