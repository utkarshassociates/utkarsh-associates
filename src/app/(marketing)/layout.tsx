import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { DisclaimerGate } from "@/components/marketing/DisclaimerGate";

// Phase 6 §1: settings and offices used to be fetched here once (via
// getSiteSettings()/getOffices()) and passed down to Footer/DisclaimerGate
// as props, since both were DB round trips worth deduping per request. Now
// that both live in src/config/content.ts (a bundled, synchronous read),
// there's nothing to fetch or dedupe — this layout no longer needs to be
// async at all, and Footer/DisclaimerGate import their own data directly.
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
      <DisclaimerGate />
    </>
  );
}
