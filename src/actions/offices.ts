"use server";

import { revalidatePath } from "next/cache";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit";
import { createOfficeSchema, updateOfficeSchema, type CreateOfficeInput, type UpdateOfficeInput } from "@/lib/validations/office";

export interface ActionResult {
  success: boolean;
  error?: string;
}

/**
 * Phase 5 (ISR): Offices don't have their own public detail page, but every
 * office row is read by (marketing)/layout.tsx and rendered in the Footer
 * on literally every public page (plus the dedicated /offices listing).
 * `revalidatePath("/", "layout")` revalidates every page that shares the
 * root layout — i.e. the whole site — which is the correct scope here,
 * rather than trying to enumerate every dynamic public path by hand.
 * See PHASE-5-NOTES.md for the "please verify" flag on this: Next.js has
 * had reported inconsistencies between `type: "layout"`-based invalidation
 * and its underlying fetch Data Cache in some versions (vercel/next.js#62071)
 * — worth a real-instance check, same as every other phase's caching work.
 */
function revalidatePublicOfficePaths() {
  revalidatePath("/offices");
  revalidatePath("/", "layout");
}

export async function createOfficeAction(input: CreateOfficeInput): Promise<ActionResult> {
  const actor = await requirePermission("offices.manage");

  const parsed = createOfficeSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const { name, address, city, phone, email, mapEmbedUrl, isHeadquarters } = parsed.data;

  const supabase = createServiceRoleClient();
  const { count } = await supabase.from("offices").select("id", { count: "exact", head: true });

  const { data: created, error } = await supabase
    .from("offices")
    .insert({
      name,
      address,
      city,
      phone,
      email,
      map_embed_url: mapEmbedUrl,
      is_headquarters: isHeadquarters,
      order_index: count ?? 0,
    })
    .select("id")
    .single();

  if (error || !created) {
    return { success: false, error: "Could not create office. " + (error?.message ?? "") };
  }

  await logAudit({ adminId: actor.adminId, action: "create", entity: "offices", entityId: created.id, meta: { name } });

  revalidatePath("/admin/offices");
  revalidatePublicOfficePaths();
  return { success: true };
}

export async function updateOfficeAction(input: UpdateOfficeInput): Promise<ActionResult> {
  const actor = await requirePermission("offices.manage");

  const parsed = updateOfficeSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const { id, name, address, city, phone, email, mapEmbedUrl, isHeadquarters } = parsed.data;

  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from("offices")
    .update({ name, address, city, phone, email, map_embed_url: mapEmbedUrl, is_headquarters: isHeadquarters })
    .eq("id", id);

  if (error) {
    return { success: false, error: "Could not update office. " + error.message };
  }

  await logAudit({ adminId: actor.adminId, action: "update", entity: "offices", entityId: id, meta: { name } });

  revalidatePath("/admin/offices");
  revalidatePath(`/admin/offices/${id}`);
  revalidatePublicOfficePaths();
  return { success: true };
}

export async function deleteOfficeAction(id: string): Promise<ActionResult> {
  const actor = await requirePermission("offices.manage");
  const supabase = createServiceRoleClient();

  const { error } = await supabase.from("offices").delete().eq("id", id);
  if (error) {
    return { success: false, error: "Could not delete. " + error.message };
  }

  await logAudit({ adminId: actor.adminId, action: "delete", entity: "offices", entityId: id });

  revalidatePath("/admin/offices");
  revalidatePublicOfficePaths();
  return { success: true };
}

export async function reorderOfficeAction(id: string, direction: "up" | "down"): Promise<ActionResult> {
  await requirePermission("offices.manage");
  const supabase = createServiceRoleClient();

  const { data: rows, error } = await supabase.from("offices").select("id, order_index").order("order_index", { ascending: true });
  if (error || !rows) return { success: false, error: "Could not load list for reordering." };

  const index = rows.findIndex((r) => r.id === id);
  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapWith < 0 || swapWith >= rows.length) return { success: true };

  const a = rows[index];
  const b = rows[swapWith];
  if (!a || !b) return { success: false, error: "Could not reorder." };

  const [{ error: e1 }, { error: e2 }] = await Promise.all([
    supabase.from("offices").update({ order_index: b.order_index }).eq("id", a.id),
    supabase.from("offices").update({ order_index: a.order_index }).eq("id", b.id),
  ]);

  if (e1 || e2) return { success: false, error: "Could not reorder." };

  revalidatePath("/admin/offices");
  revalidatePublicOfficePaths();
  return { success: true };
}
