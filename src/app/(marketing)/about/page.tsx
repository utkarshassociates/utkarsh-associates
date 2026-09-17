import type { Metadata } from "next";
import Image from "next/image";
import { ASSETS } from "@/config/assets";
import { SITE_DEFAULTS } from "@/config/site";
import { getSiteSettings, readSetting } from "@/lib/data/public";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const intro = readSetting(settings, "about_intro_paragraph", SITE_DEFAULTS.about_intro_paragraph);
  return {
    title: "About Us",
    description: intro,
    alternates: { canonical: "/about" },
    openGraph: { title: "About Us", description: intro, url: "/about", type: "website" },
  };
}

// Code-defined layout, editable copy from site_settings.
export default async function AboutPage() {
  const settings = await getSiteSettings();
  const introParagraph = readSetting(settings, "about_intro_paragraph", SITE_DEFAULTS.about_intro_paragraph);

  return (
    <div className="mx-auto max-w-wide px-4 py-16 tablet:px-8 desktop:px-16">
      <div className="grid gap-12 desktop:grid-cols-2 desktop:items-center">
        <div>
          <h1 className="font-serif text-h1 text-navy-700">About Us</h1>
          <p className="mt-6 text-body-l text-gray-700">{introParagraph}</p>
        </div>
        <div className="hidden desktop:block">
          <Image src={ASSETS.aboutIllustration} alt="" width={600} height={420} />
        </div>
      </div>

      <div className="mt-16 grid gap-8 tablet:grid-cols-3">
        <div>
          <h3 className="mb-2 font-serif text-h4 text-navy-700">Our Story</h3>
          <p className="text-small text-gray-700">
            Founded on the principle that clients deserve counsel that is rigorous, responsive, and honest about
            trade-offs — not just technically correct.
          </p>
        </div>
        <div>
          <h3 className="mb-2 font-serif text-h4 text-navy-700">Our Approach</h3>
          <p className="text-small text-gray-700">
            We take the time to understand the business behind the matter, so advice is shaped around outcomes that
            actually matter to you.
          </p>
        </div>
        <div>
          <h3 className="mb-2 font-serif text-h4 text-navy-700">Our Values</h3>
          <p className="text-small text-gray-700">
            Integrity, clarity, and accountability — in how we communicate as much as in how we advise.
          </p>
        </div>
      </div>
    </div>
  );
}
