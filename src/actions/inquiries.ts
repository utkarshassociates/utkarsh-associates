"use server";

import { revalidatePath } from "next/cache";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit";
import { inquiryStatusSchema, type InquiryStatusInput } from "@/lib/validations/inquiry";

export interface ActionResult {
  success: boolean;
  error?: string;
}

/**
 * §5.2: "/admin/inquiries | inquiries.view / manage | Contact form
 * submissions, mark read/archived, export." Gated by `inquiries.manage`
 * (not `.view`) — viewing the list only needs `.view` (checked at the page
 * level, same as every other list page), but changing status is a write
 * and needs the stronger permission, matching the same view/manage split
 * every other entity uses (e.g. `insights.publish` for a write vs
 * `insights.create`/`edit_*` just to see the list).
 */
export async function updateInquiryStatusAction(input: InquiryStatusInput): Promise<ActionResult> {
  const actor = await requirePermission("inquiries.manage");

  const parsed = inquiryStatusSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const { id, status } = parsed.data;

  const supabase = createServiceRoleClient();
  const { error } = await supabase.from("contact_submissions").update({ status }).eq("id", id);

  if (error) {
    return { success: false, error: "Could not update inquiry status. " + error.message };
  }

  await logAudit({ adminId: actor.adminId, action: "update_status", entity: "contact_submissions", entityId: id, meta: { status } });

  revalidatePath("/admin/inquiries");
  revalidatePath(`/admin/inquiries/${id}`);
  revalidatePath("/admin"); // dashboard's "new inquiries" count
  return { success: true };
}
