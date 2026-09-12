"use server";

import { revalidatePath } from "next/cache";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit";
import { updateSiteSettingsSchema, type UpdateSiteSettingsInput } from "@/lib/validations/settings";

export interface ActionResult {
  success: boolean;
  error?: string;
}

/**
 * Upserts every key in `values` into `site_settings`. Per project-plan.md
 * §4.1: "the database value always wins at runtime" — this is the only
 * write path for these rows; `src/config/site.ts` (if/when added) is a
 * compile-time-safety mirror only, never itself read at runtime.
 */
export async function updateSiteSettingsAction(input: UpdateSiteSettingsInput): Promise<ActionResult> {
  const actor = await requirePermission("settings.manage");

  const parsed = updateSiteSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid input." };
  }

  const supabase = createServiceRoleClient();
  const rows = Object.entries(parsed.data.values).map(([key, value]) => ({
    key,
    value,
    updated_at: new Date().toISOString(),
    updated_by: actor.adminId,
  }));

  const { error } = await supabase.from("site_settings").upsert(rows, { onConflict: "key" });
  if (error) {
    return { success: false, error: "Could not save settings. " + error.message };
  }

  await logAudit({
    adminId: actor.adminId,
    action: "update",
    entity: "site_settings",
    meta: { keys: Object.keys(parsed.data.values) },
  });

  revalidatePath("/admin/settings");
  return { success: true };
}
