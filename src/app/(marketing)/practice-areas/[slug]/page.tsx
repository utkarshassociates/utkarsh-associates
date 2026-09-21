import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RichTextRenderer } from "@/components/shared/RichTextRenderer";
import { JsonLd } from "@/components/shared/JsonLd";
import { TeamGrid } from "@/components/marketing/TeamGrid";
import { Tag } from "@/components/ui";
import { getInsightsForPracticeArea, getPracticeAreaBySlug, getPublishedPracticeAreas, getTeamMembersForPracticeArea } from "@/lib/data/public";
import { getPracticeAreaIconSrc } from "@/lib/utils";
import { breadcrumbJsonLd, richTextToPlainText } from "@/lib/seo";

export const revalidate = 3600;

// Phase 5 fix: without this, `export const revalidate` alone doesn't make a
// dynamic-segment route ([slug]) prerender — Next.js has no known set of
// slugs to build ahead of time, so it falls back to fully dynamic rendering
// regardless of the revalidate value (confirmed via a real `next build`
// output showing this route as "f Dynamic" with no Revalidate/Expire
// column, instead of "o Static" like the listing pages). Reuses the same
// query sitemap.ts already runs — no new query logic.
export async function generateStaticParams() {
  const practiceAreas = await getPublishedPracticeAreas();
  return practiceAreas.map((pa) => ({ slug: pa.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const practiceArea = await getPracticeAreaBySlug(slug);
  if (!practiceArea) return {};

  const title = practiceArea.seo_title || practiceArea.title;
  const description = practiceArea.seo_description || practiceArea.short_description || richTextToPlainText(practiceArea.content);
  const canonical = `/practice-areas/${practiceArea.slug}`;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, type: "website" },
    twitter: { card: "summary", title, description },
  };
}

export default async function PracticeAreaDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const practiceArea = await getPracticeAreaBySlug(slug);
  if (!practiceArea) notFound();

  const [relatedTeam, relatedInsights] = await Promise.all([
    getTeamMembersForPracticeArea(practiceArea.id),
    getInsightsForPracticeArea(practiceArea.id),
  ]);

  return (
    <div className="mx-auto max-w-wide px-4 py-16 tablet:px-8 desktop:px-16">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Practice Areas", path: "/practice-areas" },
          { name: practiceArea.title, path: `/practice-areas/${practiceArea.slug}` },
        ])}
      />
      <Link href="/practice-areas" className="text-small font-semibold text-navy-700 hover:text-gold-700">
        ← All Practice Areas
      </Link>

      {/* Side-by-side, not stacked: the previous vertical layouts (image
          above the heading, with or without overlap) all shared the same
          root problem — as long as the image sits above the heading in
          document flow, the heading necessarily starts "after" it, and any
          overlap amount aggressive enough to look intentional risked
          clipping into a two-line title. A side-by-side layout removes the
          problem structurally instead of tuning around it: the heading
          starts immediately at the top, at a fixed position, regardless of
          the image's height or the title's line count. Image is `scale-150`
          for the same reason as the cards — the source artwork has a lot of
          transparent padding baked in, and a plain object-fit alone can't
          compensate for that. Stacks to image-below-text on mobile/tablet,
          where there isn't room for two columns. */}
      <div className="mt-8 flex flex-col gap-8 desktop:flex-row desktop:items-center desktop:gap-12">
        <div className="max-w-[640px] desktop:flex-1">
          <h1 className="font-serif text-h1 text-navy-700">{practiceArea.title}</h1>
          {practiceArea.short_description && (
            <p className="mt-3 text-body-l text-gray-700">{practiceArea.short_description}</p>
          )}
        </div>
        <div className="relative h-56 w-full overflow-hidden rounded-lg desktop:h-72 desktop:w-[360px] desktop:shrink-0">
          <img
            src={getPracticeAreaIconSrc(practiceArea.icon_url)}
            alt=""
            className="absolute inset-0 h-full w-full scale-150 object-contain object-center"
          />
        </div>
      </div>

      {/* Content is now full-width — the sidebar "Team" list (small avatar +
          name/designation rows, off to the right of the body copy) is
          replaced by a proper section below the content, using the exact
          same TeamGrid card the /team page itself uses, for real
          consistency rather than a visually-similar-but-separate layout. */}
      <div className="mt-12 max-w-[720px]">
        <RichTextRenderer content={practiceArea.content} />
      </div>

      {relatedTeam.length > 0 && (
        <div className="mt-16 border-t border-gray-300 pt-12">
          <h2 className="mb-6 font-serif text-h3 text-navy-700">Team</h2>
          <TeamGrid members={relatedTeam} />
        </div>
      )}

      {relatedInsights.length > 0 && (
        <div className="mt-16 border-t border-gray-300 pt-12">
          <h2 className="mb-6 font-serif text-h3 text-navy-700">Related Insights</h2>
          <div className="grid gap-4 tablet:grid-cols-3">
            {relatedInsights.map((insight) => (
              <Link
                key={insight.id}
                href={`/insights/${insight.slug}`}
                className="block rounded-lg border border-gray-300 bg-white p-5 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md"
              >
                {insight.category && (
                  <span className="mb-2 inline-block">
                    <Tag variant="navy">{insight.category.name}</Tag>
                  </span>
                )}
                <h4 className="mb-1.5 font-serif text-[16px] font-semibold text-navy-700">{insight.title}</h4>
                {insight.excerpt && <p className="text-[13px] text-gray-700">{insight.excerpt}</p>}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
