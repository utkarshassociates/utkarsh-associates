"use server";

import { revalidatePath } from "next/cache";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { requireAdmin, requirePermission } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { logAudit } from "@/lib/audit";
import { deleteImageByPath, pathFromPublicUrl } from "@/lib/media/upload";
import {
  createInsightSchema,
  updateInsightSchema,
  rejectInsightSchema,
  createCategorySchema,
  type CreateInsightInput,
  type UpdateInsightInput,
  type RejectInsightInput,
  type CreateCategoryInput,
} from "@/lib/validations/insight";

export interface ActionResult {
  success: boolean;
  error?: string;
  id?: string;
}

// §5.1 workflow is enforced by which action a caller reaches, not by trusting
// a status value the client sent:
//   - createInsightAction / updateInsightAction only ever write
//     draft/pending_review (insightOwnerStatusSchema in the zod schema makes
//     any other value a validation failure before this code even runs).
//   - publishInsightAction / rejectInsightAction are the only path to
//     published/rejected, and both require insights.publish.

export async function createInsightAction(input: CreateInsightInput): Promise<ActionResult> {
  const actor = await requirePermission("insights.create");

  const parsed = createInsightSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const data = parsed.data;

  const supabase = createServiceRoleClient();

  const { data: existing } = await supabase.from("insights").select("id").eq("slug", data.slug).maybeSingle();
  if (existing) {
    return { success: false, error: `Slug "${data.slug}" is already in use.` };
  }

  const { data: created, error } = await supabase
    .from("insights")
    .insert({
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt,
      content: data.postType === "original" ? (data.content ?? null) : null,
      cover_image_url: data.coverImageUrl,
      category_id: data.categoryId ?? null,
      author_id: data.authorId ?? null,
      post_type: data.postType,
      external_url: data.postType === "external_link" ? data.externalUrl || null : null,
      source_name: data.postType === "external_link" ? data.sourceName : null,
      tags: data.tags,
      status: data.status,
      submitted_by: actor.adminId,
      seo_title: data.seoTitle,
      seo_description: data.seoDescription,
    })
    .select("id")
    .single();

  if (error || !created) {
    return { success: false, error: "Could not create insight. " + (error?.message ?? "") };
  }

  await logAudit({ adminId: actor.adminId, action: "create", entity: "insights", entityId: created.id, meta: { slug: data.slug, status: data.status } });

  revalidatePath("/admin/insights");
  return { success: true, id: created.id };
}

export async function updateInsightAction(input: UpdateInsightInput): Promise<ActionResult> {
  const actor = await requireAdmin();

  const parsed = updateInsightSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const data = parsed.data;

  const supabase = createServiceRoleClient();

  const { data: target } = await supabase.from("insights").select("submitted_by, cover_image_url").eq("id", data.id).single();
  if (!target) return { success: false, error: "Insight not found." };

  // §5.1: insights.edit_own only covers the admin's own insights;
  // insights.edit_any (superAdmin, or a future blogAdmin) covers everyone's.
  const canEditAny = hasPermission(actor, "insights.edit_any");
  const canEditOwn = hasPermission(actor, "insights.edit_own") && target.submitted_by === actor.adminId;
  if (!canEditAny && !canEditOwn) {
    return { success: false, error: "You don't have permission to edit this insight." };
  }

  const { data: slugOwner } = await supabase.from("insights").select("id").eq("slug", data.slug).maybeSingle();
  if (slugOwner && slugOwner.id !== data.id) {
    return { success: false, error: `Slug "${data.slug}" is already in use by another insight.` };
  }

  if (target.cover_image_url && target.cover_image_url !== data.coverImageUrl) {
    const oldPath = pathFromPublicUrl(target.cover_image_url);
    if (oldPath) void deleteImageByPath(oldPath);
  }

  const { error } = await supabase
    .from("insights")
    .update({
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt,
      content: data.postType === "original" ? (data.content ?? null) : null,
      cover_image_url: data.coverImageUrl,
      category_id: data.categoryId ?? null,
      author_id: data.authorId ?? null,
      post_type: data.postType,
      external_url: data.postType === "external_link" ? data.externalUrl || null : null,
      source_name: data.postType === "external_link" ? data.sourceName : null,
      tags: data.tags,
      status: data.status,
      // Editing resets a rejected post back into the normal flow — an edit
      // that keeps status "draft" or resubmits as "pending_review" both
      // clear whatever rejection_note was left, since it no longer applies
      // to the content now being saved.
      rejection_note: null,
      seo_title: data.seoTitle,
      seo_description: data.seoDescription,
      updated_at: new Date().toISOString(),
    })
    .eq("id", data.id);

  if (error) {
    return { success: false, error: "Could not update insight. " + error.message };
  }

  await logAudit({ adminId: actor.adminId, action: "update", entity: "insights", entityId: data.id, meta: { slug: data.slug, status: data.status } });

  revalidatePath("/admin/insights");
  revalidatePath(`/admin/insights/${data.id}/edit`);
  return { success: true, id: data.id };
}

