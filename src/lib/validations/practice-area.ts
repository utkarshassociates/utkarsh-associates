import { z } from "zod";
import { slugSchema, contentStatusSchema, richTextSchema, optionalTextSchema, optionalUrlOrPathSchema } from "./shared";

// Phase 6 §7: iconUrl replaces the old iconKey (a required pick from a fixed
// set). It's optional now — a practice area with no uploaded icon renders
// ASSETS.practiceAreaIconFallback (src/lib/utils.ts's getPracticeAreaIconSrc)
// rather than blocking creation or showing a broken image.
export const practiceAreaSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  slug: slugSchema,
  shortDescription: optionalTextSchema,
  content: richTextSchema,
  iconUrl: optionalUrlOrPathSchema,
  status: contentStatusSchema,
  seoTitle: optionalTextSchema,
  seoDescription: optionalTextSchema,
});

export const createPracticeAreaSchema = practiceAreaSchema;

export const updatePracticeAreaSchema = practiceAreaSchema.extend({
  id: z.string().uuid(),
});

export type CreatePracticeAreaInput = z.infer<typeof createPracticeAreaSchema>;
export type UpdatePracticeAreaInput = z.infer<typeof updatePracticeAreaSchema>;
