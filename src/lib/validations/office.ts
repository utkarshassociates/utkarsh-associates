import { z } from "zod";
import { optionalTextSchema, optionalUrlOrPathSchema, optionalEmailSchema } from "./shared";

// Offices have no `status` field in the schema (unlike Practice
// Areas/Team/Insights) — per the plan, they're a "lightweight" CMS entity, not
// part of the draft/published workflow. Every saved office is live.
export const officeSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  address: optionalTextSchema,
  city: optionalTextSchema,
  phone: optionalTextSchema,
  email: optionalEmailSchema,
  // Consistency fix: was optionalTextSchema (no URL shape check at all) —
  // every other URL-shaped field (coverImageUrl, photoUrl, linkedinUrl)
  // uses optionalUrlOrPathSchema; this one had just been missed.
  mapEmbedUrl: optionalUrlOrPathSchema,
  isHeadquarters: z.boolean().default(false),
});

export const createOfficeSchema = officeSchema;

export const updateOfficeSchema = officeSchema.extend({
  id: z.string().uuid(),
});

export type CreateOfficeInput = z.infer<typeof createOfficeSchema>;
export type UpdateOfficeInput = z.infer<typeof updateOfficeSchema>;
