import { z } from "zod";

export const inquiryStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["new", "read", "archived"]),
});

export type InquiryStatusInput = z.infer<typeof inquiryStatusSchema>;
