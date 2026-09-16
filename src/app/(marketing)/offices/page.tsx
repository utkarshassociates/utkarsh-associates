import type { Metadata } from "next";
import { Tag } from "@/components/ui";
import { JsonLd } from "@/components/shared/JsonLd";
import { getOffices } from "@/lib/data/public";
import { localBusinessJsonLd } from "@/lib/seo";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Offices",
  description: "Reach us at any of our office locations.",
  alternates: { canonical: "/offices" },
  openGraph: { title: "Offices", url: "/offices", type: "website" },
};

export default async function OfficesPage() {
  const offices = await getOffices();

  return (
    <div className="mx-auto max-w-wide px-4 py-16 tablet:px-8 desktop:px-16">
      {offices.map((office) => (
        <JsonLd key={office.id} data={localBusinessJsonLd(office)} />
      ))}
      <h1 className="font-serif text-h1 text-navy-700">Offices</h1>
      <p className="mt-4 max-w-[560px] text-body-l text-gray-700">Reach us at any of our office locations.</p>

      {offices.length === 0 ? (
        <p className="mt-12 text-body text-gray-700">Office details are being updated — please check back soon.</p>
      ) : (
        <div className="mt-12 grid gap-6 tablet:grid-cols-2 desktop:grid-cols-3">
          {offices.map((office) => (
            <div key={office.id} className="rounded-lg border border-gray-300 bg-white p-6">
              <div className="mb-3 flex items-start justify-between gap-2">
                <h3 className="font-serif text-h4 text-navy-700">{office.name}</h3>
                {office.is_headquarters && <Tag variant="gold">Headquarters</Tag>}
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
              {office.map_embed_url && (
                <div className="mt-4 overflow-hidden rounded-md border border-gray-300">
                  <iframe
                    src={office.map_embed_url}
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
    </div>
  );
}
