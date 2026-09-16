"use server";

import { revalidatePath } from "next/cache";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit";
import type { ActionResult } from "@/lib/action-result";
import { updateSiteSettingsSchema, type UpdateSiteSettingsInput } from "@/lib/validations/settings";

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
  // Phase 5 (ISR): site_settings values are read across Home, About,
  // Contact, and the shared (marketing)/layout.tsx (Footer, disclaimer
  // gate) — the same "no single public detail page owns this data"
  // situation as offices.ts, so the same sitewide fix applies. Not scoped
  // to just the keys that changed, since that would mean hand-maintaining
  // a key→path map that drifts the moment a new setting is added to
  // SITE_SETTINGS_FIELDS; sitewide is the safe default for something this
  // infrequently saved (superAdmin-only, low-churn).
  revalidatePath("/", "layout");
  return { success: true };
}
