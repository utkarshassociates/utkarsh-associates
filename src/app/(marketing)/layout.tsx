import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { DisclaimerGate } from "@/components/marketing/DisclaimerGate";
import { SITE_DEFAULTS } from "@/config/site";
import { getOffices, getSiteSettings, readSetting } from "@/lib/data/public";

// Public nav/footer/disclaimer gate wrapper (project-plan.md §4). Settings
// and offices are fetched once here rather than separately in every page —
// both are small, firm-wide, and needed by the footer/disclaimer on every
// route, so a single shared fetch per request is simpler than each page
// re-fetching the same rows.
export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const [settings, offices] = await Promise.all([getSiteSettings(), getOffices()]);
  const disclaimerText = readSetting(settings, "disclaimer_text", SITE_DEFAULTS.disclaimer_text);

  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer settings={settings} offices={offices} />
      <DisclaimerGate text={disclaimerText} />
    </>
  );
}
