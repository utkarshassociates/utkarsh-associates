import Link from "next/link";
import type { ReactNode } from "react";

interface PracticeAreaCardProps {
  title: string;
  description: string;
  href: string;
  icon: ReactNode; // an <img> positioned via absolute inset-0 h-full w-full scale-150 object-cover object-top
}

// Matches design-system.html .service-card: lg radius, gray-300 border,
// hover lift + shadow, Newsreader h4 title, gold-accented card-link arrow.
//
// Icon treatment: image occupies a fixed-height band across the top of the
// card, edge-to-edge. The text block below is pulled up by 25% of that
// band's height, with a soft white gradient behind the overlap so copy
// stays legible regardless of what's in the artwork there. `overflow-hidden`
// is on the image band itself (not just the outer card) so a zoomed image
// (see the `scale-150` callers apply — the uploaded artwork sits on a much
// larger transparent canvas than the visible line-art, so a zoom is what
// actually makes the drawing fill the frame instead of the empty space
// around it) can never bleed down into the text below it.
export function PracticeAreaCard({ title, description, href, icon }: PracticeAreaCardProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-300 bg-white transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative h-44 w-full overflow-hidden">
        {icon}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent" />
      </div>
      <div className="relative -mt-11 px-6 pb-6">
        <h4 className="mb-2 font-serif text-h4 text-navy-700">{title}</h4>
        <p className="mb-4 text-small text-gray-700">{description}</p>
        <Link
          href={href}
          className="inline-flex items-center gap-1 text-[13px] font-semibold text-navy-700 hover:text-gold-700"
        >
          View practice →
        </Link>
      </div>
    </div>
  );
}
