import type { Metadata } from "next";
import { Tag } from "@/components/ui";
import { ContactForm } from "@/components/marketing/ContactForm";
import { JsonLd } from "@/components/shared/JsonLd";
import { OFFICES, SITE_SETTINGS } from "@/config/content";
import { getPublishedPracticeAreas } from "@/lib/data/public";
import { localBusinessJsonLd } from "@/lib/seo";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Offices & Contact",
  description: "Reach us at any of our office locations, or send us a message directly.",
  alternates: { canonical: "/offices" },
  openGraph: { title: "Offices & Contact", url: "/offices", type: "website" },
};

// Phase 6 §1/§8: offices now come from content.ts (a static file), not a DB
// table — no admin screen, no CRUD. The contact form moves here from the
// old standalone /contact route (removed this phase), since that's a more
// natural single "get in touch" destination than a separate page every
// nav/CTA had to link to.
export default async function OfficesPage() {
  const practiceAreas = await getPublishedPracticeAreas();
  const { contactIntro, firmPhone, firmEmail } = SITE_SETTINGS;

  return (
    <div className="mx-auto max-w-wide px-4 py-16 tablet:px-8 desktop:px-16">
      {OFFICES.map((office) => (
        <JsonLd key={office.id} data={localBusinessJsonLd(office)} />
      ))}
      <h1 className="font-serif text-h1 text-navy-700">Offices &amp; Contact</h1>
      <p className="mt-4 max-w-[560px] text-body-l text-gray-700">
        Reach us at any of our office locations, or send us a message directly.
      </p>

      {(firmPhone || firmEmail) && (
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-small text-gray-700">
          {firmPhone && (
            <a href={`tel:${firmPhone.replace(/\s+/g, "")}`} className="font-semibold text-navy-700 hover:text-gold-700">
              {firmPhone}
            </a>
          )}
          {firmEmail && (
            <a href={`mailto:${firmEmail}`} className="font-semibold text-navy-700 hover:text-gold-700">
              {firmEmail}
            </a>
          )}
        </div>
      )}

      {/* Offices — "left and right" per Phase 6 §8: a 2-col grid at tablet+
          puts the first two offices side by side; additional offices wrap
          onto further rows in the same pattern. */}
      {OFFICES.length === 0 ? (
        <p className="mt-12 text-body text-gray-700">Office details are being updated — please check back soon.</p>
      ) : (
        <div className="mt-12 grid gap-6 tablet:grid-cols-2">
          {OFFICES.map((office) => (
            <div key={office.id} className="rounded-lg border border-gray-300 bg-white p-6">
              <div className="mb-3 flex items-start justify-between gap-2">
                <h3 className="font-serif text-h4 text-navy-700">{office.name}</h3>
                {office.isHeadquarters && <Tag variant="gold">Headquarters</Tag>}
              </div>
              {office.address && <p className="whitespace-pre-line text-small text-gray-700">{office.address}</p>}
              {office.city && <p className="mt-1 text-small text-gray-500">{office.city}</p>}
              <div className="mt-4 flex flex-col gap-1">
                {office.phone && (
                  <a href={`tel:${office.phone.replace(/\s+/g, "")}`} className="text-small font-semibold text-navy-700 hover:text-gold-700">
                    {office.phone}
                  </a>
                )}
                {office.email && (
                  <a href={`mailto:${office.email}`} className="text-small font-semibold text-navy-700 hover:text-gold-700">
                    {office.email}
                  </a>
                )}
              </div>
              {office.mapEmbedUrl && (
                <div className="mt-4 overflow-hidden rounded-md border border-gray-300">
                  <iframe
                    src={office.mapEmbedUrl}
                    title={`Map — ${office.name}`}
                    className="h-[180px] w-full"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Contact form — moved here from the old standalone /contact route */}
      <div className="mt-16 border-t border-gray-300 pt-16">
        <div className="mx-auto max-w-[480px] text-center">
          <h2 className="font-serif text-h2 text-navy-700">Send Us a Message</h2>
          <p className="mt-3 text-body text-gray-700">{contactIntro}</p>
        </div>
        <div className="mx-auto mt-8 max-w-[480px] text-left">
          <ContactForm practiceAreas={practiceAreas} />
        </div>
      </div>
    </div>
  );
}