export async function deleteInsightAction(id: string): Promise<ActionResult> {
  const actor = await requirePermission("insights.delete");
  const supabase = createServiceRoleClient();

  const { data: target } = await supabase.from("insights").select("cover_image_url").eq("id", id).single();

  const { error } = await supabase.from("insights").delete().eq("id", id);
  if (error) {
    return { success: false, error: "Could not delete. " + error.message };
  }

  if (target?.cover_image_url) {
    const path = pathFromPublicUrl(target.cover_image_url);
    if (path) void deleteImageByPath(path);
  }

  await logAudit({ adminId: actor.adminId, action: "delete", entity: "insights", entityId: id });

  revalidatePath("/admin/insights");
  return { success: true };
}

/** §5.1: "Anyone with insights.publish ... can move pending_review → published." */
export async function publishInsightAction(id: string): Promise<ActionResult> {
  const actor = await requirePermission("insights.publish");
  const supabase = createServiceRoleClient();

  const { error } = await supabase
    .from("insights")
    .update({ status: "published", published_at: new Date().toISOString(), rejection_note: null })
    .eq("id", id);

  if (error) {
    return { success: false, error: "Could not publish. " + error.message };
  }

  await logAudit({ adminId: actor.adminId, action: "publish", entity: "insights", entityId: id });

  revalidatePath("/admin/insights");
  return { success: true };
}

/** §5.1: "...or → rejected", with an optional note that sends it back to draft. */
export async function rejectInsightAction(input: RejectInsightInput): Promise<ActionResult> {
  const actor = await requirePermission("insights.publish");

  const parsed = rejectInsightSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from("insights")
    .update({ status: "rejected", rejection_note: parsed.data.rejectionNote ?? null })
    .eq("id", parsed.data.id);

  if (error) {
    return { success: false, error: "Could not reject. " + error.message };
  }

  await logAudit({ adminId: actor.adminId, action: "reject", entity: "insights", entityId: parsed.data.id, meta: { note: parsed.data.rejectionNote } });

  revalidatePath("/admin/insights");
  return { success: true };
}

/** Quick-add from the Insight form's category select — any insight creator can add one, avoiding a round trip to a separate admin. */
export async function createCategoryAction(input: CreateCategoryInput): Promise<ActionResult & { categoryId?: string }> {
  const actor = await requirePermission("insights.create");

  const parsed = createCategorySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = createServiceRoleClient();
  const { data: created, error } = await supabase
    .from("insight_categories")
    .insert({ name: parsed.data.name, slug: parsed.data.slug })
    .select("id")
    .single();

  if (error || !created) {
    // unique(slug) violation is the most likely cause — surface a friendlier message
    const message = error?.code === "23505" ? `Category slug "${parsed.data.slug}" already exists.` : error?.message;
    return { success: false, error: message ?? "Could not create category." };
  }

  await logAudit({ adminId: actor.adminId, action: "create", entity: "insight_categories", entityId: created.id, meta: { name: parsed.data.name } });

  revalidatePath("/admin/insights");
  return { success: true, categoryId: created.id };
}

export async function deleteCategoryAction(id: string): Promise<ActionResult> {
  const actor = await requirePermission("insights.create");
  const supabase = createServiceRoleClient();

  const { error } = await supabase.from("insight_categories").delete().eq("id", id);
  if (error) {
    // insights.category_id is a plain FK with no ON DELETE behavior specified
    // in 0001_init.sql, so Postgres defaults to NO ACTION — deleting a
    // category still in use fails loudly here rather than silently
    // orphaning insights, which is the right default for a CMS taxonomy.
    return { success: false, error: "Could not delete — it may still be in use by one or more insights." };
  }

  await logAudit({ adminId: actor.adminId, action: "delete", entity: "insight_categories", entityId: id });

  revalidatePath("/admin/insights");
  return { success: true };
}
