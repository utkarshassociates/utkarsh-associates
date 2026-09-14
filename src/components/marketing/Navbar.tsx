"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { ASSETS } from "@/config/assets";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "About", href: "/about" },
  { label: "Practice Areas", href: "/practice-areas" },
  { label: "Team", href: "/team" },
  { label: "Insights", href: "/insights" },
  { label: "Offices", href: "/offices" },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-gray-300 bg-white">
      <div className="mx-auto flex h-[72px] max-w-wide items-center justify-between px-4 tablet:px-8 desktop:px-16">
        <Link href="/" className="flex items-center" onClick={() => setMobileOpen(false)}>
          <Image src={ASSETS.logo} alt="Utkarsh Associates" width={160} height={40} priority />
        </Link>

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

        <div className="hidden desktop:block">
          <Link href="/contact">
            <Button variant="primary">Contact Us</Button>
          </Link>
        </div>

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
            <li className="mt-2">
              <Link href="/contact" onClick={() => setMobileOpen(false)}>
                <Button variant="primary" className="w-full justify-center">
                  Contact Us
                </Button>
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
