import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth/session";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { SITE_SETTINGS_FIELDS } from "@/lib/validations/settings";
import { SettingsForm } from "@/components/admin/SettingsForm";

export const metadata: Metadata = { title: "Site Settings" };

export default async function SettingsPage() {
  await requirePermission("settings.manage");

  const supabase = createServiceRoleClient();
  const { data: rows } = await supabase
    .from("site_settings")
    .select("key, value")
    .in(
      "key",
      SITE_SETTINGS_FIELDS.map((f) => f.key)
    );

  const existing = new Map((rows ?? []).map((row) => [row.key, row.value]));

  // Every known key gets a default (empty string) so the form always renders
  // the full set — matches the "seeded with sensible defaults" intent,
  // even though supabase/seed.sql doesn't currently seed these rows (see
  // note in src/lib/validations/settings.ts). First save here creates them.
  const initialValues: Record<string, string> = {};
  for (const field of SITE_SETTINGS_FIELDS) {
    const raw = existing.get(field.key);
    initialValues[field.key] = typeof raw === "string" ? raw : "";
  }

  return (
    <div>
      <h1 className="mb-1 font-serif text-h3 text-navy-700">Site settings</h1>
      <p className="mb-6 max-w-[560px] text-small text-gray-700">
        Static, editable text for the code-defined pages — Home, About, Offices, Contact, and the
        legal disclaimer gate. The database value here is always the runtime source of truth.
      </p>
      <SettingsForm initialValues={initialValues} />
    </div>
  );
}
