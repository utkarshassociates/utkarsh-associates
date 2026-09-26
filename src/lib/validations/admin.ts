import { z } from "zod";
import { PERMISSIONS } from "@/config/permissions";

// login_id is deliberately NOT validated as an email — the plan calls for
// "any string, doesn't need to resemble a real email, though an email-like
// format ... is a fine convention for readability." We just require it be a
// reasonable identifier: no whitespace, printable.
const loginIdSchema = z
  .string()
  .trim()
  .min(3, "Login ID must be at least 3 characters")
  .max(100)
  .regex(/^\S+$/, "Login ID cannot contain spaces");

const passwordSchema = z.string().min(8, "Password must be at least 8 characters");

export const createAdminSchema = z.object({
  loginId: loginIdSchema,
  name: z.string().trim().min(1, "Name is required").max(200),
  roleId: z.string().uuid("Select a role"),
  password: passwordSchema,
  extraPermissions: z.array(z.enum(PERMISSIONS)).default([]),
});

export const updateAdminSchema = z.object({
  adminId: z.string().uuid(),
  name: z.string().trim().min(1, "Name is required").max(200),
  roleId: z.string().uuid("Select a role"),
  extraPermissions: z.array(z.enum(PERMISSIONS)).default([]),
  status: z.enum(["active", "disabled"]),
});

export const resetPasswordSchema = z.object({
  adminId: z.string().uuid(),
  newPassword: passwordSchema,
});

export const toggleAdminStatusSchema = z.object({
  adminId: z.string().uuid(),
  status: z.enum(["active", "disabled"]),
});

export type CreateAdminInput = z.infer<typeof createAdminSchema>;
export type UpdateAdminInput = z.infer<typeof updateAdminSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ToggleAdminStatusInput = z.infer<typeof toggleAdminStatusSchema>;
