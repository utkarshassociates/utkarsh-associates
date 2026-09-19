import Link from "next/link";
import type { Metadata } from "next";
import { getCurrentAdmin } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { createServiceRoleClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Dashboard" };

// The pending-review counter on /admin is how a publisher-permission holder
// finds out there's something to review — it's functionally the
// notification system, since there are no email notifications (per the
// tech stack decision). Counts below are real queries against tables that
// already exist (insights, contact_submissions), even though the
// CRUD screens to act on them are Phase 3 — so this dashboard is honest
// about current state today, and will light up automatically once Phase 3
// ships without any change needed here.
export default async function AdminDashboardPage() {
  const admin = await getCurrentAdmin();
  if (!admin) return null; // layout already guards this; satisfies TS

  const supabase = createServiceRoleClient();

  const [pendingReview, newInquiries, publishedCount] = await Promise.all([
    hasPermission(admin, "insights.publish")
      ? supabase.from("insights").select("id", { count: "exact", head: true }).eq("status", "pending_review")
      : Promise.resolve({ count: null }),
    hasPermission(admin, "inquiries.view")
      ? supabase.from("contact_submissions").select("id", { count: "exact", head: true }).eq("status", "new")
      : Promise.resolve({ count: null }),
    supabase.from("insights").select("id", { count: "exact", head: true }).eq("status", "published"),
  ]);

  const cards: { label: string; value: number | null; href: string }[] = [
    { label: "Pending review", value: pendingReview.count ?? null, href: "/admin/insights" },
    { label: "New inquiries", value: newInquiries.count ?? null, href: "/admin/inquiries" },
    { label: "Published insights", value: publishedCount.count ?? 0, href: "/admin/insights" },
  ];

  const quickLinks: { label: string; href: string; show: boolean }[] = [
    { label: "Write an Insight", href: "/admin/insights", show: true },
    { label: "Manage Practice Areas", href: "/admin/practice-areas", show: hasPermission(admin, "practice_areas.manage") },
    { label: "Manage Team", href: "/admin/team", show: hasPermission(admin, "team.manage") },
    { label: "Manage Admins", href: "/admin/admins", show: hasPermission(admin, "admins.manage") },
  ];

  return (
    <div>
      <h1 className="font-serif text-h3 text-navy-700">Welcome, {admin.name}</h1>
      <p className="mt-1 text-small text-gray-700">
        Signed in as <span className="font-semibold">{admin.roleName}</span>
        {admin.isSuper && " (superAdmin)"}
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 tablet:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="rounded-lg border border-gray-300 bg-white p-6 transition-shadow hover:shadow-md"
          >
            <div className="font-serif text-[32px] font-medium text-navy-700">
              {card.value === null ? "—" : card.value}
            </div>
            <div className="text-[12px] uppercase tracking-wide text-gray-700">{card.label}</div>
          </Link>
        ))}
      </div>

      <h2 className="mt-10 mb-3 text-[14px] font-semibold uppercase tracking-wide text-gray-700">
        Quick links
      </h2>
      <div className="flex flex-wrap gap-3">
        {quickLinks
          .filter((link) => link.show)
          .map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-pill border-[1.5px] border-navy-700 px-5 py-2 text-small font-semibold text-navy-700 hover:bg-navy-100"
            >
              {link.label}
            </Link>
          ))}
      </div>
    </div>
  );
}
