/**
 * Typed mirror of the `site_settings` keys defined in
 * src/lib/validations/settings.ts's `SITE_SETTINGS_FIELDS`. Per plan §4.1:
 * "A typed config file (src/config/site.ts) mirrors the same keys purely
 * for compile-time safety/autocomplete during development — it's a
 * fallback layer, not a second source of truth; the database value always
 * wins at runtime."
 *
 * Confirmed in PHASE-2-NOTES.md: `supabase/seed.sql` seeds no
 * `site_settings` rows at all, so every key here is genuinely blank in the
 * database until a superAdmin visits `/admin/settings` and saves real
 * values. Public pages call `readSetting(map, key, SITE_DEFAULTS.key)` so
 * the site never ships an empty hero heading or, worse, a blank
 * disclaimer modal — the DB value always overrides this the moment it's
 * saved, per the rule above.
 */
export const SITE_DEFAULTS = {
  disclaimer_text:
    "[PLACEHOLDER DISCLAIMER TEXT — pending final copy from legal counsel] I acknowledge that I am seeking information relating to Utkarsh Associates of my own accord and that there has been no form of solicitation, advertisement, or inducement by the firm or its members. The information on this website is provided for general informational purposes only and does not constitute legal advice.",
  home_hero_heading: "Trusted counsel, clearly delivered.",
  home_hero_subheading:
    "Utkarsh Associates advises businesses and individuals across litigation, corporate, and regulatory matters — with the clarity and rigor a serious matter deserves.",
  about_intro_paragraph:
    "Utkarsh Associates is a full-service law firm built on the belief that sound legal counsel should be rigorous, responsive, and easy to understand — never more complicated than the matter requires.",
  contact_intro: "Tell us about your matter and a member of our team will get back to you shortly.",
  firm_phone: "",
  firm_email: "",
  social_linkedin_url: "",
} as const;

export type SiteSettingDefaultKey = keyof typeof SITE_DEFAULTS;
