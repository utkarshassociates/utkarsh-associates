import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  message?: string;
  state?: "default" | "error" | "success";
}

// Matches design-system.html .field / .field.error / .field.success exactly.
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, message, state = "default", id, className, ...props }, ref) => {
    const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");
    const borderClass =
      state === "error"
        ? "border-error"
        : state === "success"
          ? "border-success"
          : "border-gray-300 focus:border-navy-700";

    return (
      <div className="mb-4">
        <label htmlFor={inputId} className="mb-1.5 block text-[13px] font-semibold text-ink-900">
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "w-full rounded-sm border-[1.5px] px-3.5 py-[11px] font-sans text-small text-ink-900",
            "focus:outline-none focus:ring-4 focus:ring-navy-100",
            borderClass,
            className
          )}
          aria-invalid={state === "error"}
          aria-describedby={message ? `${inputId}-msg` : undefined}
          {...props}
        />
        {message && (
          <div
            id={`${inputId}-msg`}
            className={cn("mt-1 text-[12px]", state === "error" ? "text-error" : "text-success")}
          >
            {message}
          </div>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";
