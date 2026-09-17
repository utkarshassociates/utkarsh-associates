import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Button, PracticeAreaCard, StatStrip } from "@/components/ui";
import { JsonLd } from "@/components/shared/JsonLd";
import { ASSETS } from "@/config/assets";
import { SITE_DEFAULTS } from "@/config/site";
import { getLatestInsights, getPracticeAreaHighlights, getSiteSettings, readSetting } from "@/lib/data/public";
import { getPracticeIconSrc } from "@/lib/utils";
import { ORG_NAME, organizationJsonLd } from "@/lib/seo";

// See PHASE-4-NOTES's "Phase 5 planning note": on-demand revalidatePath()
// from the relevant write actions is the primary freshness mechanism
// (instant, exact); this is the safety-net time-based
// window underneath it, in case an on-demand call is ever missed somewhere.
export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const heroHeading = readSetting(settings, "home_hero_heading", SITE_DEFAULTS.home_hero_heading);
  const heroSubheading = readSetting(settings, "home_hero_subheading", SITE_DEFAULTS.home_hero_subheading);
  return {
    // `title.absolute` bypasses the root layout's "%s | Utkarsh Associates"
    // template — appending the org name a second time to a homepage title
    // that already leads with it would be redundant.
    title: { absolute: `${ORG_NAME} — ${heroHeading}` },
    description: heroSubheading,
    alternates: { canonical: "/" },
    openGraph: { title: heroHeading, description: heroSubheading, url: "/", type: "website" },
    twitter: { card: "summary_large_image", title: heroHeading, description: heroSubheading },
  };
}

