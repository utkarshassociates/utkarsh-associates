import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Anon/browser Supabase client. Safe to import in client components.
 *
 * Per project-plan.md §6, RLS restricts this key to SELECT-only, and only on
 * rows where status = 'published', on public-facing tables — it can never
 * write. The admin dashboard does NOT use this client for reads or writes;
 * all admin data access goes through server actions using the service-role
 * client (src/lib/supabase/server.ts) after a permission check.
 *
 * Not used anywhere in Phase 2 (admin core has no public-facing data needs
 * yet) — included now so Phase 4 (public site) has it ready.
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
