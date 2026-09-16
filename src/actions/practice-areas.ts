"use server";

import { revalidatePath } from "next/cache";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit";
import type { ActionResult } from "@/lib/action-result";
import {
  createPracticeAreaSchema,
  updatePracticeAreaSchema,
  type CreatePracticeAreaInput,
  type UpdatePracticeAreaInput,
} from "@/lib/validations/practice-area";

export async function createPracticeAreaAction(input: CreatePracticeAreaInput): Promise<ActionResult> {
  const actor = await requirePermission("practice_areas.manage");

  const parsed = createPracticeAreaSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const { title, slug, shortDescription, content, iconKey, status, seoTitle, seoDescription } = parsed.data;

  const supabase = createServiceRoleClient();

  const { data: existing } = await supabase.from("practice_areas").select("id").eq("slug", slug).maybeSingle();
  if (existing) {
    return { success: false, error: `Slug "${slug}" is already in use.` };
  }

  const { count } = await supabase.from("practice_areas").select("id", { count: "exact", head: true });

  const { data: created, error } = await supabase
    .from("practice_areas")
    .insert({
      title,
      slug,
      short_description: shortDescription,
      content: content ?? null,
      icon_key: iconKey,
      order_index: count ?? 0,
      status,
      seo_title: seoTitle,
      seo_description: seoDescription,
    })
    .select("id")
    .single();

  if (error || !created) {
    return { success: false, error: "Could not create practice area. " + (error?.message ?? "") };
  }

  await logAudit({ adminId: actor.adminId, action: "create", entity: "practice_areas", entityId: created.id, meta: { slug } });

  revalidatePath("/admin/practice-areas");
  // Phase 5 (ISR): a brand-new row can't have a stale cached page yet, but
  // the listing + Home's highlight grid are already cached and need to pick
  // it up if it was created directly as "published".
  revalidatePath("/practice-areas");
  revalidatePath("/");
  return { success: true };
}

export async function updatePracticeAreaAction(input: UpdatePracticeAreaInput): Promise<ActionResult> {
  const actor = await requirePermission("practice_areas.manage");

  const parsed = updatePracticeAreaSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const { id, title, slug, shortDescription, content, iconKey, status, seoTitle, seoDescription } = parsed.data;

  const supabase = createServiceRoleClient();

  const { data: slugOwner } = await supabase.from("practice_areas").select("id").eq("slug", slug).maybeSingle();
  if (slugOwner && slugOwner.id !== id) {
    return { success: false, error: `Slug "${slug}" is already in use by another practice area.` };
  }

  // Old slug, fetched before the update, so the previously-cached public
  // detail page can be revalidated even if this save also changes the slug
  // or flips status published → draft (in which case the old path needs to
  // start 404ing instead of serving stale cached content).
  const { data: before } = await supabase.from("practice_areas").select("slug").eq("id", id).maybeSingle();

  const { error } = await supabase
    .from("practice_areas")
    .update({
      title,
      slug,
      short_description: shortDescription,
      content: content ?? null,
      icon_key: iconKey,
      status,
      seo_title: seoTitle,
      seo_description: seoDescription,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return { success: false, error: "Could not update practice area. " + error.message };
  }

  await logAudit({ adminId: actor.adminId, action: "update", entity: "practice_areas", entityId: id, meta: { slug, status } });

  revalidatePath("/admin/practice-areas");
  revalidatePath(`/admin/practice-areas/${id}`);
  revalidatePath("/practice-areas");
  revalidatePath("/");
  if (before?.slug) revalidatePath(`/practice-areas/${before.slug}`);
  if (slug !== before?.slug) revalidatePath(`/practice-areas/${slug}`);
  return { success: true };
}

export async function deletePracticeAreaAction(id: string): Promise<ActionResult> {
  const actor = await requirePermission("practice_areas.manage");
  const supabase = createServiceRoleClient();

  const { data: target } = await supabase.from("practice_areas").select("slug").eq("id", id).maybeSingle();

  const { error } = await supabase.from("practice_areas").delete().eq("id", id);
  if (error) {
    return { success: false, error: "Could not delete. " + error.message };
  }

  await logAudit({ adminId: actor.adminId, action: "delete", entity: "practice_areas", entityId: id });

  revalidatePath("/admin/practice-areas");
  revalidatePath("/practice-areas");
  revalidatePath("/");
  if (target?.slug) revalidatePath(`/practice-areas/${target.slug}`);
  return { success: true };
}

export async function reorderPracticeAreaAction(id: string, direction: "up" | "down"): Promise<ActionResult> {
  await requirePermission("practice_areas.manage");
  const supabase = createServiceRoleClient();

  const { data: rows, error } = await supabase
    .from("practice_areas")
    .select("id, order_index")
    .order("order_index", { ascending: true });

  if (error || !rows) return { success: false, error: "Could not load list for reordering." };

  const index = rows.findIndex((r) => r.id === id);
  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapWith < 0 || swapWith >= rows.length) return { success: true }; // no-op at either end

  const a = rows[index];
  const b = rows[swapWith];
  if (!a || !b) return { success: false, error: "Could not reorder." }; // noUncheckedIndexedAccess guard — unreachable given the bounds check above

  const [{ error: e1 }, { error: e2 }] = await Promise.all([
    supabase.from("practice_areas").update({ order_index: b.order_index }).eq("id", a.id),
    supabase.from("practice_areas").update({ order_index: a.order_index }).eq("id", b.id),
  ]);

  if (e1 || e2) return { success: false, error: "Could not reorder." };

  revalidatePath("/admin/practice-areas");
  revalidatePath("/practice-areas");
  revalidatePath("/"); // Home's highlight grid is the first 6 by order_index
  return { success: true };
}
