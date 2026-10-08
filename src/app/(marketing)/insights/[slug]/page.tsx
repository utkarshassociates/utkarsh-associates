import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Tag } from "@/components/ui";
import { ASSETS } from "@/config/assets";
import { RichTextRenderer } from "@/components/shared/RichTextRenderer";
import { JsonLd } from "@/components/shared/JsonLd";
import { getInsightBySlug, getPublishedInsights, getRelatedInsights } from "@/lib/data/public";
import { formatDateDDMMYYYY } from "@/lib/utils";
import { articleJsonLd, breadcrumbJsonLd, richTextToPlainText } from "@/lib/seo";

export const revalidate = 3600;

// Phase 5 fix — see practice-areas/[slug]/page.tsx's identical comment for
// why this is needed alongside `revalidate`, not instead of it. Reuses the
// same perPage: 5000 "fetch effectively all published rows in one call"
// approach as sitemap.ts, with the same scale caveat noted there.
export async function generateStaticParams() {
  const { insights } = await getPublishedInsights({ page: 1, perPage: 5000 });
  return insights.map((i) => ({ slug: i.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const insight = await getInsightBySlug(slug);
  if (!insight) return {};

  const title = insight.seo_title || insight.title;
  const description = insight.seo_description || insight.excerpt || richTextToPlainText(insight.content);
  const canonical = `/insights/${insight.slug}`;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "article",
      images: insight.cover_image_url ? [insight.cover_image_url] : undefined,
      publishedTime: insight.published_at ?? undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: insight.cover_image_url ? [insight.cover_image_url] : undefined,
    },
  };
}

export default async function InsightDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const insight = await getInsightBySlug(slug);
  if (!insight) notFound();
  const authors = insight.authors ?? [];

  const related = await getRelatedInsights(insight.category_id, insight.id);

  return (
    <div className="mx-auto max-w-wide px-4 py-16 tablet:px-8 desktop:px-16">
      <JsonLd data={articleJsonLd(insight)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Insights", path: "/insights" },
          { name: insight.title, path: `/insights/${insight.slug}` },
        ])}
      />
      <Link href="/insights" className="text-small font-semibold text-navy-700 hover:text-gold-700">
        ← All Insights
      </Link>

      <article className="mx-auto mt-6 max-w-[720px]">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {insight.category && <Tag variant="navy">{insight.category.name}</Tag>}
          {insight.post_type === "external_link" && <Tag variant="gold">External</Tag>}
        </div>

        <h1 className="font-serif text-h1 text-navy-700">{insight.title}</h1>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-small text-gray-500">
          {authors.length > 0 && (
            <span>
              {authors.map((a, i) => (
                <span key={a.id}>
                  {i > 0 && (i === authors.length - 1 ? " & " : ", ")}
                  <Link href={`/team/${a.slug}`} className="font-semibold text-navy-700 hover:text-gold-700">
                    {a.name}
                  </Link>
                </span>
              ))}
            </span>
          )}
          {insight.published_at && <span>{formatDateDDMMYYYY(insight.published_at)}</span>}
        </div>

        {insight.cover_image_url && (
          <div className="relative mt-8 aspect-[16/9] w-full overflow-hidden rounded-lg">
            <Image
              src={insight.cover_image_url}
              alt={insight.title}
              fill
              className="object-cover"
              sizes="(min-width: 720px) 720px, 100vw"
              priority
            />
          </div>
        )}

        <div className="mt-8">
          {insight.post_type === "external_link" ? (
            <>
              {insight.excerpt && <p className="mb-6 text-body-l text-gray-700">{insight.excerpt}</p>}
              {insight.external_url && (
                <a
                  href={insight.external_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-body font-semibold text-navy-700 hover:text-gold-700"
                >
                  Read the full article on {insight.source_name || "the original source"} →
                </a>
              )}
            </>
          ) : (
            <RichTextRenderer content={insight.content} />
          )}
        </div>

        {insight.tags.length > 0 && (
          <div className="mt-10 flex flex-wrap gap-2 border-t border-gray-300 pt-6">
            {insight.tags.map((tag) => (
              <Tag key={tag} variant="navy">
                {tag}
              </Tag>
            ))}
          </div>
        )}

        {/* Phase 6 §7: related team member(s) and practice area, as small
            related-content elements — no reference design doc available for
            this yet (§9), so this follows the same compact card treatment
            already used for the practice-area detail page's related-team
            sidebar. Each piece is independent: an insight with an author but
            no linked practice area (or vice versa) just shows the one it
            has — "missing related practice area" means this whole block
            simply doesn't render that part, not a placeholder. */}
        {(authors.length > 0 || insight.practiceArea) && (
          <div className="mt-10 flex flex-wrap gap-4 border-t border-gray-300 pt-6">
            {authors.map((author) => (
              <Link
                key={author.id}
                href={`/team/${author.slug}`}
                className="flex items-center gap-3 rounded-lg border border-gray-300 bg-white p-3 pr-5 hover:shadow-sm"
              >
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-navy-100">
                  <Image src={author.photo_url ?? ASSETS.teamAvatarPlaceholder} alt="" fill className="object-cover object-top grayscale" sizes="40px" />
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-gray-500">Written by</p>
                  <p className="text-small font-semibold text-navy-700">{author.name}</p>
                </div>
              </Link>
            ))}
            {insight.practiceArea && (
              <Link
                href={`/practice-areas/${insight.practiceArea.slug}`}
                className="flex items-center gap-3 rounded-lg border border-gray-300 bg-white p-3 pr-5 hover:shadow-sm"
              >
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-gray-500">Practice area</p>
                  <p className="text-small font-semibold text-navy-700">{insight.practiceArea.title}</p>
                </div>
              </Link>
            )}
          </div>
        )}
      </article>

      {related.length > 0 && (
        <div className="mx-auto mt-16 max-w-[960px]">
          <h2 className="mb-6 font-serif text-h3 text-navy-700">Related Insights</h2>
          <div className="grid gap-4 tablet:grid-cols-3">
            {related.map((r) => (
              <Link
                key={r.id}
                href={`/insights/${r.slug}`}
                className="block rounded-lg border border-gray-300 bg-white p-5 hover:shadow-sm"
              >
                <h4 className="mb-1.5 font-serif text-[16px] font-semibold text-navy-700">{r.title}</h4>
                {r.excerpt && <p className="text-[13px] text-gray-700">{r.excerpt}</p>}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
