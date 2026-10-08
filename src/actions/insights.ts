"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { requireAdmin, requirePermission } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { logAudit } from "@/lib/audit";
import { deleteImageByPath, pathFromPublicUrl } from "@/lib/media/upload";
import type { ActionResult as BaseActionResult } from "@/lib/action-result";
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

// Extends the shared shape with `id` — create/update need to hand the new
// or edited row's id back to the form (e.g. to redirect to its edit page).
export interface ActionResult extends BaseActionResult {
  id?: string;
}

/**
 * Phase 5 — on-demand ISR revalidation for every public path a single
 * insight can appear on: its own detail page, the /insights listing, the
 * Home page's "latest insights" strip, and (via migration 0004's
 * `practice_area_id` relation) its linked Practice Area detail page's
 * "Related Insights" section. Centralized here so publish/update/delete —
 * the three actions that can each cause an insight to appear or disappear
 * from the public site — all revalidate the exact same set of paths rather
 * than three independently-maintained lists drifting apart over time.
 */
async function revalidatePublicInsightPaths(supabase: SupabaseClient, slug: string, practiceAreaId: string | null) {
  revalidatePath(`/insights/${slug}`);
  revalidatePath("/insights");
  revalidatePath("/");
  if (practiceAreaId) {
    const { data: pa } = await supabase.from("practice_areas").select("slug").eq("id", practiceAreaId).maybeSingle();
    if (pa?.slug) revalidatePath(`/practice-areas/${pa.slug}`);
  }
}

/**
 * Replaces an insight's credited authors with `authorIds` (ordered; index 0
 * = lead). Upsert-then-prune rather than delete-then-insert, so a failed
 * write can never leave the insight with its authors wiped. Returns an error
 * message, or null on success.
 */
async function syncInsightAuthors(supabase: SupabaseClient, insightId: string, authorIds: string[]): Promise<string | null> {
  if (authorIds.length > 0) {
    const rows = authorIds.map((id, position) => ({ insight_id: insightId, team_member_id: id, position }));
    const { error } = await supabase.from("insight_authors").upsert(rows, { onConflict: "insight_id,team_member_id" });
    if (error) return error.message;
  }
  let del = supabase.from("insight_authors").delete().eq("insight_id", insightId);
  if (authorIds.length > 0) del = del.not("team_member_id", "in", `(${authorIds.join(",")})`);
  const { error: delError } = await del;
  return delError?.message ?? null;
}

// The draft → pending_review → published(/rejected) workflow is enforced by
// which action a caller reaches, not by trusting a status value the client
// sent:
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
  const authorIds = [...new Set(data.authorIds)];

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
      author_id: authorIds[0] ?? null,
      practice_area_id: data.practiceAreaId ?? null,
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

  const authorsError = await syncInsightAuthors(supabase, created.id, authorIds);
  if (authorsError) {
    // Don't leave a half-saved insight behind (a retry would hit the slug check).
    await supabase.from("insights").delete().eq("id", created.id);
    return { success: false, error: "Could not save authors. " + authorsError };
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
  const authorIds = [...new Set(data.authorIds)];

  const { data: target } = await supabase
    .from("insights")
    .select("submitted_by, cover_image_url, status, slug, practice_area_id")
    .eq("id", data.id)
    .single();
  if (!target) return { success: false, error: "Insight not found." };

  // insights.edit_own only covers the admin's own insights;
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
      author_id: authorIds[0] ?? null,
      practice_area_id: data.practiceAreaId ?? null,
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

  const authorsError = await syncInsightAuthors(supabase, data.id, authorIds);
  if (authorsError) {
    return { success: false, error: "Saved, but could not update authors — please save again. " + authorsError };
  }

  await logAudit({ adminId: actor.adminId, action: "update", entity: "insights", entityId: data.id, meta: { slug: data.slug, status: data.status } });

  revalidatePath("/admin/insights");
  revalidatePath(`/admin/insights/${data.id}/edit`);

  // Phase 5 finding (see PHASE-5-NOTES.md): updateInsightSchema only ever
  // accepts status "draft"/"pending_review" (publish/reject are separate,
  // insights.publish-gated actions), so if this insight was "published"
  // before this call, this save just demoted it out of public
  // visibility even though its content changed, not its status field per
  // se. Without this, the page would sit in the cache showing the old
  // (still-"published"-looking) content until the safety-net revalidate
  // window expired — a real staleness bug now that ISR caching exists,
  // where none existed in Phase 4's always-uncached-fetch world.
  if (target.status === "published") {
    await revalidatePublicInsightPaths(supabase, target.slug, target.practice_area_id);
  }

  return { success: true, id: data.id };
}

export async function deleteInsightAction(id: string): Promise<ActionResult> {
  const actor = await requirePermission("insights.delete");
  const supabase = createServiceRoleClient();

  const { data: target } = await supabase
    .from("insights")
    .select("cover_image_url, status, slug, practice_area_id")
    .eq("id", id)
    .single();

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
  if (target?.status === "published") {
    await revalidatePublicInsightPaths(supabase, target.slug, target.practice_area_id);
  }
  return { success: true };
}

/** Anyone with insights.publish can move pending_review → published. */
export async function publishInsightAction(id: string): Promise<ActionResult> {
  const actor = await requirePermission("insights.publish");
  const supabase = createServiceRoleClient();

  const { data: updated, error } = await supabase
    .from("insights")
    .update({ status: "published", published_at: new Date().toISOString(), rejection_note: null })
    .eq("id", id)
    .select("slug, practice_area_id")
    .single();

  if (error || !updated) {
    return { success: false, error: "Could not publish. " + (error?.message ?? "") };
  }

  await logAudit({ adminId: actor.adminId, action: "publish", entity: "insights", entityId: id });

  revalidatePath("/admin/insights");
  await revalidatePublicInsightPaths(supabase, updated.slug, updated.practice_area_id);
  return { success: true };
}

/** ...or moves it to rejected, with an optional note that sends it back to draft. */
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
  // Was gated on insights.create (same as the quick-add action above) —
  // tightened to insights.delete, the permission deleteInsightAction itself
  // already uses. A category is a shared taxonomy entity used across every
  // admin's insights, not something scoped to what one admin authored, so
  // "can create an insight" isn't the right bar for removing it; "can
  // delete insight content" is the closer match already defined in
  // src/config/permissions.ts.
  const actor = await requirePermission("insights.delete");
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
