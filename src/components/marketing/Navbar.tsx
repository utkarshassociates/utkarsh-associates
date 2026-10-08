"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { ASSETS } from "@/config/assets";
import { OFFICES, SITE_SETTINGS } from "@/config/content";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "About Us", href: "/about" },
  { label: "Practice Areas", href: "/practice-areas" },
  { label: "Team", href: "/team" },
  { label: "Insights", href: "/insights" },
  { label: "Offices", href: "/offices" },
];

// public/brand/logo.svg's own viewBox is 1023×534 (≈1.92:1 — a wider lockup
// than it looks stacked, because the tagline line is baked into the file).
// Passing that real ratio to next/image, then letting Tailwind's h-*/w-auto
// classes below scale it, keeps it undistorted at every size — the old
// width={160} height={40} (a 4:1 box) squashed the artwork vertically,
// which is why the wordmark/tagline read as cramped and half-cut before.
const LOGO_W = 192;
const LOGO_H = 100;

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const linkedin = SITE_SETTINGS.socialLinkedinUrl;
  // Derived from content.json's actual office list, not hardcoded — so a
  // third office added later (e.g. Bengaluru) shows up here automatically.
  // Currently only Delhi/Mumbai exist in content.json, so that's all that
  // will render until a third office is added there.
  const cities = OFFICES.map((o) => o.city ?? o.name).filter(Boolean) as string[];

  return (
    <>
      {/* Utility bar — deliberately NOT sticky, so it scrolls away and the
          sticky main nav below doesn't grow the permanently-visible header
          on small screens. */}
      <div className="w-full">
        <div className="h-1.5 bg-navy-900" aria-hidden="true" />
        <div className="border-b border-gray-300 bg-cream">
          <div className="mx-auto flex h-9 max-w-wide items-center justify-between gap-4 px-4 tablet:px-8 desktop:px-16">
            <p className="truncate font-mono text-[11px] uppercase tracking-wide text-navy-700">
              {SITE_SETTINGS.firmTagline}
              {cities.length > 0 && (
                <>
                  <span className="hidden tablet:inline"> · {cities.map((c) => c.toUpperCase()).join(" · ")}</span>
                </>
              )}
            </p>
            {linkedin && (
              <a
                href={linkedin}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Utkarsh Associates on LinkedIn"
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-pill bg-white text-navy-700 transition-colors hover:bg-navy-100"
              >
                <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor" aria-hidden="true">
                  <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9h4v12H3V9Zm7 0h3.8v1.64h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V21h-4v-5.6c0-1.34-.02-3.06-1.87-3.06-1.87 0-2.15 1.46-2.15 2.96V21h-4V9Z" />
                </svg>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Main nav — sticky, with generous vertical padding around the logo
          so it has room to breathe instead of being squeezed into a fixed
          72px bar. */}
      <header className="sticky top-0 z-40 border-b border-gray-300 bg-white">
        <div className="mx-auto flex max-w-wide items-center justify-between gap-4 px-4 py-4 tablet:px-8 tablet:py-5 desktop:px-16 desktop:py-6">
          {/* Phase 6 §2: nav links moved to the left, logo to the right.
              The standalone "Contact Us" CTA is removed entirely — "Offices"
              (already in NAV_LINKS) is the way to reach the contact form
              since it moved there in Phase 6; this isn't a dead link, it's
              just no longer a separate header button. */}
          <nav className="hidden desktop:flex desktop:items-center desktop:gap-8">
            {NAV_LINKS.map((link) => {
              const active = pathname === link.href || (link.href !== "/" && pathname?.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "text-small font-medium text-ink-900 hover:text-navy-700",
                    active && "text-navy-700 font-semibold"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <Link href="/" className="flex items-center desktop:order-last" onClick={() => setMobileOpen(false)}>
            <Image
              src={ASSETS.logo}
              alt="Utkarsh Associates"
              width={LOGO_W}
              height={LOGO_H}
              priority
              className="h-14 w-auto tablet:h-[70px] desktop:h-20"
            />
          </Link>

          <button
            type="button"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            className="flex h-10 w-10 items-center justify-center rounded-md text-navy-700 desktop:hidden"
            onClick={() => setMobileOpen((v) => !v)}
          >
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              {mobileOpen ? <path d="M6 6L18 18M18 6L6 18" /> : <path d="M4 7H20M4 12H20M4 17H20" />}
            </svg>
          </button>
        </div>

        {mobileOpen && (
          <nav className="border-t border-gray-300 bg-white px-4 py-4 desktop:hidden">
            <ul className="flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="block rounded-sm px-2 py-2.5 text-body font-medium text-ink-900 hover:bg-navy-100 hover:text-navy-700"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </header>
    </>
  );
}
