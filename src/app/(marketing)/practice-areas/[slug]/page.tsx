import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RichTextRenderer } from "@/components/shared/RichTextRenderer";
import { JsonLd } from "@/components/shared/JsonLd";
import { Tag } from "@/components/ui";
import { ASSETS } from "@/config/assets";
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

      <div className="mt-6 flex items-start gap-4">
        <img src={getPracticeAreaIconSrc(practiceArea.icon_url)} alt="" width={40} height={40} className="mt-2 h-10 w-10 shrink-0" />
        <div>
          <h1 className="font-serif text-h1 text-navy-700">{practiceArea.title}</h1>
          {practiceArea.short_description && (
            <p className="mt-3 max-w-[640px] text-body-l text-gray-700">{practiceArea.short_description}</p>
          )}
        </div>
      </div>

      <div className="mt-12 grid gap-12 desktop:grid-cols-[1fr_320px]">
        <div className="max-w-[720px]">
          <RichTextRenderer content={practiceArea.content} />
        </div>

        {relatedTeam.length > 0 && (
          <aside>
            <h2 className="mb-4 font-mono text-[11px] uppercase tracking-wide text-gray-500">Team</h2>
            <div className="flex flex-col gap-4">
              {relatedTeam.map((member) => (
                <Link
                  key={member.id}
                  href={`/team/${member.slug}`}
                  className="flex items-center gap-3 rounded-lg border border-gray-300 bg-white p-4 hover:shadow-sm"
                >
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-navy-100">
                    <Image
                      src={member.photo_url ?? ASSETS.teamAvatarPlaceholder}
                      alt=""
                      fill
                      className="object-cover grayscale"
                      sizes="48px"
                    />
                  </div>
                  <div>
                    <p className="font-serif text-h4 text-navy-700">{member.name}</p>
                    {member.designation && <p className="mt-0.5 text-small text-gray-700">{member.designation}</p>}
                  </div>
                </Link>
              ))}
            </div>
          </aside>
        )}
      </div>

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
