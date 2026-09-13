import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth/session";
import { PracticeAreaForm } from "@/components/admin/PracticeAreaForm";

export const metadata: Metadata = { title: "New Practice Area" };

export default async function NewPracticeAreaPage() {
  await requirePermission("practice_areas.manage");

  return (
    <div>
      <h1 className="mb-6 font-serif text-h3 text-navy-700">New practice area</h1>
      <PracticeAreaForm mode="create" />
    </div>
  );
}
