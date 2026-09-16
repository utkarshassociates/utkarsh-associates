import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";
import { getPublishedInsights, getPublishedPracticeAreas, getPublishedTeamMembers } from "@/lib/data/public";

// Plan §8 item 3: "Dynamic sitemap.ts — queries all published practice
// areas, team members, and insights at build/request time; resubmitted to
// Search Console on deploy." Cached for the same window as the pages it
// describes (see PHASE-5-NOTES.md for the ISR strategy this matches) rather
// than regenerated on every crawler hit.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [practiceAreas, teamMembers] = await Promise.all([getPublishedPracticeAreas(), getPublishedTeamMembers()]);

  // getPublishedInsights is paginated for the public listing UI (9/page);
  // here we want every published row, so perPage is set high enough to
  // cover the whole table in one call. If the Insights library ever grows
  // past a few thousand rows, this should become a dedicated
  // "getAllPublishedInsightSlugs" query instead — flagged in
  // PHASE-5-NOTES.md rather than over-engineered for a scale this firm
  // isn't at yet.
  const { insights } = await getPublishedInsights({ page: 1, perPage: 5000 });

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/about`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/practice-areas`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/team`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/insights`, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/offices`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/contact`, changeFrequency: "monthly", priority: 0.5 },
  ];

  const practiceAreaRoutes: MetadataRoute.Sitemap = practiceAreas.map((pa) => ({
    url: `${SITE_URL}/practice-areas/${pa.slug}`,
    lastModified: pa.updated_at,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const teamRoutes: MetadataRoute.Sitemap = teamMembers.map((m) => ({
    url: `${SITE_URL}/team/${m.slug}`,
    lastModified: m.updated_at,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const insightRoutes: MetadataRoute.Sitemap = insights.map((i) => ({
    url: `${SITE_URL}/insights/${i.slug}`,
    lastModified: i.updated_at,
    changeFrequency: "yearly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...practiceAreaRoutes, ...teamRoutes, ...insightRoutes];
}
