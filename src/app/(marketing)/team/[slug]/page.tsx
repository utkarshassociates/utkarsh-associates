import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Tag } from "@/components/ui";
import { RichTextRenderer } from "@/components/shared/RichTextRenderer";
import { ASSETS } from "@/config/assets";
import { getPracticeAreasByIds, getTeamMemberBySlug } from "@/lib/data/public";

export default async function TeamMemberDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const member = await getTeamMemberBySlug(slug);
  if (!member) notFound();

  const linkedPracticeAreas = await getPracticeAreasByIds(member.practiceAreaIds);

  return (
    <div className="mx-auto max-w-wide px-4 py-16 tablet:px-8 desktop:px-16">
      <Link href="/team" className="text-small font-semibold text-navy-700 hover:text-gold-700">
        ← All Team
      </Link>

      <div className="mt-6 grid gap-10 desktop:grid-cols-[280px_1fr]">
        <div>
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-lg bg-navy-100">
            <Image
              src={member.photo_url ?? ASSETS.teamAvatarPlaceholder}
              alt={member.name}
              fill
              className="object-cover"
              sizes="280px"
            />
          </div>

          <div className="mt-6 flex flex-col gap-2">
            {member.phone && (
              <a href={`tel:${member.phone.replace(/\s+/g, "")}`} className="text-small font-semibold text-navy-700 hover:text-gold-700">
                {member.phone}
              </a>
            )}
            {member.email && (
              <a href={`mailto:${member.email}`} className="text-small font-semibold text-navy-700 hover:text-gold-700">
                {member.email}
              </a>
            )}
            {member.linkedin_url && (
              <a
                href={member.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-small font-semibold text-navy-700 hover:text-gold-700"
              >
                LinkedIn →
              </a>
            )}
          </div>

          {linkedPracticeAreas.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {linkedPracticeAreas.map((pa) => (
                <Link key={pa.id} href={`/practice-areas/${pa.slug}`}>
                  <Tag variant="navy">{pa.title}</Tag>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div>
          <h1 className="font-serif text-h1 text-navy-700">{member.name}</h1>
          {member.designation && <p className="mt-2 text-body-l text-gray-700">{member.designation}</p>}
          <div className="mt-8 max-w-[640px]">
            <RichTextRenderer content={member.bio} />
          </div>
        </div>
      </div>
    </div>
  );
}
