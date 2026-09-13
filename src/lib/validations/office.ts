import { z } from "zod";
import { optionalTextSchema } from "./shared";

const optionalEmailSchema = z
  .string()
  .trim()
  .email("Enter a valid email address")
  .optional()
  .or(z.literal(""))
  .transform((v) => (v ? v : null));

// Offices have no `status` field in the §6 schema (unlike Practice
// Areas/Team/Insights) — per plan §4 they're a "lightweight" CMS entity, not
// part of the draft/published workflow. Every saved office is live.
export const officeSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  address: optionalTextSchema,
  city: optionalTextSchema,
  phone: optionalTextSchema,
  email: optionalEmailSchema,
  mapEmbedUrl: optionalTextSchema,
  isHeadquarters: z.boolean().default(false),
});

export const createOfficeSchema = officeSchema;

export const updateOfficeSchema = officeSchema.extend({
  id: z.string().uuid(),
});

export type CreateOfficeInput = z.infer<typeof createOfficeSchema>;
export type UpdateOfficeInput = z.infer<typeof updateOfficeSchema>;
