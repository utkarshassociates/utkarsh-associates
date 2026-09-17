import type { Metadata } from "next";
import { Newsreader, Inter, IBM_Plex_Mono } from "next/font/google";
import { ASSETS } from "@/config/assets";
import { ORG_NAME, SITE_URL } from "@/lib/seo";
import "./globals.css";

// next/font self-hosts these at build time (no runtime request to fonts.googleapis.com) —
// self-hosted fonts avoid a render-blocking Google Fonts request.
const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-newsreader",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
});

// Site-wide metadata defaults. `metadataBase` is what lets every
// relative `alternates.canonical`/`openGraph.url`/`openGraph.images` value
// set on individual pages resolve to an absolute URL — see src/lib/seo.ts
// for why SITE_URL is currently a documented placeholder pending the real
// domain.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: ORG_NAME,
    template: `%s | ${ORG_NAME}`,
  },
  description: "Utkarsh Associates — full-service law firm advising businesses and individuals across litigation, corporate, and regulatory matters.",
  icons: {
    icon: ASSETS.favicon,
  },
  openGraph: {
    siteName: ORG_NAME,
    type: "website",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${newsreader.variable} ${inter.variable} ${ibmPlexMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
