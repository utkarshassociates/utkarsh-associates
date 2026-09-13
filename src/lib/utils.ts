import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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
