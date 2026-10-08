import type { Permission } from "@/config/permissions";

/**
 * Hand-written domain types matching supabase/migrations/0001_init.sql
 * through 0004_phase4_related_insights.sql.
 *
 * NOTE: this is deliberately NOT a full `supabase gen types typescript`
 * output — generating that requires the Supabase CLI linked to the live
 * project, which wasn't run in this environment (no network access here;
 * see PHASE-1-NOTES.md's environment note). Recommended follow-up once convenient:
 *
 *   supabase gen types typescript --project-id <ref> > src/types/supabase.ts
 *
 * ...and swap these hand-written types for the generated ones. Until then,
 * keep this file in sync by hand if the schema changes.
 */

export type AdminStatus = "active" | "disabled";

export interface Role {
  id: string;
  name: string;
  slug: string;
  is_super: boolean;
  created_at: string;
}

export interface PermissionRow {
  id: string;
  key: Permission;
  label: string;
  category: string;
}

export interface Admin {
  id: string;
  login_id: string;
  name: string;
  password_hash: string;
  avatar_url: string | null;
  role_id: string;
  extra_permissions: Permission[];
  status: AdminStatus;
  created_at: string;
  last_login_at: string | null;
}

/** Admin row joined with its role — the shape most admin-list UI needs. */
export interface AdminWithRole extends Omit<Admin, "password_hash"> {
  role: Pick<Role, "id" | "name" | "slug" | "is_super">;
}

export interface RoleWithPermissions extends Role {
  permissionKeys: Permission[];
}

export interface SiteSetting {
  key: string;
  value: unknown; // jsonb
  updated_at: string;
  updated_by: string | null;
}

export interface AuditLogEntry {
  id: string;
  admin_id: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  meta: Record<string, unknown> | null;
  created_at: string;
}

// ============ Phase 3 — CMS entities ============
// Added in the same "hand-written, kept in sync by hand" spirit as the types
// above — see the file-level note for why this isn't generated output.

export type ContentStatus = "draft" | "published";
export type InsightStatus = "draft" | "pending_review" | "published" | "rejected";
export type InsightPostType = "original" | "external_link";

export interface PracticeArea {
  id: string;
  slug: string;
  title: string;
  short_description: string | null;
  content: unknown; // richtext jsonb (HTML string — CKEditor 5's editor.getData() output)
  icon_url: string | null; // Phase 6 §7: uploaded via the same sharp/Storage pipeline as team photos; null renders ASSETS.practiceAreaIconFallback. Was icon_key (a fixed picker key) before Phase 6.
  order_index: number;
  status: ContentStatus;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
}

// Phase 6 §6: drives the segregated Team page display (leadership shown
// separately from counsel/general team). Naming matches the plan's own
// example ("leadership" / "counsel" / "team") — revisit if the eventual
// reference design doc uses different labels.
export type TeamTier = "leadership" | "counsel" | "team";

export interface TeamMember {
  id: string;
  slug: string;
  name: string;
  designation: string | null;
  photo_url: string | null;
  bio: unknown; // richtext jsonb (HTML string — CKEditor 5's editor.getData() output)
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  tier: TeamTier;
  order_index: number;
  status: ContentStatus;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
}

export interface TeamMemberWithPracticeAreas extends TeamMember {
  practiceAreaIds: string[];
}

export interface InsightCategory {
  id: string;
  name: string;
  slug: string;
}

export interface Insight {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: unknown; // richtext jsonb (HTML string), nullable for external_link posts
  cover_image_url: string | null;
  category_id: string | null;
  author_id: string | null;
  practice_area_id: string | null; // migration 0004 — related-insights relation, see PHASE-4-NOTES.md
  post_type: InsightPostType;
  external_url: string | null;
  source_name: string | null;
  tags: string[]; // see migration 0002 — additive column, added after the original schema shipped without one
  status: InsightStatus;
  rejection_note: string | null;
  submitted_by: string | null;
  published_at: string | null;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
}

/** One credited author of an insight (ordered; index 0 is the lead author). */
export type InsightAuthor = Pick<TeamMember, "id" | "name" | "slug"> & { photo_url?: string | null };

/** Insight row joined with the bits list/edit screens need for display. */
export interface InsightWithRelations extends Insight {
  category: Pick<InsightCategory, "id" | "name" | "slug"> | null;
  /** Lead author — always authors[0] when authors is present. Kept so older call sites keep working. */
  author: InsightAuthor | null;
  /** All credited authors, in order. Populated by the public data layer and the admin edit page. */
  authors?: InsightAuthor[];
  // Optional: only populated where the query actually joins practice_areas
  // (src/lib/data/public.ts's INSIGHT_SELECT). The admin edit page's own
  // narrower query doesn't need it — practice area selection there goes
  // through a separate `practice_area_id` + dropdown, not this relation.
  practiceArea?: Pick<PracticeArea, "id" | "title" | "slug"> | null;
}

// Office (formerly a DB entity here) was removed in Phase 6 §1 — offices
// moved out of the database into src/config/content.json. See
// src/config/content.ts's OfficeContent for the current type.

// ============ Phase 4 — Public site ============

export type ContactSubmissionStatus = "new" | "read" | "archived";

export interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  practice_area_interest: string | null;
  status: ContactSubmissionStatus;
  created_at: string;
}
