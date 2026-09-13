import { z } from "zod";
import { slugSchema, richTextSchema, optionalTextSchema, optionalUrlOrPathSchema } from "./shared";

export const insightPostTypeSchema = z.enum(["original", "external_link"]);

// §5.1's draft → pending_review → published(/rejected) workflow is enforced
// by *which action gets called* (saveInsightAction only ever writes
// draft/pending_review; publishInsightAction/rejectInsightAction — gated by
// insights.publish — are the only path to published/rejected), not by
// letting the client freely POST any status value. This schema covers the
// two the *content owner* can set themselves.
export const insightOwnerStatusSchema = z.enum(["draft", "pending_review"]);

const baseInsightFields = z.object({
  title: z.string().trim().min(1, "Title is required").max(300),
  slug: slugSchema,
  excerpt: optionalTextSchema,
  coverImageUrl: optionalUrlOrPathSchema,
  categoryId: z.string().uuid().nullable().optional(),
  authorId: z.string().uuid().nullable().optional(),
  postType: insightPostTypeSchema,
  tags: z.array(z.string().trim().min(1).max(50)).max(20).default([]),
  seoTitle: optionalTextSchema,
  seoDescription: optionalTextSchema,
  status: insightOwnerStatusSchema,
  // Original-post-only:
  content: richTextSchema,
  // External-link-only (§5.5):
  externalUrl: z.string().trim().url("Enter a full URL, e.g. https://...").optional().or(z.literal("")),
  sourceName: optionalTextSchema,
});

// §5.5: "external_url + source_name, used only when post_type = external_link."
// Enforced here rather than left to the UI alone, so a direct/malformed
// action call can't save an external_link post with no link, or an original
// post silently missing content.
export const insightSchema = baseInsightFields.superRefine((data, ctx) => {
  if (data.postType === "external_link") {
    if (!data.externalUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["externalUrl"],
        message: "External URL is required for an external-link post.",
      });
    }
    if (!data.sourceName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sourceName"],
        message: "Source name is required for an external-link post.",
      });
    }
  }
});

export const createInsightSchema = insightSchema;

// Client-form-only variant: the InsightForm component doesn't have a literal
// "status" field (status is decided by which submit button is clicked) or
// "tags" field (it collects a comma-separated "tagsInput" string and splits
// it before calling the server action) — so the resolver needs base fields
// minus those two, with the same postType-conditional refinement re-applied.
// NOTE: built from `baseInsightFields.omit(...)`, not from
// `insightSchema`/`createInsightSchema` — those are already wrapped in
// `.superRefine()`, and zod's ZodEffects wrapper doesn't expose `.omit()`.
export const insightFormSchema = baseInsightFields.omit({ status: true, tags: true }).superRefine((data, ctx) => {
  if (data.postType === "external_link") {
    if (!data.externalUrl) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["externalUrl"], message: "External URL is required for an external-link post." });
    }
    if (!data.sourceName) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["sourceName"], message: "Source name is required for an external-link post." });
    }
  }
});

export const updateInsightSchema = baseInsightFields
  .extend({ id: z.string().uuid() })
  .superRefine((data, ctx) => {
    if (data.postType === "external_link") {
      if (!data.externalUrl) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["externalUrl"],
          message: "External URL is required for an external-link post.",
        });
      }
      if (!data.sourceName) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["sourceName"],
          message: "Source name is required for an external-link post.",
        });
      }
    }
  });

export const rejectInsightSchema = z.object({
  id: z.string().uuid(),
  rejectionNote: z.string().trim().max(1000).optional(),
});

export const insightIdSchema = z.object({ id: z.string().uuid() });

export const createCategorySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  slug: slugSchema,
});

export type CreateInsightInput = z.infer<typeof createInsightSchema>;
export type UpdateInsightInput = z.infer<typeof updateInsightSchema>;
export type RejectInsightInput = z.infer<typeof rejectInsightSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
