import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth/session";
import { ComingSoon } from "@/components/admin/ComingSoon";

export const metadata: Metadata = { title: "Insights" };

export default async function AdminInsightsPage() {
  await requirePermission("insights.create");
  return <ComingSoon title="Insights" permissionLabel="insights.create" />;
}
