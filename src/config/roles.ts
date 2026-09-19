/**
 * Phase 6 §12 — the admin role model is now fixed to three roles:
 * SuperAdmin (bootstrap-only, never creatable through the UI), Admin, and
 * Author. The `/admin/roles` custom permission-builder screen that used to
 * let a superAdmin create arbitrary named roles is removed — this is a
 * deliberate simplification for a non-technical client, not a capability
 * regression at the schema level (the granular `roles`/`role_permissions`
 * tables are untouched, so a future need for a fourth tier is still a
 * possible — if now developer-driven — change, not a rebuild).
 *
 * These are the only two selectable slugs in the Admins UI's role dropdown
 * (SuperAdmin is filtered out separately, same as before this phase — see
 * src/app/admin/(protected)/admins/new/page.tsx and .../[id]/page.tsx).
 * supabase/seed.sql seeds exactly these two non-super roles; nothing in the
 * app can create a third since the role-builder is gone.
 */
export const FIXED_ADMIN_ROLE_SLUGS = ["admin", "author"] as const;
