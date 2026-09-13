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
export const optionalUrlOrPathSchema = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : null));

export const optionalTextSchema = z
  .string()
  .trim()
  .max(500)
  .optional()
  .transform((v) => (v ? v : null));
