import Link from "next/link";
import Image from "next/image";
import { ASSETS } from "@/config/assets";
import { OFFICES, SITE_SETTINGS, getHeadquartersOffice } from "@/config/content";

// Phase 6 §2: "Contact" dropped from this list — the contact form now lives
// on /offices (see (marketing)/offices/page.tsx), so "Offices" is the way
// there; there's no separate /contact route left to link to.
const FOOTER_LINKS = [
  { label: "About", href: "/about" },
  { label: "Practice Areas", href: "/practice-areas" },
  { label: "Team", href: "/team" },
  { label: "Insights", href: "/insights" },
  { label: "Offices", href: "/offices" },
];

export function Footer() {
  const { firmPhone: phone, firmEmail: email, socialLinkedinUrl: linkedin } = SITE_SETTINGS;
  const hq = getHeadquartersOffice();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-navy-900 bg-navy-900 text-gray-300">
      <div className="mx-auto max-w-wide px-4 py-12 tablet:px-8 desktop:px-16">
        <div className="grid grid-cols-1 gap-8 tablet:grid-cols-4">
          <div>
            <Image src={ASSETS.logo} alt="Utkarsh Associates" width={150} height={38} className="mb-4" />
            {hq?.address && <p className="text-small text-gray-300">{hq.address}</p>}
            {phone && (
              <p className="mt-2 text-small text-gray-300">
                <a href={`tel:${phone.replace(/\s+/g, "")}`} className="hover:text-white">
                  {phone}
                </a>
              </p>
            )}
            {email && (
              <p className="text-small text-gray-300">
                <a href={`mailto:${email}`} className="hover:text-white">
                  {email}
                </a>
              </p>
            )}
            {linkedin && (
              <p className="mt-3">
                <a href={linkedin} target="_blank" rel="noopener noreferrer" className="text-small font-semibold text-gold-500 hover:text-gold-700">
                  LinkedIn →
                </a>
              </p>
            )}
          </div>

          <div className="tablet:col-span-2">
            <h3 className="mb-3 font-mono text-[11px] uppercase tracking-wide text-gray-500">Navigate</h3>
            <ul className="grid grid-cols-2 gap-x-6 gap-y-2">
              {FOOTER_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-small text-gray-300 hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-3 font-mono text-[11px] uppercase tracking-wide text-gray-500">Offices</h3>
            <ul className="flex flex-col gap-1.5">
              {OFFICES.map((office) => (
                <li key={office.id} className="text-small text-gray-300">
                  {office.name}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6">
          <p className="text-[12px] leading-relaxed text-gray-500">
            In accordance with the rules of the Bar Council of India, this website is
            intended solely for informational purposes and does not constitute advertising, solicitation, or
            inducement of any kind.
          </p>
          <p className="mt-3 text-[12px] text-gray-500">© {year} Utkarsh Associates. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
