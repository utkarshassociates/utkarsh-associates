"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Select } from "@/components/ui/Select";
import type { PracticeArea } from "@/types/domain";

export function TeamFilter({ practiceAreas }: { practiceAreas: PracticeArea[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get("practice_area") ?? "";

  return (
    <div className="mb-8 max-w-[280px]">
      <label htmlFor="team-practice-area-filter" className="mb-1.5 block text-[13px] font-semibold text-ink-900">
        Filter by practice area
      </label>
      <Select
        id="team-practice-area-filter"
        value={current}
        onChange={(e) => {
          const value = e.target.value;
          router.push(value ? `/team?practice_area=${value}` : "/team");
        }}
      >
        <option value="">All practice areas</option>
        {practiceAreas.map((pa) => (
          <option key={pa.id} value={pa.slug}>
            {pa.title}
          </option>
        ))}
      </Select>
    </div>
  );
}
