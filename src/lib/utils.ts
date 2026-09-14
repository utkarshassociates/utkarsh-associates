import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Fixed DD/MM/YYYY formatting with no `Intl`/locale dependency. Used
 * instead of `Date.prototype.toLocaleDateString()` anywhere a date renders
 * inside a Server-Component-rendered tree (which includes every "use
 * client" component too, since Next.js still does an initial SSR pass for
 * hydration) — `toLocaleDateString()` with no explicit locale resolves to
 * the *runtime's* default locale, which is the server's Node locale during
 * SSR and the browser's locale during hydration. Those can genuinely
 * differ (caught via a real hydration mismatch: server rendered
 * "14/09/2026", client rendered "14/9/2026" — zero-padding disagreement
 * from two different default locales). Passing an explicit locale to
 * `toLocaleDateString()` would also fix it, but formatting by hand removes
 * the `Intl` dependency (and its own environment-specific ICU data)
 * entirely, so there's nothing left that could disagree between server and
 * client.
 */
export function formatDateDDMMYYYY(isoOrDate: string | Date): string {
  const d = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
}

/**
 * Turns a display string into a URL-safe slug — used as the live-preview
 * suggestion under the Title field on Practice Area / Team / Insight forms.
 * The actual saved slug is still whatever the admin typed/edited (see the
 * shared `slugSchema` in src/lib/validations/shared.ts), this is just a
 * convenience default so most admins never have to hand-type one.
 */
export function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
