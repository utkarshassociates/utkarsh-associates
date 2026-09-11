import Image from "next/image";
import { Button, Tag, Input, PracticeAreaCard, StatStrip } from "@/components/ui";
import { ASSETS } from "@/config/assets";

// This is a Phase 1 theme/component check, not the real Home page —
// the actual Home layout is built in Phase 4 (Public site).
export default function ThemeCheckPage() {
  return (
    <main className="mx-auto max-w-wide px-6 py-16">
      <Image src={ASSETS.logo} alt="Utkarsh Associates" width={160} height={40} />

      <h1 className="mt-8 font-serif text-h1 text-navy-700">Design tokens, live</h1>
      <p className="mt-2 max-w-[560px] text-body-l text-gray-700">
        Phase 1 checkpoint — every value below is pulled from the Tailwind theme
        generated off the design system, not hand-typed.
      </p>

      <StatStrip
        stats={[
          { num: "15+", label: "Years" },
          { num: "3", label: "Jurisdictions" },
          { num: "200+", label: "Clients Served" },
        ]}
      />

      <div className="mt-8 flex flex-wrap items-center gap-4">
        <Button variant="primary">Contact Us</Button>
        <Button variant="gold">Get Started</Button>
        <Button variant="outline">View Services</Button>
        <Button variant="ghost">Learn more</Button>
        <Button variant="primary" disabled>
          Submit
        </Button>
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        <Tag variant="navy">Cross-Border</Tag>
        <Tag variant="gold">New Practice</Tag>
        <Tag variant="success">Available</Tag>
        <Tag variant="warning">By Invitation</Tag>
        <Tag variant="error">Closed</Tag>
      </div>

      <div className="mt-8 grid gap-4 tablet:grid-cols-2 desktop:grid-cols-3">
        <PracticeAreaCard
          title="Litigation & Dispute Resolution"
          description="Representing clients across civil, commercial, and constitutional litigation."
          href="/practice-areas/litigation"
          icon={
            <img src="/illustrations/practice-icons/litigation.svg" alt="" width={40} height={40} />
          }
        />
      </div>

      <div className="mt-8 max-w-[360px]">
        <Input label="Email address" placeholder="you@company.com" />
        <Input label="Email address" defaultValue="not-an-email" state="error" message="Enter a valid email address." />
        <Input
          label="Email address"
          defaultValue="hello@utkarshassociates.com"
          state="success"
          message="Looks good."
        />
      </div>
    </main>
  );
}
