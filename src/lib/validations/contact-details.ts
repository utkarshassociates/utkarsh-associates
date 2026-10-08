import { z } from "zod";

export const contactDetailsSchema = z.object({
  phone: z.string().trim().max(30, "Phone number is too long."),
  email: z
    .string()
    .trim()
    .max(200)
    .refine((v) => v === "" || z.string().email().safeParse(v).success, "Enter a valid email address."),
  showPhone: z.boolean(),
  showEmail: z.boolean(),
});

export type ContactDetailsInput = z.infer<typeof contactDetailsSchema>;
