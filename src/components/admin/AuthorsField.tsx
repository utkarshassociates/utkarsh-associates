"use client";

import { Select } from "@/components/ui";

interface AuthorsFieldProps {
  /** Ordered team-member ids. Index 0 is the lead author. */
  value: string[];
  onChange: (ids: string[]) => void;
  teamMembers: { id: string; name: string }[];
}

/**
 * Multi-author picker for the Insight form: an ordered list (reorder/remove)
 * plus an "add" select of members not yet chosen. Order matters — the first
 * author is the lead (mirrored to insights.author_id on save).
 */
export function AuthorsField({ value, onChange, teamMembers }: AuthorsFieldProps) {
  const byId = new Map(teamMembers.map((m) => [m.id, m.name]));
  const remaining = teamMembers.filter((m) => !value.includes(m.id));

  function move(index: number, delta: -1 | 1) {
    const next = [...value];
    const target = index + delta;
    const a = next[index];
    const b = next[target];
    if (a === undefined || b === undefined) return;
    next[index] = b;
    next[target] = a;
    onChange(next);
  }

  const btn = "px-1.5 text-[12px] font-semibold text-navy-700 hover:text-gold-700 disabled:cursor-not-allowed disabled:text-gray-300";

  return (
    <div>
      <label className="mb-1.5 block text-[13px] font-semibold text-ink-900">Authors</label>

      {value.length > 0 && (
        <ul className="mb-2 flex flex-col gap-1.5">
          {value.map((id, i) => (
            <li key={id} className="flex items-center justify-between rounded-sm border border-gray-300 bg-white px-2.5 py-1.5 text-[13px] text-ink-900">
              <span className="min-w-0 truncate">
                {byId.get(id) ?? "Unknown member"}
                {i === 0 && value.length > 1 && <span className="ml-2 text-[11px] uppercase tracking-wide text-gray-500">Lead</span>}
              </span>
              <span className="flex shrink-0 items-center">
                <button type="button" className={btn} disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move author up">▲</button>
                <button type="button" className={btn} disabled={i === value.length - 1} onClick={() => move(i, 1)} aria-label="Move author down">▼</button>
                <button type="button" className={btn} onClick={() => onChange(value.filter((v) => v !== id))} aria-label="Remove author">✕</button>
              </span>
            </li>
          ))}
        </ul>
      )}

      {remaining.length > 0 && value.length < 10 && (
        <Select
          value=""
          onChange={(e) => {
            if (e.target.value) onChange([...value, e.target.value]);
          }}
        >
          <option value="">{value.length === 0 ? "— Add an author —" : "+ Add another author"}</option>
          {remaining.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </Select>
      )}
    </div>
  );
}
