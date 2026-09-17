"use client";

import { Button } from "@/components/ui";
import type { ContactSubmission } from "@/types/domain";

// Client-side CSV generation from the rows already loaded for the current
// status tab — no new API route or server-side CSV library needed for
// something this small, and it exports exactly what's currently on screen
// (i.e. respects whichever status tab is active), which is the more useful
// behavior for a superAdmin reviewing a specific batch rather than always
// dumping the entire table.
function toCsvValue(value: string | null): string {
  const v = value ?? "";
  if (v.includes(",") || v.includes('"') || v.includes("\n")) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}

export function ExportInquiriesButton({ submissions, filename }: { submissions: ContactSubmission[]; filename: string }) {
  function handleExport() {
    const headers = ["Name", "Email", "Phone", "Practice Area Interest", "Message", "Status", "Received"];
    const rows = submissions.map((s) =>
      [s.name, s.email, s.phone, s.practice_area_interest, s.message, s.status, s.created_at].map(toCsvValue).join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Button variant="outline" type="button" onClick={handleExport} disabled={submissions.length === 0}>
      Export CSV
    </Button>
  );
}
