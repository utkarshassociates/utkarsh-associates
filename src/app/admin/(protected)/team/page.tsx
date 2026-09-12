import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth/session";
import { ComingSoon } from "@/components/admin/ComingSoon";

export const metadata: Metadata = { title: "Team" };

export default async function AdminTeamPage() {
  await requirePermission("team.manage");
  return <ComingSoon title="Team" permissionLabel="team.manage" />;
}
