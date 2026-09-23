import { ASSETS } from "@/config/assets";

/**
 * Centralized SEO constants + helpers (Phase 5).
 *
 * SITE_URL: no production domain has been assigned yet — the DNS cutover
 * (Namecheap → Vercel) is still pending per every prior phase's notes.
 * `NEXT_PUBLIC_SITE_URL` is read first; the fallback
 * below is a clearly-marked placeholder so metadata/sitemap/JSON-LD/
 * canonical URLs are never silently wrong or blank in local dev. Swap the
 * env var the moment a real domain exists — no code change needed, same
 * "placeholder now, real value later" pattern as `ASSETS`/`site_settings`.
 */
const FALLBACK_SITE_URL = "https://www.utkarshassociates.example"; // TODO: replace via NEXT_PUBLIC_SITE_URL once the real domain is live
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || FALLBACK_SITE_URL).replace(/\/$/, "");

export const ORG_NAME = "Utkarsh Associates";

/** Resolves a site-relative path to an absolute URL under SITE_URL. */
export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

// ============ Plain-text extraction from stored rich-text HTML ============
// For meta-description / JSON-LD fallbacks ONLY when an entity has no
// seo_description/excerpt of its own — never rendered to users
// (RichTextRenderer.tsx is the real content renderer). Content is now a
// plain HTML string (CKEditor 5's `editor.getData()` output, since the
// switch away from Tiptap — see RichTextEditor.tsx for the full backstory)
// rather than a Tiptap JSON document tree, so this strips tags instead of
// walking a node tree.

/**
 * Best-effort plain-text extraction from stored rich-text HTML (as stored in
 * `content`/`bio` jsonb columns), truncated to `maxLen` on a word boundary.
 * Used as a last-resort fallback for meta descriptions and JSON-LD
 * `description`/`articleBody`-style fields when no `seo_description` or
 * `excerpt` has been set. Never used for on-page rendering.
 */
export function richTextToPlainText(content: unknown, maxLen = 160): string {
  if (typeof content !== "string" || content.trim() === "") return "";
  const text = content
    .replace(/<[^>]+>/g, " ") // strip tags
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= maxLen) return text;
  const cut = text.slice(0, maxLen);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > 0 ? lastSpace : maxLen)}…`;
}

// ============ JSON-LD builders ============
// Plain object builders, not React components — rendered via the shared
// <JsonLd> component (src/components/shared/JsonLd.tsx) at each call site,
// so every schema type lives next to the page/section it describes.

/** LegalService/Organization schema — Home page. */
export function organizationJsonLd(opts: { phone?: string; email?: string } = {}) {
  return {
    "@context": "https://schema.org",
    "@type": "LegalService",
    name: ORG_NAME,
    url: SITE_URL,
    logo: absoluteUrl(ASSETS.logo),
    ...(opts.phone ? { telephone: opts.phone } : {}),
    ...(opts.email ? { email: opts.email } : {}),
  } as const;
}

/** Person schema — each team profile ("jobTitle", "worksFor"). */
export function personJsonLd(member: {
  name: string;
  designation: string | null;
  photo_url: string | null;
  email: string | null;
  phone: string | null;
  slug: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: member.name,
    ...(member.designation ? { jobTitle: member.designation } : {}),
    worksFor: { "@type": "Organization", name: ORG_NAME },
    url: absoluteUrl(`/team/${member.slug}`),
    ...(member.photo_url ? { image: member.photo_url } : {}),
    ...(member.email ? { email: member.email } : {}),
    ...(member.phone ? { telephone: member.phone } : {}),
  } as const;
}

/** Article schema — each Insight ("headline", "author", "datePublished"). */
export function articleJsonLd(insight: {
  title: string;
  slug: string;
  excerpt: string | null;
  content: unknown;
  cover_image_url: string | null;
  published_at: string | null;
  updated_at: string;
  author: { name: string; slug: string } | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: insight.title,
    description: insight.excerpt || richTextToPlainText(insight.content),
    url: absoluteUrl(`/insights/${insight.slug}`),
    ...(insight.cover_image_url ? { image: [insight.cover_image_url] } : {}),
    ...(insight.published_at ? { datePublished: insight.published_at } : {}),
    dateModified: insight.updated_at,
    author: insight.author
      ? { "@type": "Person", name: insight.author.name, url: absoluteUrl(`/team/${insight.author.slug}`) }
      : { "@type": "Organization", name: ORG_NAME },
    publisher: {
      "@type": "Organization",
      name: ORG_NAME,
      logo: { "@type": "ImageObject", url: absoluteUrl(ASSETS.logo) },
    },
  } as const;
}

export interface BreadcrumbItem {
  name: string;
  /** Site-relative path, e.g. "/practice-areas". */
  path: string;
}

/** BreadcrumbList schema — every detail page. */
export function breadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  } as const;
}

/** LocalBusiness schema — one per office on the Offices page. Shape matches src/config/content.ts's OfficeContent (Phase 6 §1 — offices moved out of the DB into content.json). */
export function localBusinessJsonLd(office: {
  name: string;
  address: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  isHeadquarters: boolean;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "LegalService",
    name: office.isHeadquarters ? ORG_NAME : `${ORG_NAME} — ${office.name}`,
    ...(office.address || office.city
      ? {
          address: {
            "@type": "PostalAddress",
            ...(office.address ? { streetAddress: office.address } : {}),
            ...(office.city ? { addressLocality: office.city } : {}),
          },
        }
      : {}),
    ...(office.phone ? { telephone: office.phone } : {}),
    ...(office.email ? { email: office.email } : {}),
    url: absoluteUrl("/offices"),
  } as const;
}
