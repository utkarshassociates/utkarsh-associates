"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { submitContactAction } from "@/actions/contact";
import { contactFormSchema, type ContactFormValues } from "@/lib/validations/contact";
import type { PracticeArea } from "@/types/domain";
import { cn } from "@/lib/utils";

export function ContactForm({ practiceAreas }: { practiceAreas: PracticeArea[] }) {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: { name: "", email: "", phone: "", message: "", practiceAreaInterest: "", website: "" },
  });

  async function onSubmit(values: ContactFormValues) {
    setStatus("submitting");
    setServerError(null);
    const result = await submitContactAction(values);
    if (result.success) {
      setStatus("success");
      reset();
    } else {
      setStatus("error");
      setServerError(result.error ?? "Something went wrong. Please try again.");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-lg border border-success bg-success-bg p-6">
        <p className="font-serif text-h4 text-navy-700">Message sent.</p>
        <p className="mt-2 text-small text-gray-700">
          Thank you for reaching out — a member of our team will get back to you shortly.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="max-w-[480px]">
      {/* Honeypot — invisible to real users (offscreen, not display:none, and
          never labeled), catches bots that fill every field they find.
          Real users never see or interact with this. */}
      <div className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
        <label htmlFor="website">Leave this field empty</label>
        <input id="website" type="text" tabIndex={-1} autoComplete="off" {...register("website")} />
      </div>

      <Input
        label="Full name"
        {...register("name")}
        state={errors.name ? "error" : "default"}
        message={errors.name?.message}
      />
      <Input
        label="Email address"
        type="email"
        {...register("email")}
        state={errors.email ? "error" : "default"}
        message={errors.email?.message}
      />
      <Input
        label="Phone (optional)"
        type="tel"
        {...register("phone")}
        state={errors.phone ? "error" : "default"}
        message={errors.phone?.message}
      />

      <div className="mb-4">
        <label htmlFor="practice-area-interest" className="mb-1.5 block text-[13px] font-semibold text-ink-900">
          Practice area (optional)
        </label>
        <select
          id="practice-area-interest"
          {...register("practiceAreaInterest")}
          className="w-full rounded-sm border-[1.5px] border-gray-300 px-3.5 py-[11px] font-sans text-small text-ink-900 focus:border-navy-700 focus:outline-none focus:ring-4 focus:ring-navy-100"
        >
          <option value="">Not sure / general inquiry</option>
          {practiceAreas.map((pa) => (
            <option key={pa.id} value={pa.title}>
              {pa.title}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <label htmlFor="message" className="mb-1.5 block text-[13px] font-semibold text-ink-900">
          Message
        </label>
        <textarea
          id="message"
          rows={5}
          {...register("message")}
          className={cn(
            "w-full rounded-sm border-[1.5px] px-3.5 py-[11px] font-sans text-small text-ink-900",
            "focus:outline-none focus:ring-4 focus:ring-navy-100",
            errors.message ? "border-error" : "border-gray-300 focus:border-navy-700"
          )}
        />
        {errors.message && <div className="mt-1 text-[12px] text-error">{errors.message.message}</div>}
      </div>

      {status === "error" && serverError && (
        <div className="mb-4 rounded-sm border border-error bg-error-bg px-3.5 py-3 text-small text-error">
          {serverError}
        </div>
      )}

      <Button type="submit" variant="primary" disabled={status === "submitting"} className="w-full justify-center">
        {status === "submitting" ? "Sending…" : "Send Message"}
      </Button>
    </form>
  );
}
