import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth/session";
import { ComingSoon } from "@/components/admin/ComingSoon";

export const metadata: Metadata = { title: "Inquiries" };

export default async function AdminInquiriesPage() {
  await requirePermission("inquiries.view");
  return <ComingSoon title="Inquiries" permissionLabel="inquiries.view" />;
}
