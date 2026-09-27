interface Stat {
  num: string;
  label: string;
}

// Matches design-system.html .stat-strip exactly.
export function StatStrip({ stats }: { stats: Stat[] }) {
  return (
    <div className="flex flex-wrap gap-8 py-6">
      {stats.map((s) => (
        <div key={s.label}>
          <div className="font-serif text-[24px] font-medium leading-none text-navy-700">{s.num}</div>
          <div className="mt-1 text-[12px] uppercase tracking-wide text-gray-700">{s.label}</div>
        </div>
      ))}
    </div>
  );
}
