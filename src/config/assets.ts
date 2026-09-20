// The single place every component imports images from. No component should
// ever hardcode a raw image path. When final client SVGs arrive, they get
// saved over the placeholder at the same filename/path — nothing here changes.
export const ASSETS = {
  logo: "/brand/logo.svg",
  favicon: "/brand/favicon.svg",
  heroIllustration: "/illustrations/hero-courtroom.png",
  aboutIllustration: "/illustrations/about-approach.png",
  teamAvatarPlaceholder: "/illustrations/team-avatar-placeholder.svg",
  // Phase 6 §7: practice areas now carry their own uploaded `icon_url`
  // (same sharp/Storage pipeline as team photos) instead of picking from a
  // fixed developer-maintained set — a practice area can be created from
  // the CMS, so requiring a developer to pre-ship an icon for every future
  // one was a structural contradiction. This renders whenever icon_url is
  // null, so nothing is ever a broken image or a blocking requirement.
  // The old six-icon `practiceIcons` set (litigation.svg etc.) is no longer
  // referenced by code but the files are left in place under
  // public/illustrations/practice-icons/ — harmless, and may still be
  // useful as style reference for whatever gets uploaded later.
  practiceAreaIconFallback: "/illustrations/practice-area-fallback.svg",
} as const;
