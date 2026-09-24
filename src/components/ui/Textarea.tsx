import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  message?: string;
  state?: "default" | "error" | "success";
}

// Same field pattern as Input.tsx (label, border/focus states, message) —
// pulled out as its own component because every multi-line field in the
// admin (Excerpt, Short description, SEO description, rejection notes) was
// previously a bare <textarea> with no className at all, rendering as an
// unstyled browser-default box next to properly-styled <Input>/<Select>
// fields right beside it.
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, message, state = "default", id, className, rows = 3, ...props }, ref) => {
    const textareaId = id ?? label.toLowerCase().replace(/\s+/g, "-");
    const borderClass =
      state === "error"
        ? "border-error"
        : state === "success"
          ? "border-success"
          : "border-gray-300 focus:border-navy-700";

    return (
      <div className="mb-4">
        <label htmlFor={textareaId} className="mb-1.5 block text-[13px] font-semibold text-ink-900">
          {label}
        </label>
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          className={cn(
            "w-full resize-y rounded-sm border-[1.5px] px-3.5 py-[11px] font-sans text-small text-ink-900",
            "focus:outline-none focus:ring-4 focus:ring-navy-100",
            borderClass,
            className
          )}
          aria-invalid={state === "error"}
          aria-describedby={message ? `${textareaId}-msg` : undefined}
          {...props}
        />
        {message && (
          <div
            id={`${textareaId}-msg`}
            className={cn("mt-1 text-[12px]", state === "error" ? "text-error" : "text-success")}
          >
            {message}
          </div>
        )}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";
