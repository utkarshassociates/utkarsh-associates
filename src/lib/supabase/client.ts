import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Anon/browser Supabase client. Safe to import in client components — and,
 * since it only reads public env vars and holds no session/cookies, equally
 * safe to call from Server Components/Actions that want the public site's
 * read-only view of the data (see src/lib/data/public.ts).
 *
 * RLS restricts this key to SELECT-only on rows
 * where status = 'published' for practice_areas/team_members/insights (open
 * SELECT for offices/insight_categories/site_settings, which have no draft
 * concept), plus one narrow, deliberate exception: an INSERT-only policy on
 * `contact_submissions` (no matching SELECT/UPDATE policy, so this key can
 * add a contact-form row but never read one back) — see src/actions/contact.ts.
 * Outside that one exception, this key can never write. The admin dashboard
 * does NOT use this client for reads or writes; all admin data access goes
 * through server actions using the service-role client
 * (src/lib/supabase/server.ts) after a permission check.
 *
 * Not used anywhere in Phase 2 (admin core has no public-facing data needs
 * yet) — wired up for real in Phase 4 (public site + contact form).
 */
export function createBrowserClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
        "Check .env.local against .env.example."
    );
  }

  return createClient(url, anonKey);
}
