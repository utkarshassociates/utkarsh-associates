import Link from "next/link";
import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth/session";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui";
import { TeamTable, type TeamRow } from "@/components/admin/TeamTable";

export const metadata: Metadata = { title: "Team" };

export default async function TeamListPage() {
  await requirePermission("team.manage");

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("team_members")
    .select("id, name, designation, status, order_index")
    .order("order_index", { ascending: true });

  const rows: TeamRow[] = (data ?? []).map((row, i, arr) => ({
    ...row,
    isFirst: i === 0,
    isLast: i === arr.length - 1,
  }));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-serif text-h3 text-navy-700">Team</h1>
        <Link href="/admin/team/new">
          <Button variant="primary">New team member</Button>
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-sm border border-error bg-error-bg px-3.5 py-3 text-[13px] text-error">
          Couldn&apos;t load team members: {error.message}
        </div>
      )}

      <TeamTable rows={rows} />
    </div>
  );
}
