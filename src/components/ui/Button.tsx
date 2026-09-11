import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "gold" | "outline" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

// Matches design-system.html .btn / .btn-primary / .btn-gold / .btn-outline /
// .btn-ghost / .btn-disabled exactly — pill radius, Inter 600 15px label.
const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-navy-700 text-white hover:bg-navy-900",
  gold: "bg-gold-500 text-navy-900 hover:bg-gold-700",
  outline: "bg-transparent text-navy-700 border-[1.5px] border-navy-700 hover:bg-navy-100",
  ghost: "bg-transparent text-navy-700 px-2 hover:text-gold-700",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", disabled, className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          "inline-flex items-center gap-2 rounded-pill font-sans text-button transition-colors duration-150",
          variant !== "ghost" && "px-7 py-[13px]",
          disabled
            ? "cursor-not-allowed bg-gray-300 text-gray-500 hover:bg-gray-300"
            : variantClasses[variant],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
