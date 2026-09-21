import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { EmptyState } from "@/components/shared/EmptyState";
import { ASSETS } from "@/config/assets";
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

function TeamGrid({ members }: { members: TeamMember[] }) {
  return (
    <div className="grid grid-cols-2 gap-6 tablet:grid-cols-3 desktop:grid-cols-4">
      {members.map((member) => (
        <Link
          key={member.id}
          href={`/team/${member.slug}`}
          className="block overflow-hidden rounded-lg border border-gray-300 bg-white transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="relative aspect-[4/3] w-full bg-navy-100">
            {/* Phase 6 §6: CSS-only grayscale, not baked into the stored
                file — trivially reversible (drop the `grayscale` class)
                if the client wants color later. */}
            <Image
              src={member.photo_url ?? ASSETS.teamAvatarPlaceholder}
              alt={member.name}
              fill
              className="object-cover grayscale"
              sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
            />
          </div>
          <div className="p-5">
            <h3 className="font-serif text-h4 text-navy-700">{member.name}</h3>
            {member.designation && <p className="mt-1 text-small text-gray-700">{member.designation}</p>}
          </div>
        </Link>
      ))}
    </div>
  );
}

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
