"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";

const STORAGE_KEY = "utkarsh-disclaimer-acknowledged";

/**
 * Global one-time consent modal — Indian law firm sites conventionally gate
 * the homepage behind this (Bar Council of India advertising-restriction
 * language). "Shown once per session" is implemented with sessionStorage
 * (clears when the browser tab/session ends, unlike localStorage which
 * would persist indefinitely) — matches "per session" more literally than a
 * permanent dismissal would.
 *
 * `text` is passed in from the (marketing) layout, already resolved from
 * site_settings with a placeholder as fallback (see src/config/site.ts's
 * SITE_DEFAULTS.disclaimer_text) — this component itself has no knowledge
 * of where the text came from, so a superAdmin editing it from
 * /admin/settings takes effect on next load with zero changes here.
 *
 * Rendered from a fresh `useState(false)` and only flipped to visible
 * inside `useEffect` (never during the initial render) specifically so the
 * server-rendered markup and the first client render agree — sessionStorage
 * doesn't exist on the server, so checking it during render would be a
 * hydration mismatch (see PHASE-3-NOTES's "Lessons learned" #4 on
 * hydration pitfalls; same underlying principle, different API).
 */
export function DisclaimerGate({ text }: { text: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const acknowledged = sessionStorage.getItem(STORAGE_KEY);
    if (!acknowledged) setVisible(true);
  }, []);

  function acknowledge() {
    sessionStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="disclaimer-heading"
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/80 p-4"
    >
      <div className="max-w-[560px] rounded-lg bg-white p-8 shadow-lg">
        <h2 id="disclaimer-heading" className="mb-4 font-serif text-h4 text-navy-700">
          Disclaimer
        </h2>
        <p className="mb-6 max-h-[40vh] overflow-y-auto text-small leading-relaxed text-gray-700">{text}</p>
        <Button variant="primary" onClick={acknowledge} className="w-full justify-center">
          I Acknowledge &amp; Agree
        </Button>
      </div>
    </div>
  );
}
