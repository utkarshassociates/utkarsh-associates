"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createCategoryAction } from "@/actions/insights";
import { Button, Input } from "@/components/ui";
import { slugify } from "@/lib/utils";

export function AddCategoryForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setError(null);
    startTransition(async () => {
      const result = await createCategoryAction({ name: name.trim(), slug: slugify(name) });
      if (!result.success) {
        setError(result.error ?? "Could not add category.");
        return;
      }
      setName("");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-3">
      <div className="flex-1">
        <Input label="New category name" value={name} onChange={(e) => setName(e.target.value)} state={error ? "error" : "default"} message={error ?? undefined} />
      </div>
      <Button type="submit" variant="primary" disabled={isPending} className="mb-4">
        {isPending ? "Adding…" : "Add"}
      </Button>
    </form>
  );
}
