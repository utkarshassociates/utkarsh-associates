import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { InsightsFilter } from "@/components/marketing/InsightsFilter";
import { Tag } from "@/components/ui";
import { getInsightCategories, getPublishedInsights } from "@/lib/data/public";
import { formatDateDDMMYYYY } from "@/lib/utils";

const PER_PAGE = 9;

// No `export const revalidate` — like /team, this page reads `searchParams`
// (category/page filters) and is therefore already dynamically rendered
// per request; see PHASE-5-NOTES.md.
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; page?: string }>;
}): Promise<Metadata> {
  const { category, page } = await searchParams;
  // Self-referencing canonical: each category/page combination is
  // meaningfully different content, so it canonicalizes to itself rather
  // than collapsing every filtered view onto the unfiltered first page.
  const qs = new URLSearchParams();
  if (category) qs.set("category", category);
  if (page && page !== "1") qs.set("page", page);
  const query = qs.toString();
  const canonical = query ? `/insights?${query}` : "/insights";

  return {
    title: "Insights",
    description: "Commentary and updates from our team across the practice areas we cover.",
    alternates: { canonical },
  };
}

export default async function InsightsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; page?: string }>;
}) {
  const { category, page: pageParam } = await searchParams;
  const page = pageParam ? Math.max(1, parseInt(pageParam, 10) || 1) : 1;

  const [categories, { insights, total }] = await Promise.all([
    getInsightCategories(),
    getPublishedInsights({ page, perPage: PER_PAGE, categorySlug: category }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  function pageHref(p: number) {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `/insights?${qs}` : "/insights";
  }

  return (
    <div className="mx-auto max-w-wide px-4 py-16 tablet:px-8 desktop:px-16">
      <h1 className="font-serif text-h1 text-navy-700">Insights</h1>
      <p className="mt-4 max-w-[560px] text-body-l text-gray-700">
        Commentary and updates from our team across the practice areas we cover.
      </p>

      <div className="mt-10">
        <Suspense fallback={<div className="mb-8 h-[70px] max-w-[280px]" />}>
          <InsightsFilter categories={categories} />
        </Suspense>
      </div>

      {insights.length === 0 ? (
        <p className="text-body text-gray-700">No insights found.</p>
      ) : (
        <>
          <div className="grid gap-4 tablet:grid-cols-2 desktop:grid-cols-3">
            {insights.map((insight) => (
              <Link
                key={insight.id}
                href={`/insights/${insight.slug}`}
                className="flex flex-col rounded-lg border border-gray-300 bg-white p-6 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  {insight.category && <Tag variant="navy">{insight.category.name}</Tag>}
                  {insight.post_type === "external_link" && <Tag variant="gold">External</Tag>}
                </div>
                <h4 className="mb-2 font-serif text-h4 text-navy-700">{insight.title}</h4>
                {insight.excerpt && <p className="mb-3 text-small text-gray-700">{insight.excerpt}</p>}
                <div className="mt-auto flex items-center justify-between pt-2 text-[12px] text-gray-500">
                  {insight.author && <span>{insight.author.name}</span>}
                  {insight.published_at && <span>{formatDateDDMMYYYY(insight.published_at)}</span>}
                </div>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <nav className="mt-12 flex items-center justify-center gap-2" aria-label="Pagination">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Link
                  key={p}
                  href={pageHref(p)}
                  aria-current={p === page ? "page" : undefined}
                  className={
                    p === page
                      ? "flex h-9 w-9 items-center justify-center rounded-pill bg-navy-700 text-small font-semibold text-white"
                      : "flex h-9 w-9 items-center justify-center rounded-pill text-small font-semibold text-navy-700 hover:bg-navy-100"
                  }
                >
                  {p}
                </Link>
              ))}
            </nav>
          )}
        </>
      )}
    </div>
  );
}
