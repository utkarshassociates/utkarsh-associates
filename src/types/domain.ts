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
  content: unknown; // richtext jsonb (Tiptap JSON)
  icon_key: string; // one of the locked keys in src/config/assets.ts
  order_index: number;
  status: ContentStatus;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  slug: string;
  name: string;
  designation: string | null;
  photo_url: string | null;
  bio: unknown; // richtext jsonb
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
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
  content: unknown; // richtext jsonb, nullable for external_link posts
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

/** Insight row joined with the bits list/edit screens need for display. */
export interface InsightWithRelations extends Insight {
  category: Pick<InsightCategory, "id" | "name" | "slug"> | null;
  author: Pick<TeamMember, "id" | "name" | "slug"> | null;
}

export interface Office {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  map_embed_url: string | null;
  is_headquarters: boolean;
  order_index: number;
}

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
