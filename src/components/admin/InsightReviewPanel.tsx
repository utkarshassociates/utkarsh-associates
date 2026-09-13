"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { publishInsightAction, rejectInsightAction } from "@/actions/insights";
import { Button } from "@/components/ui";

interface InsightReviewPanelProps {
  insightId: string;
}

// Shown on the edit page only when: the insight's current status is
// pending_review AND the viewer has insights.publish (§5.1 — "Anyone with
// insights.publish ... can move pending_review → published, or → rejected").
// Deliberately separate from InsightForm's own Save/Submit buttons — saving
// content and approving it are different actions with different permission
// requirements, so keeping them as two components makes the permission
// boundary visible in the code, not just enforced at runtime.
export function InsightReviewPanel({ insightId }: InsightReviewPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showRejectNote, setShowRejectNote] = useState(false);
  const [rejectionNote, setRejectionNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  function publish() {
    setError(null);
    startTransition(async () => {
      const result = await publishInsightAction(insightId);
      if (!result.success) {
        setError(result.error ?? "Could not publish.");
        return;
      }
      router.refresh();
    });
  }

  function reject() {
    setError(null);
    startTransition(async () => {
      const result = await rejectInsightAction({ id: insightId, rejectionNote: rejectionNote || undefined });
      if (!result.success) {
        setError(result.error ?? "Could not reject.");
        return;
      }
      setShowRejectNote(false);
      setRejectionNote("");
      router.refresh();
    });
  }

  return (
    <div className="mb-6 rounded-md border border-gold-500 bg-gold-100 p-4">
      <div className="mb-1 text-[13px] font-semibold text-navy-700">Pending review</div>
      <p className="mb-3 text-[13px] text-gray-700">
        This insight is waiting on a publish/reject decision. Content changes are saved separately via the form below.
      </p>

      {!showRejectNote ? (
        <div className="flex gap-3">
          <Button type="button" variant="primary" disabled={isPending} onClick={publish}>
            {isPending ? "Publishing…" : "Publish"}
          </Button>
          <Button type="button" variant="outline" disabled={isPending} onClick={() => setShowRejectNote(true)}>
            Reject
          </Button>
        </div>
      ) : (
        <div>
          <textarea
            value={rejectionNote}
            onChange={(e) => setRejectionNote(e.target.value)}
            placeholder="Optional note back to the author explaining the rejection…"
            rows={2}
            className="mb-2 w-full rounded-sm border-[1.5px] border-gray-300 px-3 py-2 text-[13px] focus:border-navy-700 focus:outline-none"
          />
          <div className="flex gap-3">
            <Button type="button" variant="primary" disabled={isPending} onClick={reject}>
              {isPending ? "Rejecting…" : "Confirm reject"}
            </Button>
            <Button type="button" variant="ghost" disabled={isPending} onClick={() => setShowRejectNote(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {error && <p className="mt-2 text-[12px] text-error">{error}</p>}
    </div>
  );
}
