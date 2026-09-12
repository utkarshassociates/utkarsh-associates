import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth/session";
import { ComingSoon } from "@/components/admin/ComingSoon";

export const metadata: Metadata = { title: "Practice Areas" };

export default async function AdminPracticeAreasPage() {
  await requirePermission("practice_areas.manage");
  return <ComingSoon title="Practice Areas" permissionLabel="practice_areas.manage" />;
}
