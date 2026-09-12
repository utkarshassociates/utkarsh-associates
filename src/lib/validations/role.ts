import { z } from "zod";
import { PERMISSIONS } from "@/config/permissions";

const slugSchema = z
  .string()
  .trim()
  .min(2)
  .max(50)
  .regex(
    /^[a-z][a-z0-9_-]*$/,
    "Slug must be lowercase letters, numbers, hyphens, or underscores, starting with a letter"
  );

export const createRoleSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  slug: slugSchema,
  permissionKeys: z.array(z.enum(PERMISSIONS)).default([]),
});

export const updateRolePermissionsSchema = z.object({
  roleId: z.string().uuid(),
  name: z.string().trim().min(1, "Name is required").max(100),
  permissionKeys: z.array(z.enum(PERMISSIONS)).default([]),
});

export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRolePermissionsInput = z.infer<typeof updateRolePermissionsSchema>;
