"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { InsightCategory } from "@/types/domain";

export function InsightsFilter({ categories }: { categories: InsightCategory[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get("category") ?? "";

  return (
    <div className="mb-8 max-w-[280px]">
      <label htmlFor="insights-category-filter" className="mb-1.5 block text-[13px] font-semibold text-ink-900">
        Filter by category
      </label>
      <select
        id="insights-category-filter"
        value={current}
        onChange={(e) => {
          const value = e.target.value;
          // Reset to page 1 whenever the filter changes — a stale page
          // number from a longer, unfiltered list could point past the end
          // of a filtered one.
          router.push(value ? `/insights?category=${value}` : "/insights");
        }}
        className="w-full rounded-sm border-[1.5px] border-gray-300 px-3.5 py-[11px] font-sans text-small text-ink-900 focus:border-navy-700 focus:outline-none focus:ring-4 focus:ring-navy-100"
      >
        <option value="">All categories</option>
        {categories.map((cat) => (
          <option key={cat.id} value={cat.slug}>
            {cat.name}
          </option>
        ))}
      </select>
    </div>
  );
}
