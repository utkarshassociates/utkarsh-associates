import { z } from "zod";

/**
 * The curated set of `site_settings` keys the /admin/settings form renders,
 * per project-plan.md §4.1/§4.2 ("static info referenced from one place").
 *
 * NOTE: supabase/seed.sql does not currently seed any site_settings rows —
 * confirmed while building this page (grepped the seed file, found none).
 * So on a fresh DB every field below starts blank until first saved here.
 * The disclaimer field in particular should be filled with the placeholder
 * text from §4.2 ("[PLACEHOLDER DISCLAIMER TEXT — pending final copy from
 * legal counsel]") on first save, not left empty, since <DisclaimerGate />
 * (Phase 4) will render whatever this key holds.
 *
 * This list is intentionally not exhaustive — Offices get their own
 * structured CRUD via the `offices` table in Phase 3 (name/address/phone
 * live as rows there, not here). These are the page-level copy blocks that
 * don't have a natural home in a CMS entity table.
 */
export const SITE_SETTINGS_FIELDS = [
  {
    key: "disclaimer_text",
    label: "Disclaimer / consent-gate text",
    section: "Legal",
    multiline: true,
    helpText:
      "Shown once per session in <DisclaimerGate /> (§4.2). Bar Council of India advertising-restriction language belongs here.",
  },
  {
    key: "home_hero_heading",
    label: "Home hero heading",
    section: "Home",
    multiline: false,
  },
  {
    key: "home_hero_subheading",
    label: "Home hero subheading",
    section: "Home",
    multiline: true,
  },
  {
    key: "about_intro_paragraph",
    label: "About — intro paragraph",
    section: "About",
    multiline: true,
  },
  {
    key: "contact_intro",
    label: "Contact page intro text",
    section: "Contact",
    multiline: true,
  },
  {
    key: "firm_phone",
    label: "Firm phone number",
    section: "Firm-wide",
    multiline: false,
  },
  {
    key: "firm_email",
    label: "Firm contact email",
    section: "Firm-wide",
    multiline: false,
  },
  {
    key: "social_linkedin_url",
    label: "LinkedIn URL",
    section: "Social",
    multiline: false,
  },
] as const;

export type SiteSettingKey = (typeof SITE_SETTINGS_FIELDS)[number]["key"];

export const updateSiteSettingsSchema = z.object({
  values: z.record(z.string(), z.string()),
});

export type UpdateSiteSettingsInput = z.infer<typeof updateSiteSettingsSchema>;
