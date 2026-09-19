import { forwardRef, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

// Every <select> across the app (public filters, admin forms) used to
// repeat this exact className string by hand. Native <select> elements
// render their own browser/OS arrow flush against the right edge with no
// reserved space, which is why it always looked "stuck" to the edge no
// matter how much left padding the text had. `appearance-none` removes that
// native arrow everywhere, and this SVG chevron (navy, matching the design
// system) is positioned with real breathing room via `pr-9` + an explicit
// background-position, so left and right padding finally feel symmetric.
const CHEVRON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='none' stroke='%23133458' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M5 7.5L10 12.5L15 7.5'/%3E%3C/svg%3E";

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, style, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        "w-full appearance-none rounded-sm border-[1.5px] border-gray-300 bg-white bg-no-repeat py-[11px] pl-3.5 pr-9 font-sans text-small text-ink-900",
        "focus:border-navy-700 focus:outline-none focus:ring-4 focus:ring-navy-100",
        className
      )}
      style={{
        backgroundImage: `url("${CHEVRON}")`,
        backgroundPosition: "right 0.75rem center",
        backgroundSize: "14px",
        ...style,
      }}
      {...props}
    >
      {children}
    </select>
  )
);
Select.displayName = "Select";
