"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { SITE_SETTINGS } from "@/config/content";

const STORAGE_KEY = "utkarsh-disclaimer-acknowledged";

/**
 * Global one-time consent modal — Indian law firm sites conventionally gate
 * the homepage behind this (Bar Council of India advertising-restriction
 * language). "Shown once per session" is implemented with sessionStorage
 * (clears when the browser tab/session ends, unlike localStorage which
 * would persist indefinitely) — matches "per session" more literally than a
 * permanent dismissal would.
 *
 * Phase 6 §1: reads SITE_SETTINGS.disclaimerText directly from
 * src/config/content.ts now, instead of receiving a `text` prop resolved
 * from `site_settings` by the (marketing) layout. Editing the text post-
 * launch means editing content.json and redeploying — there's no
 * /admin/settings screen anymore.
 *
 * Rendered from a fresh `useState(false)` and only flipped to visible
 * inside `useEffect` (never during the initial render) specifically so the
 * server-rendered markup and the first client render agree — sessionStorage
 * doesn't exist on the server, so checking it during render would be a
 * hydration mismatch (see PHASE-3-NOTES's "Lessons learned" #4 on
 * hydration pitfalls; same underlying principle, different API).
 *
 * Presentation: bottom-anchored full-width bar, not a centered modal card
 * with a dark backdrop — per explicit reference (a competitor's site using
 * this exact pattern). Only the visible position/style changed from the
 * previous version; the actual gating is unchanged and just as strict as
 * before: a full-viewport, invisible click/scroll-blocking layer sits
 * behind the visible bar (transparent, matching the reference's lack of any
 * dark dimming), and body scroll is explicitly locked while this is
 * visible. Both are necessary — a bar that only occupies the bottom slice
 * of the screen would otherwise leave the rest of the page fully visible,
 * scrollable, and clickable behind it, which isn't a disclaimer gate at
 * all, just a banner someone can ignore. `role="dialog"`/`aria-modal` are
 * unchanged from before.
 */
export function DisclaimerGate() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const acknowledged = sessionStorage.getItem(STORAGE_KEY);
    if (!acknowledged) setVisible(true);
  }, []);

  // Real scroll lock, not just click-blocking — a fixed full-viewport layer
  // stops mouse-wheel/touch scroll (those events target whatever's under
  // the pointer, which is the blocking layer), but keyboard scrolling
  // (Page Down, Space, arrow keys) isn't pointer-based and could still
  // reach the page underneath without this.
  useEffect(() => {
    if (!visible) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [visible]);

  function acknowledge() {
    sessionStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <>
      {/* Full-viewport click/scroll blocker — transparent, so it matches the
          reference's lack of any dark dimming, but still intercepts every
          click and scroll gesture aimed at the page behind it. This is what
          actually makes it a gate; the bar below is just where the visible
          content lives. */}
      <div className="fixed inset-0 z-40" aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="disclaimer-heading"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-300 bg-white shadow-lg"
      >
        <h2 id="disclaimer-heading" className="sr-only">
          Disclaimer
        </h2>
        <div className="mx-auto flex max-w-wide flex-col items-center gap-4 px-4 py-6 text-center tablet:px-8 desktop:px-16">
          <p className="max-h-[30vh] max-w-[820px] overflow-y-auto text-small leading-relaxed text-gray-700">
            {SITE_SETTINGS.disclaimerText}
          </p>
          <Button variant="primary" onClick={acknowledge}>
            I Acknowledge &amp; Agree
          </Button>
        </div>
      </div>
    </>
  );
}
