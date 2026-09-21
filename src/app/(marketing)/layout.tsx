import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { DisclaimerGate } from "@/components/marketing/DisclaimerGate";

// Phase 6 §1: settings and offices used to be fetched here once (via
// getSiteSettings()/getOffices()) and passed down to Footer/DisclaimerGate
// as props, since both were DB round trips worth deduping per request. Now
// that both live in src/config/content.ts (a bundled, synchronous read),
// there's nothing to fetch or dedupe — this layout no longer needs to be
// async at all, and Footer/DisclaimerGate import their own data directly.
//
// `flex min-h-screen flex-col` + `main`'s `flex-1`: sticky-footer pattern.
// Without it, a short-content page (e.g. a practice area with just a short
// description and no body copy) renders shorter than the viewport, and the
// footer ends up sitting wherever the content happens to end — partway up
// the screen, with dead white space below it, rather than at the bottom of
// the viewport where a footer reads as intentional. `main` grows to fill
// whatever space the content doesn't use, pushing the footer down to at
// minimum the bottom of the viewport; on a page taller than the viewport,
// this has no effect and the page scrolls normally. Same pattern already
// used in the admin layout (`src/app/admin/(protected)/layout.tsx`), just
// without that layout's sidebar-specific `h-screen`/`flex-row` additions —
// the public site doesn't have a fixed-height side panel to account for.
// `Navbar` renders two top-level siblings (a non-sticky utility bar, then
// the sticky nav itself) rather than one wrapping element; both become
// ordinary (non-growing) flex items here, which is what we want — only
// `main` should grow. `DisclaimerGate` is `position: fixed` when visible
// and renders `null` otherwise, so it takes no layout space either way.
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <DisclaimerGate />
    </div>
  );
}
