"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleAdminStatusAction } from "@/actions/admins";

/**
 * Quick inline Disable/Activate action for the admins list — previously the
 * only way to change an admin's status was to click into Edit and find the
 * Status dropdown mid-form, which wasn't very discoverable. This surfaces
 * it directly on the row it applies to.
 *
 * Rendered by the list page ONLY when the viewer is a superAdmin (per
 * explicit product decision: disabling an admin is superAdmin-only, not
 * just anyone with admins.manage — see the identical restriction in
 * updateAdminAction/toggleAdminStatusAction, which is the real
 * enforcement; this component not rendering for a non-super viewer is
 * just the UI matching that, not what actually guarantees it).
 */
export function AdminStatusToggle({ adminId, status }: { adminId: string; status: "active" | "disabled" }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggle() {
    const next = status === "active" ? "disabled" : "active";
    if (next === "disabled" && !window.confirm("Disable this admin? They won't be able to log in until reactivated.")) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await toggleAdminStatusAction({ adminId, status: next });
      if (!result.success) {
        setError(result.error ?? "Could not update status.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="inline-flex flex-col items-end gap-0.5">
      <button
        type="button"
        disabled={isPending}
        onClick={toggle}
        className="text-[13px] font-semibold text-navy-700 hover:text-gold-700 disabled:cursor-not-allowed disabled:text-gray-400"
      >
        {status === "active" ? "Disable" : "Activate"}
      </button>
      {error && <span className="text-[12px] text-error">{error}</span>}
    </div>
  );
}
