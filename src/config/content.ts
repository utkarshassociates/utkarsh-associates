import rawContent from "./content.json";

/**
 * Phase 6 §1 — typed access to content.json, the single file that now holds
 * Offices and Site Settings (previously the `offices` table and
 * `site_settings` rows, both removed from the DB in the Phase 6 schema
 * migration — see PHASE-6 plan §11).
 *
 * Unlike the old `getSiteSettings()`/`getOffices()` in src/lib/data/public.ts,
 * these are plain synchronous reads of a file bundled at build time — no
 * Supabase round trip, no `cache()` wrapper needed (there's no per-request
 * work to dedupe), and no "fall back to SITE_DEFAULTS if the DB row is
 * missing" dance, since there's only one copy of this data now and it's
 * never empty.
 *
 * Editing this data post-launch means editing content.json and redeploying
 * — there's no admin screen for it anymore (§1's stated trade-off, deemed
 * acceptable since the client's actual day-to-day CMS needs are Practice
 * Areas/Team/Insights/Inquiries, not this).
 */

export interface OfficeContent {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  isHeadquarters: boolean;
  mapEmbedUrl: string | null;
}

export interface SiteSettingsContent {
  firmTagline: string;
  homeHeroHeading: string;
  homeHeroSubheading: string;
  aboutIntroParagraph: string;
  contactIntro: string;
  firmPhone: string;
  firmEmail: string;
  socialLinkedinUrl: string;
  disclaimerText: string;
}

interface ContentFile {
  offices: { locations: OfficeContent[] };
  siteSettings: SiteSettingsContent;
}

const content = rawContent as unknown as ContentFile;

/** All offices, in file order (array order = display order, no separate order_index). */
export const OFFICES: OfficeContent[] = content.offices.locations;

/** The single headquarters office, if one is marked — falls back to the first office. Mirrors the old Footer.tsx `offices.find(is_headquarters) ?? offices[0]` logic. */
export function getHeadquartersOffice(): OfficeContent | undefined {
  return OFFICES.find((o) => o.isHeadquarters) ?? OFFICES[0];
}

/** Site-wide copy blocks — hero heading, intro paragraphs, disclaimer text, firm contact details. */
export const SITE_SETTINGS: SiteSettingsContent = content.siteSettings;
