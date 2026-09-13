import { z } from "zod";

// Same shape as the slug rule already used in role.ts — pulled out here so
// practice-area/team/insight validations (all of which have a slug field,
// unlike roles) share one definition instead of four near-copies.
export const slugSchema = z
  .string()
  .trim()
  .min(2, "Slug must be at least 2 characters")
  .max(200)
  .regex(
    /^[a-z][a-z0-9-]*$/,
    "Slug must be lowercase letters, numbers, or hyphens, starting with a letter"
  );

export const contentStatusSchema = z.enum(["draft", "published"]);

// Tiptap's editor.getJSON() output — we don't validate its internal shape
// (that's Tiptap's job), just that something was produced. `null`/empty is
// allowed: a brand-new draft, or an external_link insight (§5.5) which has
// no inline content at all.
export const richTextSchema = z.unknown().nullable().optional();

// Loosely validated — could be a full URL or a relative path like
// "/media/xyz.webp" returned by the upload action. Empty string means "no
// image yet", normalized to null before hitting the DB.
//
// `.nullish()` (accepts string | null | undefined), not just `.optional()`,
// is load-bearing here: every create/update schema built from this gets
// used TWICE on the same value — once client-side as the zodResolver (whose
// *parsed output* becomes `values` in the form's submit handler, so a blank
// field is already transformed "" → null by the time it leaves the form),
// and once server-side in the action, re-parsing that already-nulled data.
// With only `.optional()` (string | undefined), that second parse rejected
// `null` with "Expected string, received null" for any field left blank —
// caught via a real Insight submission after the round-2 fixes shipped.
// `.nullish()` makes null a valid input alongside undefined, so re-parsing
// already-transformed data is idempotent instead of one-way.
export const optionalUrlOrPathSchema = z
  .string()
  .trim()
  .nullish()
  .transform((v) => (v ? v : null));

export const optionalTextSchema = z
  .string()
  .trim()
  .max(500)
  .nullish()
  .transform((v) => (v ? v : null));

// Was duplicated identically in team.ts and office.ts (both hit the same
// double-parse bug described above) — consolidated here so there's one
// definition to keep correct instead of two that can drift.
export const optionalEmailSchema = z
  .string()
  .trim()
  .email("Enter a valid email address")
  .nullish()
  .or(z.literal(""))
  .transform((v) => (v ? v : null));
