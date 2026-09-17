import { Tag } from "@/components/ui";
import type { TagVariant } from "@/components/ui/Tag";

// Covers admin status (Phase 2) now, plus the content-workflow statuses
// (draft/pending_review/published/rejected) and inquiries
// (new/read/archived) so Phase 3 can reuse this without changes.
const STATUS_STYLES: Record<string, { label: string; variant: TagVariant }> = {
  active: { label: "Active", variant: "success" },
  disabled: { label: "Disabled", variant: "error" },
  draft: { label: "Draft", variant: "navy" },
  pending_review: { label: "Pending Review", variant: "warning" },
  published: { label: "Published", variant: "success" },
  rejected: { label: "Rejected", variant: "error" },
  new: { label: "New", variant: "gold" },
  read: { label: "Read", variant: "navy" },
  archived: { label: "Archived", variant: "navy" },
};

export function StatusBadge({ status }: { status: string }) {
  const config = STATUS_STYLES[status] ?? { label: status, variant: "navy" as TagVariant };
  return <Tag variant={config.variant}>{config.label}</Tag>;
}
