import { ContactForm } from "@/components/marketing/ContactForm";
import { SITE_DEFAULTS } from "@/config/site";
import { getPublishedPracticeAreas, getSiteSettings, readSetting } from "@/lib/data/public";

export default async function ContactPage() {
  const [settings, practiceAreas] = await Promise.all([getSiteSettings(), getPublishedPracticeAreas()]);
  const intro = readSetting(settings, "contact_intro", SITE_DEFAULTS.contact_intro);
  const phone = readSetting(settings, "firm_phone", SITE_DEFAULTS.firm_phone);
  const email = readSetting(settings, "firm_email", SITE_DEFAULTS.firm_email);

  return (
    <div className="mx-auto max-w-wide px-4 py-16 tablet:px-8 desktop:px-16">
      <div className="grid gap-12 desktop:grid-cols-2">
        <div>
          <h1 className="font-serif text-h1 text-navy-700">Contact Us</h1>
          <p className="mt-4 max-w-[480px] text-body-l text-gray-700">{intro}</p>

          {(phone || email) && (
            <div className="mt-8 flex flex-col gap-2">
              {phone && (
                <a href={`tel:${phone.replace(/\s+/g, "")}`} className="text-body font-semibold text-navy-700 hover:text-gold-700">
                  {phone}
                </a>
              )}
              {email && (
                <a href={`mailto:${email}`} className="text-body font-semibold text-navy-700 hover:text-gold-700">
                  {email}
                </a>
              )}
            </div>
          )}
        </div>

        <ContactForm practiceAreas={practiceAreas} />
      </div>
    </div>
  );
}
