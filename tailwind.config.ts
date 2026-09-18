import type { Config } from "tailwindcss";

// Every value below is copied verbatim from utkarsh-associates-design-system.html
// (:root CSS variables) and project-plan.md §3. Nothing here is invented —
// if a token needs to change, change it at the source file first, then here.

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          900: "#0C2440",
          700: "#133458", // brand primary
          500: "#2C5480",
          100: "#E6ECF2",
        },
        gold: {
          700: "#B8930F",
          500: "#DBAF15", // brand accent
          100: "#FBF2D3",
        },
        cream: "#EBEDE3",
        ink: {
          900: "#1C1F1A", // body text — not pure black
        },
        gray: {
          700: "#4A4D45",
          500: "#7C8074",
          300: "#C7CABF",
          100: "#F7F7F4",
        },
        success: { DEFAULT: "#3F6B4E", bg: "#E7EFE9" },
        error: { DEFAULT: "#A13D3D", bg: "#F5E7E7" },
        warning: { DEFAULT: "#C97A1F", bg: "#FBEEDD" },
      },
      fontFamily: {
        serif: ["var(--font-newsreader)", "Georgia", "serif"],
        sans: ["var(--font-inter)", "-apple-system", "sans-serif"],
        mono: ["var(--font-ibm-plex-mono)", "monospace"],
      },
      fontSize: {
        // [fontSize, { lineHeight, fontWeight }] — from the H1–Button spec table
        h1: ["56px", { lineHeight: "64px", fontWeight: "500" }],
        h2: ["40px", { lineHeight: "48px", fontWeight: "500" }],
        h3: ["28px", { lineHeight: "36px", fontWeight: "600" }],
        h4: ["20px", { lineHeight: "28px", fontWeight: "600" }],
        // body-l revised in Phase 6 §3 (18/28 -> 17/26): the lede-paragraph
        // pattern this token drives (Home hero subheading, About intro, and
        // every listing/detail page's intro paragraph) read oversized.
        // Still clearly distinct from `body` (16/26) below, just tightened.
        // design-system.html's H1-Button spec table updated to match.
        "body-l": ["17px", { lineHeight: "26px", fontWeight: "400" }],
        body: ["16px", { lineHeight: "26px", fontWeight: "400" }],
        small: ["14px", { lineHeight: "22px", fontWeight: "400" }],
        button: ["15px", { lineHeight: "20px", fontWeight: "600", letterSpacing: "0.01em" }],
      },
      spacing: {
        // 8px base scale — sp-1 .. sp-32, matches the design system exactly
        1: "4px",
        2: "8px",
        3: "12px",
        4: "16px",
        6: "24px",
        8: "32px",
        12: "48px",
        16: "64px",
        24: "96px",
        32: "128px",
      },
      borderRadius: {
        sm: "4px", // inputs, tags
        md: "8px", // buttons
        lg: "16px", // cards, images
        pill: "999px", // CTAs
      },
      boxShadow: {
        // navy-tinted, not neutral gray — per icon/elevation spec
        sm: "0 1px 2px rgba(12,36,64,0.06)",
        md: "0 4px 16px rgba(12,36,64,0.08)",
        lg: "0 16px 40px rgba(12,36,64,0.14)",
      },
      screens: {
        // Mobile is the unprefixed default (375–767px, 4 col, 16px margin)
        tablet: "768px", // 8 col, 32px margin
        desktop: "1024px", // 12 col, 64px margin
        wide: "1440px", // 12 col, max-width 1180px centered
      },
      maxWidth: {
        wide: "1180px",
      },
    },
  },
  plugins: [],
};

export default config;
