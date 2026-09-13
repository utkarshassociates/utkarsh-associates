"use server";

import { requireAdmin } from "@/lib/auth/session";
import { processAndUploadImage, deleteImageByPath, pathFromPublicUrl } from "@/lib/media/upload";
import type { Permission } from "@/config/permissions";

export interface UploadImageActionResult {
  success: boolean;
  url?: string;
  error?: string;
}

// Maps the calling form's entity to the permission that should gate an
// upload. This is a second check, not the only one — every page that renders
// an upload field already sits behind its own requirePermission() (e.g.
// /admin/team/new requires team.manage) — but the upload action itself is a
// shared endpoint reachable from any signed-in session's client bundle, so it
// re-checks here rather than trusting "the page that rendered this button
// was already gated."
const CONTEXT_PERMISSIONS: Record<string, Permission> = {
  team: "team.manage",
  "practice-areas": "practice_areas.manage",
  "insights/cover": "insights.create",
  "insights/content": "insights.create",
};

export async function uploadImageAction(formData: FormData): Promise<UploadImageActionResult> {
  const admin = await requireAdmin();

  const context = String(formData.get("context") ?? "");
  const requiredPermission = CONTEXT_PERMISSIONS[context];
  if (!requiredPermission) {
    return { success: false, error: "Unknown upload context." };
  }
  if (!admin.isSuper && !admin.permissions.has(requiredPermission)) {
    return { success: false, error: "You don't have permission to upload here." };
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { success: false, error: "No file provided." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await processAndUploadImage({ buffer, mimeType: file.type, context });

  if (!result.success) {
    return { success: false, error: result.error };
  }

  // If the form is replacing an existing image, clean up the old file. Never
  // fails the upload itself — the new image is already saved.
  const previousUrl = formData.get("previousUrl");
  if (typeof previousUrl === "string" && previousUrl) {
    const previousPath = pathFromPublicUrl(previousUrl);
    if (previousPath) void deleteImageByPath(previousPath);
  }

  return { success: true, url: result.url };
}
