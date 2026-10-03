import Image from "next/image";
import Link from "next/link";
import { ASSETS } from "@/config/assets";
import type { TeamMember } from "@/types/domain";

// Extracted from (marketing)/team/page.tsx so any page showing a set of
// team members (the team listing itself, and now the practice-area detail
// page's "who handles this" section) renders the exact same card — one
// component to keep in sync, not two hand-matched copies that can drift.
export function TeamGrid({ members }: { members: TeamMember[] }) {
  return (
    <div className="grid grid-cols-2 gap-6 tablet:grid-cols-3 desktop:grid-cols-4">
      {members.map((member) => (
        <Link
          key={member.id}
          href={`/team/${member.slug}`}
          className="block overflow-hidden rounded-lg border border-gray-300 bg-white transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="relative aspect-[1/1] w-full bg-navy-100">
            {/* Phase 6 §6: CSS-only grayscale, not baked into the stored
                file — trivially reversible (drop the `grayscale` class)
                if the client wants color later. */}
            <Image
              src={member.photo_url ?? ASSETS.teamAvatarPlaceholder}
              alt={member.name}
              fill
              className="object-cover object-top grayscale"
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
