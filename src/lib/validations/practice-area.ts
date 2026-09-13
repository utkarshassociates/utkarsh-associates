import { z } from "zod";
import { slugSchema, contentStatusSchema, richTextSchema, optionalTextSchema } from "./shared";

// icon_key is validated as "any non-empty string" here rather than an enum
// of the current ASSETS.practiceIcons keys (src/config/assets.ts). Reason:
// that map is a placeholder-swap registry (project-plan.md §3) expected to
// grow as more icons are commissioned, and hard-coding its keys into the zod
// schema would mean every new icon needs a matching validation-schema edit.
// The practice-area form's <select> already only offers the real keys, so in
// practice this never receives anything else.
export const practiceAreaSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  slug: slugSchema,
  shortDescription: optionalTextSchema,
  content: richTextSchema,
  iconKey: z.string().min(1, "Choose an icon"),
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
