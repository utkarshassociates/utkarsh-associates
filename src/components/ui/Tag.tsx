import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type TagVariant = "navy" | "gold" | "success" | "error" | "warning";

interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: TagVariant;
}

// Matches design-system.html .pill-tag.tag-* exactly.
const variantClasses: Record<TagVariant, string> = {
  navy: "bg-navy-100 text-navy-700",
  gold: "bg-gold-100 text-gold-700",
  success: "bg-success-bg text-success",
  error: "bg-error-bg text-error",
  warning: "bg-warning-bg text-warning",
};

export function Tag({ variant = "navy", className, children, ...props }: TagProps) {
  return (
    <span
      className={cn(
        "inline-block whitespace-nowrap rounded-pill px-3 py-[5px] font-sans text-[12px] font-semibold",
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
