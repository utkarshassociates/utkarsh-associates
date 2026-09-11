import Link from "next/link";
import type { ReactNode } from "react";

interface PracticeAreaCardProps {
  title: string;
  description: string;
  href: string;
  icon: ReactNode; // an SVG matching the locked icon spec — see /public/illustrations/practice-icons
}

// Matches design-system.html .service-card exactly: lg radius, gray-300 border,
// hover lift + shadow, Newsreader h4 title, gold-accented card-link arrow.
export function PracticeAreaCard({ title, description, href, icon }: PracticeAreaCardProps) {
  return (
    <div className="rounded-lg border border-gray-300 bg-white p-6 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md">
      <div className="mb-4 h-10 w-10">{icon}</div>
      <h4 className="mb-2 font-serif text-h4 text-navy-700">{title}</h4>
      <p className="mb-4 text-small text-gray-700">{description}</p>
      <Link
        href={href}
        className="inline-flex items-center gap-1 text-[13px] font-semibold text-navy-700 hover:text-gold-700"
      >
        View practice →
      </Link>
    </div>
  );
}
