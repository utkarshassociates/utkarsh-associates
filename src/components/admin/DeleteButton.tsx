"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

interface DeleteButtonProps {
  confirmMessage: string;
  action: (id: string) => Promise<{ success: boolean; error?: string }>;
  id: string;
}

export function DeleteButton({ confirmMessage, action, id }: DeleteButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="inline-block">
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          if (!window.confirm(confirmMessage)) return;
          setError(null);
          startTransition(async () => {
            const result = await action(id);
            if (!result.success) {
              setError(result.error ?? "Could not delete.");
              return;
            }
            router.refresh();
          });
        }}
        className="font-semibold text-error hover:underline disabled:cursor-not-allowed disabled:text-gray-400"
      >
        {isPending ? "Deleting…" : "Delete"}
      </button>
      {error && <div className="mt-1 text-[12px] text-error">{error}</div>}
    </div>
  );
}
