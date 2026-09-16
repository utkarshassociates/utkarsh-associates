import type { Metadata } from "next";
import { PracticeAreaCard } from "@/components/ui";
import { getPublishedPracticeAreas } from "@/lib/data/public";
import { getPracticeIconSrc } from "@/lib/utils";

export const revalidate = 3600;

const DESCRIPTION = "Full-service counsel across the practice areas that matter most to our clients.";

export const metadata: Metadata = {
  title: "Practice Areas",
  description: DESCRIPTION,
  alternates: { canonical: "/practice-areas" },
  openGraph: { title: "Practice Areas", description: DESCRIPTION, url: "/practice-areas", type: "website" },
};

export default async function PracticeAreasPage() {
  const practiceAreas = await getPublishedPracticeAreas();

  return (
    <div className="mx-auto max-w-wide px-4 py-16 tablet:px-8 desktop:px-16">
      <h1 className="font-serif text-h1 text-navy-700">Practice Areas</h1>
      <p className="mt-4 max-w-[560px] text-body-l text-gray-700">
        Full-service counsel across the practice areas that matter most to our clients.
      </p>

      {practiceAreas.length === 0 ? (
        <p className="mt-12 text-body text-gray-700">Practice area details are being updated — please check back soon.</p>
      ) : (
        <div className="mt-12 grid gap-4 tablet:grid-cols-2 desktop:grid-cols-3">
          {practiceAreas.map((pa) => (
            <PracticeAreaCard
              key={pa.id}
              title={pa.title}
              description={pa.short_description ?? ""}
              href={`/practice-areas/${pa.slug}`}
              icon={<img src={getPracticeIconSrc(pa.icon_key)} alt="" width={40} height={40} />}
            />
          ))}
        </div>
      )}
    </div>
  );
}
