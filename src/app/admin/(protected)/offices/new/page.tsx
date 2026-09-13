import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth/session";
import { OfficeForm } from "@/components/admin/OfficeForm";

export const metadata: Metadata = { title: "New Office" };

export default async function NewOfficePage() {
  await requirePermission("offices.manage");

  return (
    <div>
      <h1 className="mb-6 font-serif text-h3 text-navy-700">New office</h1>
      <OfficeForm mode="create" />
    </div>
  );
}
