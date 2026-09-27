import type { Metadata } from "next";
import Image from "next/image";
import { ASSETS } from "@/config/assets";
import { SITE_SETTINGS } from "@/config/content";

export const revalidate = 3600;

export function generateMetadata(): Metadata {
  const intro = SITE_SETTINGS.aboutIntroParagraph;
  return {
    title: "About Us",
    description: intro,
    alternates: { canonical: "/about" },
    openGraph: {
      title: "About Us",
      description: intro,
      url: "/about",
      type: "website",
    },
  };
}

// Code-defined layout, editable copy from content.ts (Phase 6 §1 — was site_settings).
export default function AboutPage() {
  const introParagraph = SITE_SETTINGS.aboutIntroParagraph;

  return (
    <div className="mx-auto max-w-wide px-4 py-16 tablet:px-8 desktop:px-16">
      <div className="grid gap-12 desktop:grid-cols-2 desktop:items-center">
        <div>
          <h1 className="font-serif text-h1 text-navy-700">About Us</h1>
          <p className="mt-6 text-body-l text-justify text-gray-700">{introParagraph}</p>
        </div>
        <div className="hidden desktop:block">
          <Image
            src={ASSETS.aboutIllustration}
            alt=""
            width={600}
            height={420}
          />
        </div>
      </div>

      <div className="mt-16 grid gap-8 tablet:grid-cols-2">
        <div>
          <h3 className="mb-2 font-serif text-h2 text-navy-700">
            Our Expertise
          </h3>
          <p className="text-body-l text-justify text-gray-700">
            The Firm focuses its practice on civil and commercial litigation and
            arbitration, and also advises and represents clients in matters
            relating to insolvency and bankruptcy, company and corporate
            disputes, banking and debt recovery, real estate and RERA, labour
            and employment, regulatory proceedings, white-collar and economic
            offences, and constitutional and administrative law. Our lawyers
            regularly appear before the Supreme Court of India, High Courts,
            District Courts, arbitral tribunals, NCLT, NCLAT, DRTs, RERA
            authorities and other judicial and quasi-judicial forums as well as
            arbitral tribunals.
          </p>
        </div>
        <div>
          <h3 className="mb-2 font-serif text-h2 text-navy-700">
            Our Approach
          </h3>
          <p className="text-body-l text-justify text-gray-700">
            At Utkarsh Associates, we believe that legal advice must be both
            sound and practical. Our focus is on identifying the most effective
            route towards resolving a client’s legal problem—whether through
            litigation, arbitration, negotiation, settlement or other available
            remedies. We assist clients in pursuing and recovering claims,
            defending against adverse claims, challenging actions of government
            and public authorities, and navigating criminal, commercial and
            regulatory disputes. We place particular emphasis on clear advice,
            responsive communication and focused case strategy, while ensuring
            that every matter receives the attention and preparation it
            requires. Our aim is to provide dependable legal support and
            effective representation at every stage of a dispute.
          </p>
        </div>
      </div>
    </div>
  );
}
