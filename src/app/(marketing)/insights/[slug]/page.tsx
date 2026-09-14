import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Tag } from "@/components/ui";
import { RichTextRenderer } from "@/components/shared/RichTextRenderer";
import { getInsightBySlug, getRelatedInsights } from "@/lib/data/public";
import { formatDateDDMMYYYY } from "@/lib/utils";

export default async function InsightDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const insight = await getInsightBySlug(slug);
  if (!insight) notFound();

  const related = await getRelatedInsights(insight.category_id, insight.id);

  return (
    <div className="mx-auto max-w-wide px-4 py-16 tablet:px-8 desktop:px-16">
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
          {insight.author && (
            <Link href={`/team/${insight.author.slug}`} className="font-semibold text-navy-700 hover:text-gold-700">
              {insight.author.name}
            </Link>
          )}
          {insight.published_at && <span>{formatDateDDMMYYYY(insight.published_at)}</span>}
        </div>

        {insight.cover_image_url && (
          <div className="relative mt-8 aspect-[16/9] w-full overflow-hidden rounded-lg">
            <Image src={insight.cover_image_url} alt={insight.title} fill className="object-cover" sizes="720px" priority />
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