// Home is a code-defined layout (fastest to build, can't be accidentally
// broken), but every piece of editable text — hero heading/subheading —
// reads from `site_settings` at runtime, not a hardcoded string. Practice
// area highlights and latest insights are pulled live from the CMS.
export default async function HomePage() {
  const [settings, practiceAreas, latestInsights] = await Promise.all([
    getSiteSettings(),
    getPracticeAreaHighlights(6),
    getLatestInsights(3),
  ]);

  const heroHeading = readSetting(settings, "home_hero_heading", SITE_DEFAULTS.home_hero_heading);
  const heroSubheading = readSetting(settings, "home_hero_subheading", SITE_DEFAULTS.home_hero_subheading);
  const firmPhone = readSetting(settings, "firm_phone", SITE_DEFAULTS.firm_phone);
  const firmEmail = readSetting(settings, "firm_email", SITE_DEFAULTS.firm_email);

  return (
    <>
      <JsonLd data={organizationJsonLd({ phone: firmPhone || undefined, email: firmEmail || undefined })} />
      {/* Hero */}
      <section className="bg-navy-700 text-white">
        <div className="mx-auto grid max-w-wide gap-8 px-4 py-16 tablet:px-8 desktop:grid-cols-2 desktop:items-center desktop:px-16 desktop:py-24">
          <div>
            <h1 className="font-serif text-h1 text-white">{heroHeading}</h1>
            <p className="mt-4 max-w-[520px] text-body-l text-cream">{heroSubheading}</p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/contact">
                <Button variant="gold">Get in Touch</Button>
              </Link>
              <Link href="/practice-areas">
                <Button
                  variant="outline"
                  className="border-white text-white hover:bg-white/10"
                >
                  View Practice Areas
                </Button>
              </Link>
            </div>
          </div>
          <div className="hidden desktop:block">
            <Image src={ASSETS.heroIllustration} alt="" width={600} height={420} priority />
          </div>
        </div>
      </section>

      {/* Stat strip */}
      <section className="border-b border-gray-300 bg-cream">
        <div className="mx-auto max-w-wide px-4 tablet:px-8 desktop:px-16">
          <StatStrip
            stats={[
              { num: "15+", label: "Years" },
              { num: "3", label: "Jurisdictions" },
              { num: "200+", label: "Clients Served" },
              { num: "7", label: "Core Practices" },
            ]}
          />
        </div>
      </section>

      {/* Practice area highlights */}
      {practiceAreas.length > 0 && (
        <section className="mx-auto max-w-wide px-4 py-16 tablet:px-8 desktop:px-16">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <h2 className="font-serif text-h2 text-navy-700">Our Expertise</h2>
              <p className="mt-2 max-w-[520px] text-body text-gray-700">
                Full-service counsel across the practice areas that matter most to our clients.
              </p>
            </div>
            <Link href="/practice-areas" className="hidden shrink-0 text-small font-semibold text-navy-700 hover:text-gold-700 tablet:block">
              View all →
            </Link>
          </div>
          <div className="grid gap-4 tablet:grid-cols-2 desktop:grid-cols-3">
            {practiceAreas.map((pa) => (
              <PracticeAreaCard
                key={pa.id}
                title={pa.title}
                description={pa.short_description ?? ""}
                href={`/practice-areas/${pa.slug}`}
                icon={<img src={getPracticeIconSrc(pa.icon_key)} alt="" width={40} height={40} />}
              />
            ))}
          </div>
        </section>
      )}

      {/* Why clients stay */}
      <section className="bg-cream">
        <div className="mx-auto max-w-wide px-4 py-16 tablet:px-8 desktop:px-16">
          <h2 className="font-serif text-h2 text-navy-700">Why Clients Stay</h2>
          <div className="mt-8 grid gap-8 tablet:grid-cols-3">
            <div>
              <h3 className="mb-2 font-serif text-h4 text-navy-700">Direct access</h3>
              <p className="text-small text-gray-700">
                You work directly with the partner handling your matter — not a rotating cast of associates.
              </p>
            </div>
            <div>
              <h3 className="mb-2 font-serif text-h4 text-navy-700">Clear communication</h3>
              <p className="text-small text-gray-700">
                Plain-language updates at every stage, so you always know where a matter stands.
              </p>
            </div>
            <div>
              <h3 className="mb-2 font-serif text-h4 text-navy-700">Practical outcomes</h3>
              <p className="text-small text-gray-700">
                Advice built around your actual business objectives, not just legal theory.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Latest insights */}
      {latestInsights.length > 0 && (
        <section className="mx-auto max-w-wide px-4 py-16 tablet:px-8 desktop:px-16">
          <div className="mb-8 flex items-end justify-between gap-4">
            <h2 className="font-serif text-h2 text-navy-700">Latest Insights</h2>
            <Link href="/insights" className="hidden shrink-0 text-small font-semibold text-navy-700 hover:text-gold-700 tablet:block">
              View all →
            </Link>
          </div>
          <div className="grid gap-4 tablet:grid-cols-3">
            {latestInsights.map((insight) => (
              <Link
                key={insight.id}
                href={`/insights/${insight.slug}`}
                className="block rounded-lg border border-gray-300 bg-white p-6 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md"
              >
                {insight.category && (
                  <span className="mb-3 inline-block rounded-pill bg-navy-100 px-3 py-[5px] text-[12px] font-semibold text-navy-700">
                    {insight.category.name}
                  </span>
                )}
                <h4 className="mb-2 font-serif text-h4 text-navy-700">{insight.title}</h4>
                {insight.excerpt && <p className="text-small text-gray-700">{insight.excerpt}</p>}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* CTA band */}
      <section className="bg-navy-900">
        <div className="mx-auto flex max-w-wide flex-col items-start gap-6 px-4 py-16 tablet:flex-row tablet:items-center tablet:justify-between tablet:px-8 desktop:px-16">
          <div>
            <h2 className="font-serif text-h3 text-white">Have a matter you'd like to discuss?</h2>
            <p className="mt-2 text-small text-gray-300">Reach out and a member of our team will respond promptly.</p>
          </div>
          <Link href="/contact" className="shrink-0">
            <Button variant="gold">Contact Us</Button>
          </Link>
        </div>
      </section>
    </>
  );
}
