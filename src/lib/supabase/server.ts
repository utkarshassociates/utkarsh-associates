import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client — SERVER ONLY. Never import this file from a
 * "use client" component; the service role key must never reach the browser.
 *
 * Per project-plan.md §6: this key bypasses RLS entirely. Every caller
 * (server action / server component) is responsible for having already
 * verified the admin's session and checked their resolved permission set
 * (see src/lib/auth/session.ts) before using this client to read or write.
 * RLS on the anon key (src/lib/supabase/client.ts) is the backstop, not the
 * primary access-control layer, for admin operations.
 */
export function createServiceRoleClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. " +
        "Check .env.local against .env.example."
    );
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
