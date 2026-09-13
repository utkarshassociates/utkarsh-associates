import { z } from "zod";
import {
  slugSchema,
  contentStatusSchema,
  richTextSchema,
  optionalTextSchema,
  optionalUrlOrPathSchema,
} from "./shared";

const optionalEmailSchema = z
  .string()
  .trim()
  .email("Enter a valid email address")
  .optional()
  .or(z.literal(""))
  .transform((v) => (v ? v : null));

export const teamMemberSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  slug: slugSchema,
  designation: optionalTextSchema,
  photoUrl: optionalUrlOrPathSchema,
  bio: richTextSchema,
  email: optionalEmailSchema,
  phone: optionalTextSchema,
  linkedinUrl: optionalUrlOrPathSchema,
  status: contentStatusSchema,
  seoTitle: optionalTextSchema,
  seoDescription: optionalTextSchema,
  // team_practice_areas join rows — the form sends the full desired set on
  // every save, and the action replaces (delete+insert) rather than diffing,
  // same trade-off as extraPermissions on the Admin form.
  practiceAreaIds: z.array(z.string().uuid()).default([]),
});

export const createTeamMemberSchema = teamMemberSchema;

export const updateTeamMemberSchema = teamMemberSchema.extend({
  id: z.string().uuid(),
});

export type CreateTeamMemberInput = z.infer<typeof createTeamMemberSchema>;
export type UpdateTeamMemberInput = z.infer<typeof updateTeamMemberSchema>;
