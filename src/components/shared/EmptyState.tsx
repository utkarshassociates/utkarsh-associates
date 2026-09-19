interface EmptyStateProps {
  title: string;
  description?: string;
}

/**
 * Phase 6 §10 — every top-level listing (Practice Areas, Team, Insights)
 * must look intentional with an empty CMS table, not blank or broken.
 * Shared so "No X Found" reads consistently everywhere it appears (Home's
 * highlight sections, each entity's own listing page, and the Team page's
 * per-tier sections).
 */
export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="rounded-lg border border-dashed border-gray-300 bg-gray-100 px-6 py-12 text-center">
      <p className="font-serif text-h4 text-navy-700">{title}</p>
      {description && <p className="mt-2 text-small text-gray-500">{description}</p>}
    </div>
  );
}
