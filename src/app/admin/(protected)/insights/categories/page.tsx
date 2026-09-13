import Link from "next/link";
import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth/session";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { AddCategoryForm } from "@/components/admin/AddCategoryForm";
import { deleteCategoryAction } from "@/actions/insights";

export const metadata: Metadata = { title: "Insight Categories" };

// Deliberately minimal — no separate "edit" screen, since a category is just
// a name + slug. This page is reached from the Insights list ("Categories"
// button) and from the quick-add control inside the Insight form itself
// (src/components/admin/InsightForm.tsx); this page exists for viewing the
// full list and cleaning up unused ones, not as the primary creation path.
export default async function InsightCategoriesPage() {
  await requirePermission("insights.create");

  const supabase = createServiceRoleClient();
  const { data: categories, error } = await supabase.from("insight_categories").select("id, name, slug").order("name");

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/insights" className="text-[13px] font-medium text-navy-700 hover:text-gold-700">
          ← Back to Insights
        </Link>
      </div>

      <h1 className="mb-6 font-serif text-h3 text-navy-700">Insight categories</h1>

      {error && (
        <div className="mb-4 rounded-sm border border-error bg-error-bg px-3.5 py-3 text-[13px] text-error">
          Couldn&apos;t load categories: {error.message}
        </div>
      )}

      <div className="mb-6 max-w-[420px]">
        <AddCategoryForm />
      </div>

      <div className="max-w-[420px] overflow-hidden rounded-lg border border-gray-300 bg-white">
        <table className="w-full text-left text-small">
          <thead>
            <tr className="border-b border-gray-300 bg-gray-100 text-[12px] uppercase tracking-wide text-gray-500">
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Slug</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {(categories ?? []).map((c) => (
              <tr key={c.id} className="border-b border-gray-300 last:border-0">
                <td className="px-4 py-3 font-medium text-ink-900">{c.name}</td>
                <td className="px-4 py-3 font-mono text-[12px] text-gray-700">{c.slug}</td>
                <td className="px-4 py-3 text-right">
                  <DeleteButton id={c.id} action={deleteCategoryAction} confirmMessage={`Delete category "${c.name}"?`} />
                </td>
              </tr>
            ))}
            {(categories ?? []).length === 0 && !error && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                  No categories yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
