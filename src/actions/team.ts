"use server";

import { revalidatePath } from "next/cache";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit";
import { deleteImageByPath, pathFromPublicUrl } from "@/lib/media/upload";
import {
  createTeamMemberSchema,
  updateTeamMemberSchema,
  type CreateTeamMemberInput,
  type UpdateTeamMemberInput,
} from "@/lib/validations/team";

export interface ActionResult {
  success: boolean;
  error?: string;
}

async function syncPracticeAreaLinks(teamMemberId: string, practiceAreaIds: string[]) {
  const supabase = createServiceRoleClient();
  // Replace-the-whole-set, same trade-off as extraPermissions on the Admin
  // form (§5.1 precedent) — simpler than diffing, fine at this data volume.
  await supabase.from("team_practice_areas").delete().eq("team_member_id", teamMemberId);
  if (practiceAreaIds.length > 0) {
    await supabase
      .from("team_practice_areas")
      .insert(practiceAreaIds.map((practiceAreaId) => ({ team_member_id: teamMemberId, practice_area_id: practiceAreaId })));
  }
}

export async function createTeamMemberAction(input: CreateTeamMemberInput): Promise<ActionResult> {
  const actor = await requirePermission("team.manage");

  const parsed = createTeamMemberSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const { name, slug, designation, photoUrl, bio, email, phone, linkedinUrl, status, seoTitle, seoDescription, practiceAreaIds } =
    parsed.data;

  const supabase = createServiceRoleClient();

  const { data: existing } = await supabase.from("team_members").select("id").eq("slug", slug).maybeSingle();
  if (existing) {
    return { success: false, error: `Slug "${slug}" is already in use.` };
  }

  const { count } = await supabase.from("team_members").select("id", { count: "exact", head: true });

  const { data: created, error } = await supabase
    .from("team_members")
    .insert({
      name,
      slug,
      designation,
      photo_url: photoUrl,
      bio: bio ?? null,
      email,
      phone,
      linkedin_url: linkedinUrl,
      order_index: count ?? 0,
      status,
      seo_title: seoTitle,
      seo_description: seoDescription,
    })
    .select("id")
    .single();

  if (error || !created) {
    return { success: false, error: "Could not create team member. " + (error?.message ?? "") };
  }

  await syncPracticeAreaLinks(created.id, practiceAreaIds);
  await logAudit({ adminId: actor.adminId, action: "create", entity: "team_members", entityId: created.id, meta: { slug } });

  revalidatePath("/admin/team");
  revalidatePath("/team");
  return { success: true };
}

export async function updateTeamMemberAction(input: UpdateTeamMemberInput): Promise<ActionResult> {
  const actor = await requirePermission("team.manage");

  const parsed = updateTeamMemberSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const { id, name, slug, designation, photoUrl, bio, email, phone, linkedinUrl, status, seoTitle, seoDescription, practiceAreaIds } =
    parsed.data;

  const supabase = createServiceRoleClient();

  const { data: slugOwner } = await supabase.from("team_members").select("id").eq("slug", slug).maybeSingle();
  if (slugOwner && slugOwner.id !== id) {
    return { success: false, error: `Slug "${slug}" is already in use by another team member.` };
  }

  // Clean up the old photo if it's being replaced/removed. Non-blocking.
  // Also carries the pre-update slug, so the public detail page's previous
  // path can be revalidated even if this save changes the slug or flips
  // status published → draft (Phase 5 — see practice-areas.ts's identical
  // pattern for the same reasoning).
  const { data: before } = await supabase.from("team_members").select("photo_url, slug").eq("id", id).single();
  if (before?.photo_url && before.photo_url !== photoUrl) {
    const oldPath = pathFromPublicUrl(before.photo_url);
    if (oldPath) void deleteImageByPath(oldPath);
  }

  const { error } = await supabase
    .from("team_members")
    .update({
      name,
      slug,
      designation,
      photo_url: photoUrl,
      bio: bio ?? null,
      email,
      phone,
      linkedin_url: linkedinUrl,
      status,
      seo_title: seoTitle,
      seo_description: seoDescription,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return { success: false, error: "Could not update team member. " + error.message };
  }

  await syncPracticeAreaLinks(id, practiceAreaIds);
  await logAudit({ adminId: actor.adminId, action: "update", entity: "team_members", entityId: id, meta: { slug, status } });

  revalidatePath("/admin/team");
  revalidatePath(`/admin/team/${id}`);
  revalidatePath("/team");
  if (before?.slug) revalidatePath(`/team/${before.slug}`);
  if (slug !== before?.slug) revalidatePath(`/team/${slug}`);
  // Not revalidated: individual Practice Area detail pages whose "related
  // team" sidebar includes this member — resolving that would mean an
  // extra query per linked practice area on every team save. Left to the
  // 1hr safety-net revalidate window; flagged in PHASE-5-NOTES.md rather
  // than solved here, since it's a minor staleness case (a name/photo
  // change lagging up to an hour on someone else's page), not a
  // visibility bug like the insights.ts published→demoted case was.
  return { success: true };
}

export async function deleteTeamMemberAction(id: string): Promise<ActionResult> {
  const actor = await requirePermission("team.manage");
  const supabase = createServiceRoleClient();

  const { data: target } = await supabase.from("team_members").select("photo_url, slug").eq("id", id).single();

  const { error } = await supabase.from("team_members").delete().eq("id", id);
  if (error) {
    return { success: false, error: "Could not delete. " + error.message };
  }

  if (target?.photo_url) {
    const path = pathFromPublicUrl(target.photo_url);
    if (path) void deleteImageByPath(path);
  }

  await logAudit({ adminId: actor.adminId, action: "delete", entity: "team_members", entityId: id });

  revalidatePath("/admin/team");
  revalidatePath("/team");
  if (target?.slug) revalidatePath(`/team/${target.slug}`);
  return { success: true };
}

export async function reorderTeamMemberAction(id: string, direction: "up" | "down"): Promise<ActionResult> {
  await requirePermission("team.manage");
  const supabase = createServiceRoleClient();

  const { data: rows, error } = await supabase.from("team_members").select("id, order_index").order("order_index", { ascending: true });
  if (error || !rows) return { success: false, error: "Could not load list for reordering." };

  const index = rows.findIndex((r) => r.id === id);
  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapWith < 0 || swapWith >= rows.length) return { success: true };

  const a = rows[index];
  const b = rows[swapWith];
  if (!a || !b) return { success: false, error: "Could not reorder." };

  const [{ error: e1 }, { error: e2 }] = await Promise.all([
    supabase.from("team_members").update({ order_index: b.order_index }).eq("id", a.id),
    supabase.from("team_members").update({ order_index: a.order_index }).eq("id", b.id),
  ]);

  if (e1 || e2) return { success: false, error: "Could not reorder." };

  revalidatePath("/admin/team");
  revalidatePath("/team");
  return { success: true };
}
