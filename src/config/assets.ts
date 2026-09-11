// The single place every component imports images from. No component should
// ever hardcode a raw image path. When final client SVGs arrive, they get
// saved over the placeholder at the same filename/path — nothing here changes.
export const ASSETS = {
  logo: "/brand/logo.svg",
  favicon: "/brand/favicon.svg",
  heroIllustration: "/illustrations/hero-courtroom.svg",
  aboutIllustration: "/illustrations/about-approach.svg",
  teamAvatarPlaceholder: "/illustrations/team-avatar-placeholder.svg",
  practiceIcons: {
    litigation: "/illustrations/practice-icons/litigation.svg",
    corporate_commercial: "/illustrations/practice-icons/corporate-commercial.svg",
    banking_finance: "/illustrations/practice-icons/banking-finance.svg",
    arbitration_adr: "/illustrations/practice-icons/arbitration-adr.svg",
    real_estate: "/illustrations/practice-icons/real-estate.svg",
    white_collar: "/illustrations/practice-icons/white-collar.svg",
  },
} as const;

export type PracticeIconKey = keyof typeof ASSETS.practiceIcons;
