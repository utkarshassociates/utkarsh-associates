import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth/session";
import { ComingSoon } from "@/components/admin/ComingSoon";

export const metadata: Metadata = { title: "Offices" };

export default async function AdminOfficesPage() {
  await requirePermission("offices.manage");
  return <ComingSoon title="Offices" permissionLabel="offices.manage" />;
}
