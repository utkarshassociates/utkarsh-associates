"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contactDetailsSchema, type ContactDetailsInput } from "@/lib/validations/contact-details";
import { updateContactDetailsAction } from "@/actions/contact-details";
import { Button, Input } from "@/components/ui";

export function ContactDetailsForm({ initialValues }: { initialValues: ContactDetailsInput }) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ContactDetailsInput>({
    resolver: zodResolver(contactDetailsSchema),
    defaultValues: initialValues,
  });

  function onSubmit(values: ContactDetailsInput) {
    setMessage(null);
    startTransition(async () => {
      const result = await updateContactDetailsAction(values);
      setMessage(
        result.success
          ? { type: "success", text: "Saved. The public site now shows these details." }
          : { type: "error", text: result.error ?? "Could not save." }
      );
    });
  }

  const check = "flex items-center gap-2 text-[13px] text-ink-900";

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="max-w-[420px]">
      <Input label="Office phone" state={errors.phone ? "error" : "default"} message={errors.phone?.message} {...register("phone")} />
      <label className={`${check} -mt-2 mb-6`}>
        <input type="checkbox" {...register("showPhone")} />
        Show phone number on the website
      </label>

      <Input label="Office email" state={errors.email ? "error" : "default"} message={errors.email?.message} {...register("email")} />
      <label className={`${check} -mt-2 mb-6`}>
        <input type="checkbox" {...register("showEmail")} />
        Show email address on the website
      </label>

      {message && (
        <div
          className={`mb-4 rounded-sm border px-3.5 py-3 text-[13px] ${
            message.type === "success" ? "border-success bg-success-bg text-success" : "border-error bg-error-bg text-error"
          }`}
        >
          {message.text}
        </div>
      )}
      <Button type="submit" variant="primary" disabled={isPending}>
        {isPending ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}
