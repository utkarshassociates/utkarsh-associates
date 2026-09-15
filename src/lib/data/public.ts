import { cache } from "react";
import { createBrowserClient } from "@/lib/supabase/client";
import type {
  Insight,
  InsightCategory,
  InsightWithRelations,
  Office,
  PracticeArea,
  TeamMember,
  TeamMemberWithPracticeAreas,
} from "@/types/domain";

/**
 * Public-site data-fetch layer (Phase 4). Every function here goes through
 * the ANON client (src/lib/supabase/client.ts), never the service-role
 * client — so even a bug in one of these can't read a draft row or write
 * anything; the database's own RLS policies (§6, plus the
 * supabase/migrations/0003_phase4.sql fix) are the actual enforcement, not
 * this file's query logic. That mirrors the two-layer model the plan
 * describes for admin writes, just for public reads instead.
 *
 * No ISR/`revalidate` tuning yet — that's explicitly Phase 5 scope per plan
 * §9 (SEO pass, "ISR (revalidate) on CMS-driven pages"). Every call here is
 * a plain, uncached fetch for now, so the public site always reflects the
 * latest published/rejected/draft state instantly — correct default before
 * caching strategy is deliberately chosen, not an oversight.
 */

const supabase = () => createBrowserClient();

// ============ Site Settings (§4.1/§4.2) ============

export type SiteSettingsMap = Record<string, unknown>;

/**
 * All site_settings rows as a flat key->value map. Missing keys are simply
 * absent — callers fall back to defaults inline.
 *
 * Wrapped in React's `cache()`: this is called once from
 * (marketing)/layout.tsx (for the footer + disclaimer text) AND again from
 * whichever page needs its own settings (Home's hero heading, Contact's
 * intro/phone/email) — `cache()` dedupes those into a single Supabase round
 * trip per request instead of one per call site, without either call site
 * needing to know about the other.
 */
export const getSiteSettings = cache(async (): Promise<SiteSettingsMap> => {
  const { data, error } = await supabase().from("site_settings").select("key, value");
  if (error) {
    console.error("getSiteSettings failed:", error);
    return {};
  }
  const map: SiteSettingsMap = {};
  for (const row of data ?? []) {
    map[row.key] = row.value;
  }
  return map;
});

/** Reads one site_settings value out of an already-fetched map, falling back to `fallback` if absent/empty. */
export function readSetting(map: SiteSettingsMap, key: string, fallback = ""): string {
  const value = map[key];
  if (typeof value === "string" && value.trim().length > 0) return value;
  return fallback;
}

// ============ Practice Areas ============

export async function getPublishedPracticeAreas(): Promise<PracticeArea[]> {
  const { data, error } = await supabase()
    .from("practice_areas")
    .select("*")
    .eq("status", "published")
    .order("order_index", { ascending: true });
  if (error) {
    console.error("getPublishedPracticeAreas failed:", error);
    return [];
  }
  return data ?? [];
}

/** Home/practice-areas listing highlight subset — first N by order_index. */
export async function getPracticeAreaHighlights(limit = 6): Promise<PracticeArea[]> {
  const { data, error } = await supabase()
    .from("practice_areas")
    .select("*")
    .eq("status", "published")
    .order("order_index", { ascending: true })
    .limit(limit);
  if (error) {
    console.error("getPracticeAreaHighlights failed:", error);
    return [];
  }
  return data ?? [];
}

export async function getPracticeAreaBySlug(slug: string): Promise<PracticeArea | null> {
  const { data, error } = await supabase()
    .from("practice_areas")
    .select("*")
    .eq("status", "published")
    .eq("slug", slug)
    .maybeSingle();
  if (error) {
    console.error("getPracticeAreaBySlug failed:", error);
    return null;
  }
  return data;
}

/** Practice areas by id, for rendering a team member's linked practice-area tags. */
export async function getPracticeAreasByIds(ids: string[]): Promise<PracticeArea[]> {
  if (ids.length === 0) return [];
  const { data, error } = await supabase()
    .from("practice_areas")
    .select("*")
    .eq("status", "published")
    .in("id", ids);
  if (error) {
    console.error("getPracticeAreasByIds failed:", error);
    return [];
  }
  return data ?? [];
}

/** Team members linked to a given practice area (for the practice-area detail page's "related team" section). */
export async function getTeamMembersForPracticeArea(practiceAreaId: string): Promise<TeamMember[]> {
  const { data: links, error: linkError } = await supabase()
    .from("team_practice_areas")
    .select("team_member_id")
    .eq("practice_area_id", practiceAreaId);
  if (linkError || !links || links.length === 0) {
    if (linkError) console.error("getTeamMembersForPracticeArea (links) failed:", linkError);
    return [];
  }
  const ids = links.map((l) => l.team_member_id);
  const { data, error } = await supabase()
    .from("team_members")
    .select("*")
    .eq("status", "published")
    .in("id", ids)
    .order("order_index", { ascending: true });
  if (error) {
    console.error("getTeamMembersForPracticeArea failed:", error);
    return [];
  }
  return data ?? [];
}

// ============ Team ============

export async function getPublishedTeamMembers(): Promise<TeamMember[]> {
  const { data, error } = await supabase()
    .from("team_members")
    .select("*")
    .eq("status", "published")
    .order("order_index", { ascending: true });
  if (error) {
    console.error("getPublishedTeamMembers failed:", error);
    return [];
  }
  return data ?? [];
}

