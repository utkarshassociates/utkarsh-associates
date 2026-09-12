import { Tag } from "@/components/ui";

// Renders for the CMS entity routes wired into the sidebar (§5.2) now, but
// whose CRUD screens are Phase 3 scope (project-plan.md §9) — keeps the
// permission-aware sidebar fully functional today without linking to a 404,
// and without scope-creeping Phase 2 (Admin core) into building CMS forms.
export function ComingSoon({ title, permissionLabel }: { title: string; permissionLabel: string }) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-3">
        <h1 className="font-serif text-h3 text-navy-700">{title}</h1>
        <Tag variant="gold">Phase 3</Tag>
      </div>
      <p className="max-w-[480px] text-body text-gray-700">
        This section is scoped for Phase 3 (CMS entities) per the project plan. You have{" "}
        <code className="rounded-sm bg-gray-100 px-1.5 py-0.5 font-mono text-[13px]">{permissionLabel}</code>{" "}
        access, so this will appear here as soon as it's built — nothing further to configure.
      </p>
    </div>
  );
}
