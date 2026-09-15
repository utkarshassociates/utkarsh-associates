"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateInquiryStatusAction } from "@/actions/inquiries";
import type { ContactSubmissionStatus } from "@/types/domain";

const NEXT_ACTIONS: Record<ContactSubmissionStatus, { label: string; next: ContactSubmissionStatus }[]> = {
  new: [
    { label: "Mark Read", next: "read" },
    { label: "Archive", next: "archived" },
  ],
  read: [
    { label: "Archive", next: "archived" },
    { label: "Mark New", next: "new" },
  ],
  archived: [{ label: "Reopen", next: "new" }],
};

export function InquiryStatusActions({ id, status }: { id: string; status: ContactSubmissionStatus }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function change(next: ContactSubmissionStatus) {
    setError(null);
    startTransition(async () => {
      const result = await updateInquiryStatusAction({ id, status: next });
      if (!result.success) {
        setError(result.error ?? "Could not update status.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {NEXT_ACTIONS[status].map((action) => (
        <button
          key={action.next}
          type="button"
          disabled={isPending}
          onClick={() => change(action.next)}
          className="text-[13px] font-semibold text-navy-700 hover:text-gold-700 disabled:cursor-not-allowed disabled:text-gray-400"
        >
          {action.label}
        </button>
      ))}
      {error && <span className="text-[12px] text-error">{error}</span>}
    </div>
  );
}