export async function getTeamMemberBySlug(slug: string): Promise<TeamMemberWithPracticeAreas | null> {
  const { data, error } = await supabase()
    .from("team_members")
    .select("*")
    .eq("status", "published")
    .eq("slug", slug)
    .maybeSingle();
  if (error || !data) {
    if (error) console.error("getTeamMemberBySlug failed:", error);
    return null;
  }

  const { data: links, error: linkError } = await supabase()
    .from("team_practice_areas")
    .select("practice_area_id")
    .eq("team_member_id", data.id);
  if (linkError) console.error("getTeamMemberBySlug (links) failed:", linkError);

  return { ...data, practiceAreaIds: (links ?? []).map((l) => l.practice_area_id) };
}

// ============ Insight Categories ============

export async function getInsightCategories(): Promise<InsightCategory[]> {
  const { data, error } = await supabase().from("insight_categories").select("*").order("name", { ascending: true });
  if (error) {
    console.error("getInsightCategories failed:", error);
    return [];
  }
  return data ?? [];
}

// ============ Insights ============

const INSIGHT_SELECT =
  "*, category:insight_categories(id, name, slug), author:team_members(id, name, slug)";

export interface PaginatedInsights {
  insights: InsightWithRelations[];
  total: number;
  page: number;
  perPage: number;
}

/** Published insights, newest first (§4 — "Insights (blog listing) — Paginated, filterable by category"). */
export async function getPublishedInsights(params: {
  page?: number;
  perPage?: number;
  categorySlug?: string;
}): Promise<PaginatedInsights> {
  const page = params.page && params.page > 0 ? params.page : 1;
  const perPage = params.perPage ?? 9;
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  let query = supabase()
    .from("insights")
    .select(INSIGHT_SELECT, { count: "exact" })
    .eq("status", "published")
    .order("published_at", { ascending: false, nullsFirst: false })
    .range(from, to);

  if (params.categorySlug) {
    // category is a related table, so filter by resolving its id first —
    // simplest correct approach without a Postgres view, and this list is
    // small (insight_categories has no pagination need of its own).
    const { data: cat } = await supabase()
      .from("insight_categories")
      .select("id")
      .eq("slug", params.categorySlug)
      .maybeSingle();
    if (!cat) return { insights: [], total: 0, page, perPage };
    query = query.eq("category_id", cat.id);
  }

  const { data, error, count } = await query;
  if (error) {
    console.error("getPublishedInsights failed:", error);
    return { insights: [], total: 0, page, perPage };
  }
  return { insights: (data ?? []) as unknown as InsightWithRelations[], total: count ?? 0, page, perPage };
}

/** Home page "latest insights" strip. */
export async function getLatestInsights(limit = 3): Promise<InsightWithRelations[]> {
  const { data, error } = await supabase()
    .from("insights")
    .select(INSIGHT_SELECT)
    .eq("status", "published")
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(limit);
  if (error) {
    console.error("getLatestInsights failed:", error);
    return [];
  }
  return (data ?? []) as unknown as InsightWithRelations[];
}

export async function getInsightBySlug(slug: string): Promise<InsightWithRelations | null> {
  const { data, error } = await supabase()
    .from("insights")
    .select(INSIGHT_SELECT)
    .eq("status", "published")
    .eq("slug", slug)
    .maybeSingle();
  if (error) {
    console.error("getInsightBySlug failed:", error);
    return null;
  }
  return (data as unknown as InsightWithRelations) ?? null;
}

/** Related insights: same category, excluding the current one, newest first. */
export async function getRelatedInsights(
  categoryId: string | null,
  excludeId: string,
  limit = 3
): Promise<InsightWithRelations[]> {
  if (!categoryId) return [];
  const { data, error } = await supabase()
    .from("insights")
    .select(INSIGHT_SELECT)
    .eq("status", "published")
    .eq("category_id", categoryId)
    .neq("id", excludeId)
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(limit);
  if (error) {
    console.error("getRelatedInsights failed:", error);
    return [];
  }
  return (data ?? []) as unknown as InsightWithRelations[];
}

/** Related insights: same practice area (via the migration 0004 `practice_area_id` relation), newest first. Practice Area detail page's "related insights" section — see PHASE-4-NOTES.md for why this needed a schema addition. */
export async function getInsightsForPracticeArea(practiceAreaId: string, limit = 3): Promise<InsightWithRelations[]> {
  const { data, error } = await supabase()
    .from("insights")
    .select(INSIGHT_SELECT)
    .eq("status", "published")
    .eq("practice_area_id", practiceAreaId)
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(limit);
  if (error) {
    console.error("getInsightsForPracticeArea failed:", error);
    return [];
  }
  return (data ?? []) as unknown as InsightWithRelations[];
}

// ============ Offices ============

/** Wrapped in `cache()` for the same reason as getSiteSettings — called from both the shared layout (footer) and the /offices page. */
export const getOffices = cache(async (): Promise<Office[]> => {
  const { data, error } = await supabase().from("offices").select("*").order("order_index", { ascending: true });
  if (error) {
    console.error("getOffices failed:", error);
    return [];
  }
  return data ?? [];
});

export type { Insight };
