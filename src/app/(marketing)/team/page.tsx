import type { Metadata } from "next";
import { EmptyState } from "@/components/shared/EmptyState";
import { TeamGrid } from "@/components/marketing/TeamGrid";
import { getPracticeAreaBySlug, getPublishedTeamMembers, getTeamMembersForPracticeArea } from "@/lib/data/public";
import type { TeamMember, TeamTier } from "@/types/domain";

// No `export const revalidate` here — this page reads `searchParams`
// (below), which opts it into per-request dynamic rendering in Next.js
// regardless of any revalidate config, so there's no static output for a
// time-based window to apply to. That's the correct behavior for a
// filtered listing anyway — see PHASE-5-NOTES.md's ISR section for why
// this was a deliberate omission, not an oversight.
export const metadata: Metadata = {
  title: "Our Team",
  description: "Meet the advocates and solicitors who advise our clients.",
  alternates: { canonical: "/team" },
  openGraph: { title: "Our Team", url: "/team", type: "website" },
};

// Phase 6 §6: leadership shown separately from counsel/general team. Each
// section only renders if it has at least one member — a firm with no
// "counsel" tier yet, for instance, just doesn't show that heading, rather
// than showing an empty one.
const TIER_SECTIONS: { tier: TeamTier; label: string }[] = [
  { tier: "leadership", label: "Leadership" },
  { tier: "counsel", label: "Counsel" },
  { tier: "team", label: "Team" },
];

export default async function TeamPage({
  searchParams,
}: {
  searchParams: Promise<{ practice_area?: string }>;
}) {
  const { practice_area: practiceAreaSlug } = await searchParams;

  let teamMembers: TeamMember[];
  if (practiceAreaSlug) {
    const practiceArea = await getPracticeAreaBySlug(practiceAreaSlug);
    teamMembers = practiceArea ? await getTeamMembersForPracticeArea(practiceArea.id) : [];
  } else {
    teamMembers = await getPublishedTeamMembers();
  }

  return (
    <div className="mx-auto max-w-wide px-4 py-16 tablet:px-8 desktop:px-16">
      <h1 className="font-serif text-h1 text-navy-700">Our Team</h1>
      <p className="mt-4 max-w-[560px] text-body-l text-gray-700">
        Meet the advocates and solicitors who advise our clients.
      </p>

      {teamMembers.length === 0 ? (
        <EmptyState
          title="No Team Members Found"
          description={practiceAreaSlug ? "No team members are linked to this practice area yet." : "Team member profiles are being added — please check back soon."}
        />
      ) : (
        <div className="space-y-12">
          {/* Filtered-by-practice-area view: one flat grid, no tier
              sections — the filter itself is already the organizing
              principle here, layering tier headings on top would just be
              visual noise for what's usually a handful of people. */}
          {practiceAreaSlug
            ? <TeamGrid members={teamMembers} />
            : TIER_SECTIONS.map(({ tier, label }) => {
                const members = teamMembers.filter((m) => m.tier === tier);
                if (members.length === 0) return null;
                return (
                  <div key={tier}>
                    <h2 className="mb-6 font-serif text-h3 text-navy-700">{label}</h2>
                    <TeamGrid members={members} />
                  </div>
                );
              })}
        </div>
      )}
    </div>
  );
}
