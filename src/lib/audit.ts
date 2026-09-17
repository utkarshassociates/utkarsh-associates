import { createServiceRoleClient } from "@/lib/supabase/server";

/**
 * Writes one row to `audit_log` (a lightweight accountability trail).
 * Deliberately best-effort: a logging failure should
 * never fail the admin action it's describing, so this swallows its own
 * errors after a console.error. If audit completeness ever becomes a
 * compliance requirement, revisit this trade-off.
 */
export async function logAudit(params: {
  adminId: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  meta?: Record<string, unknown>;
}): Promise<void> {
  try {
    const supabase = createServiceRoleClient();
    await supabase.from("audit_log").insert({
      admin_id: params.adminId,
      action: params.action,
      entity: params.entity,
      entity_id: params.entityId ?? null,
      meta: params.meta ?? null,
    });
  } catch (err) {
    console.error("audit log write failed (non-blocking):", err);
  }
}
