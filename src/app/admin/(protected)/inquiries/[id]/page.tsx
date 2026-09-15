import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { InquiryStatusActions } from "@/components/admin/InquiryStatusActions";
import { formatDateDDMMYYYY } from "@/lib/utils";
import type { ContactSubmission } from "@/types/domain";

export const metadata: Metadata = { title: "Inquiry" };

export default async function InquiryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requirePermission("inquiries.view");
  const { id } = await params;

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.from("contact_submissions").select("*").eq("id", id).maybeSingle();
  if (error || !data) notFound();
  const submission = data as ContactSubmission;

  const canManage = hasPermission(actor, "inquiries.manage");

  return (
    <div className="max-w-[640px]">
      <Link href="/admin/inquiries" className="text-[13px] font-semibold text-navy-700 hover:text-gold-700">
        ← All Inquiries
      </Link>

      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-h3 text-navy-700">{submission.name}</h1>
          <p className="mt-1 text-small text-gray-700">{formatDateDDMMYYYY(submission.created_at)}</p>
        </div>
        <StatusBadge status={submission.status} />
      </div>

      <dl className="mt-6 grid grid-cols-[120px_1fr] gap-y-2 border-y border-gray-300 py-4 text-small">
        <dt className="text-gray-500">Email</dt>
        <dd>
          <a href={`mailto:${submission.email}`} className="font-semibold text-navy-700 hover:text-gold-700">
            {submission.email}
          </a>
        </dd>
        {submission.phone && (
          <>
            <dt className="text-gray-500">Phone</dt>
            <dd>{submission.phone}</dd>
          </>
        )}
        {submission.practice_area_interest && (
          <>
            <dt className="text-gray-500">Practice Area</dt>
            <dd>{submission.practice_area_interest}</dd>
          </>
        )}
      </dl>

      <div className="mt-6">
        <h2 className="mb-2 font-mono text-[11px] uppercase tracking-wide text-gray-500">Message</h2>
        <p className="whitespace-pre-line text-body text-ink-900">{submission.message}</p>
      </div>

      {canManage && (
        <div className="mt-8 border-t border-gray-300 pt-6">
          <InquiryStatusActions id={submission.id} status={submission.status} />
        </div>
      )}
    </div>
  );
}
