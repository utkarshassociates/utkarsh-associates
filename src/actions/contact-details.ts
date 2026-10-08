"use server";

import { revalidatePath } from "next/cache";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { requireSuperAdmin } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit";
import type { ActionResult } from "@/lib/action-result";
import { contactDetailsSchema, type ContactDetailsInput } from "@/lib/validations/contact-details";

/** superAdmin only — edits the single `site_contact` row (common office phone/email + show/hide). */
export async function updateContactDetailsAction(input: ContactDetailsInput): Promise<ActionResult> {
  const actor = await requireSuperAdmin();

  const parsed = contactDetailsSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const { phone, email, showPhone, showEmail } = parsed.data;

  const supabase = createServiceRoleClient();
  const { error } = await supabase.from("site_contact").upsert({
    id: 1,
    phone,
    email,
    show_phone: showPhone,
    show_email: showEmail,
    updated_at: new Date().toISOString(),
    updated_by: actor.adminId,
  });
  if (error) {
    return { success: false, error: "Could not save. " + error.message };
  }

  // audit_log.entity_id is a uuid column and this row's id is 1, so no entityId.
  await logAudit({ adminId: actor.adminId, action: "update", entity: "site_contact", meta: { showPhone, showEmail } });

  // Phone/email render in the shared Footer (every public page), Offices and the Home JSON-LD.
  revalidatePath("/admin/contact-details");
  revalidatePath("/", "layout");
  return { success: true };
}
