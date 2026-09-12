"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { SITE_SETTINGS_FIELDS } from "@/lib/validations/settings";
import { updateSiteSettingsAction } from "@/actions/settings";
import { Button, Input } from "@/components/ui";

interface SettingsFormProps {
  initialValues: Record<string, string>;
}

function groupBySection() {
  const groups = new Map<string, typeof SITE_SETTINGS_FIELDS[number][]>();
  for (const field of SITE_SETTINGS_FIELDS) {
    const list = groups.get(field.section) ?? [];
    list.push(field);
    groups.set(field.section, list);
  }
  return Array.from(groups.entries());
}

export function SettingsForm({ initialValues }: SettingsFormProps) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const sections = groupBySection();

  const { register, handleSubmit } = useForm<Record<string, string>>({
    defaultValues: initialValues,
  });

  function onSubmit(values: Record<string, string>) {
    setMessage(null);
    startTransition(async () => {
      const result = await updateSiteSettingsAction({ values });
      if (!result.success) {
        setMessage({ type: "error", text: result.error ?? "Could not save settings." });
        return;
      }
      setMessage({ type: "success", text: "Settings saved." });
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-[640px]">
      {sections.map(([section, fields]) => (
        <div key={section} className="mb-8">
          <h2 className="mb-4 text-[14px] font-semibold uppercase tracking-wide text-gray-700">
            {section}
          </h2>
          {fields.map((field) =>
            field.multiline ? (
              <div key={field.key} className="mb-4">
                <label htmlFor={field.key} className="mb-1.5 block text-[13px] font-semibold text-ink-900">
                  {field.label}
                </label>
                <textarea
                  id={field.key}
                  rows={4}
                  className="w-full rounded-sm border-[1.5px] border-gray-300 px-3.5 py-[11px] font-sans text-small text-ink-900 focus:border-navy-700 focus:outline-none focus:ring-4 focus:ring-navy-100"
                  {...register(field.key)}
                />
                {field.helpText && <p className="mt-1 text-[12px] text-gray-500">{field.helpText}</p>}
              </div>
            ) : (
              <Input key={field.key} id={field.key} label={field.label} message={field.helpText} {...register(field.key)} />
            )
          )}
        </div>
      ))}

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
        {isPending ? "Saving…" : "Save all settings"}
      </Button>
    </form>
  );
}
