"use client";

import { useRouter, useSearchParams } from "next/navigation";
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
      <select
        id="team-practice-area-filter"
        value={current}
        onChange={(e) => {
          const value = e.target.value;
          router.push(value ? `/team?practice_area=${value}` : "/team");
        }}
        className="w-full rounded-sm border-[1.5px] border-gray-300 px-3.5 py-[11px] font-sans text-small text-ink-900 focus:border-navy-700 focus:outline-none focus:ring-4 focus:ring-navy-100"
      >
        <option value="">All practice areas</option>
        {practiceAreas.map((pa) => (
          <option key={pa.id} value={pa.slug}>
            {pa.title}
          </option>
        ))}
      </select>
    </div>
  );
}
