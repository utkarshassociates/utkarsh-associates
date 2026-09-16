import type { Metadata } from "next";
import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { TeamFilter } from "@/components/marketing/TeamFilter";
import { ASSETS } from "@/config/assets";
import {
  getPracticeAreaBySlug,
  getPublishedPracticeAreas,
  getPublishedTeamMembers,
  getTeamMembersForPracticeArea,
} from "@/lib/data/public";

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

export default async function TeamPage({
  searchParams,
}: {
  searchParams: Promise<{ practice_area?: string }>;
}) {
  const { practice_area: practiceAreaSlug } = await searchParams;

  const practiceAreas = await getPublishedPracticeAreas();

  let teamMembers;
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

      <div className="mt-10">
        <Suspense fallback={<div className="mb-8 h-[70px] max-w-[280px]" />}>
          <TeamFilter practiceAreas={practiceAreas} />
        </Suspense>
      </div>

      {teamMembers.length === 0 ? (
        <p className="text-body text-gray-700">No team members found for this practice area.</p>
      ) : (
        <div className="grid gap-6 tablet:grid-cols-2 desktop:grid-cols-3">
          {teamMembers.map((member) => (
            <Link
              key={member.id}
              href={`/team/${member.slug}`}
              className="block overflow-hidden rounded-lg border border-gray-300 bg-white transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="relative aspect-[4/3] w-full bg-navy-100">
                <Image
                  src={member.photo_url ?? ASSETS.teamAvatarPlaceholder}
                  alt={member.name}
                  fill
                  className="object-cover"
                  sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                />
              </div>
              <div className="p-5">
                <h3 className="font-serif text-h4 text-navy-700">{member.name}</h3>
                {member.designation && <p className="mt-1 text-small text-gray-700">{member.designation}</p>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
