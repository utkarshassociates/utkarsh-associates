"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { JSONContent } from "@tiptap/react";
import { createPracticeAreaSchema } from "@/lib/validations/practice-area";
import { createPracticeAreaAction, updatePracticeAreaAction } from "@/actions/practice-areas";
import { Button, Input } from "@/components/ui";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { ASSETS } from "@/config/assets";
import { slugify } from "@/lib/utils";
import type { PracticeArea } from "@/types/domain";

interface PracticeAreaFormProps {
  mode: "create" | "edit";
  initialValues?: PracticeArea;
}

type FormValues = {
  title: string;
  slug: string;
  shortDescription: string;
  content: JSONContent | null;
  iconKey: string;
  status: "draft" | "published";
  seoTitle: string;
  seoDescription: string;
};

const iconKeys = Object.keys(ASSETS.practiceIcons) as (keyof typeof ASSETS.practiceIcons)[];

export function PracticeAreaForm({ mode, initialValues }: PracticeAreaFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(mode === "edit");

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(createPracticeAreaSchema),
    defaultValues: {
      title: initialValues?.title ?? "",
      slug: initialValues?.slug ?? "",
      shortDescription: initialValues?.short_description ?? "",
      content: (initialValues?.content as JSONContent | null) ?? null,
      iconKey: initialValues?.icon_key ?? iconKeys[0],
      status: initialValues?.status ?? "draft",
      seoTitle: initialValues?.seo_title ?? "",
      seoDescription: initialValues?.seo_description ?? "",
    },
  });

  function onSubmit(values: FormValues) {
    setFormError(null);
    startTransition(async () => {
      const result =
        mode === "create"
          ? await createPracticeAreaAction(values)
          : await updatePracticeAreaAction({ id: initialValues!.id, ...values });

      if (!result.success) {
        setFormError(result.error ?? "Something went wrong.");
        return;
      }
      router.push("/admin/practice-areas");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="max-w-[640px]">
      <Input
        label="Title"
        state={errors.title ? "error" : "default"}
        message={errors.title?.message}
        {...register("title", {
          onChange: (e) => {
            if (!slugTouched) setValue("slug", slugify(e.target.value));
          },
        })}
      />

      <Input
        label="Slug"
        state={errors.slug ? "error" : "default"}
        message={errors.slug?.message ?? `/practice-areas/${watch("slug") || "…"}`}
        {...register("slug", { onChange: () => setSlugTouched(true) })}
      />

      <div className="mb-4">
        <label className="mb-1.5 block text-[13px] font-semibold text-ink-900">Short description</label>
        <textarea
          {...register("shortDescription")}
          rows={2}
          className="w-full rounded-sm border-[1.5px] border-gray-300 px-3.5 py-[11px] font-sans text-small text-ink-900 focus:border-navy-700 focus:outline-none focus:ring-4 focus:ring-navy-100"
          placeholder="Shown on the Practice Area card — a sentence or two."
        />
      </div>

      <div className="mb-4">
        <label className="mb-1.5 block text-[13px] font-semibold text-ink-900">Full content</label>
        <Controller
          control={control}
          name="content"
          render={({ field }) => (
            <RichTextEditor value={field.value} onChange={field.onChange} uploadContext="insights/content" />
          )}
        />
      </div>

      <div className="mb-4">
        <label className="mb-1.5 block text-[13px] font-semibold text-ink-900">Icon</label>
        <p className="mb-2 text-[12px] text-gray-500">
          Locked set per the design system's icon spec — not an open upload field.
        </p>
        <Controller
          control={control}
          name="iconKey"
          render={({ field }) => (
            <div className="grid grid-cols-3 gap-2 tablet:grid-cols-6">
              {/* was `sm:grid-cols-6` — `sm` (640px) isn't one of this
                  project's breakpoints (the design system defines
                  tablet/desktop/wide, not Tailwind's stock `sm`); swapped to
                  `tablet:` to match every other responsive class here. */}
              {iconKeys.map((key) => (
                <button
                  type="button"
                  key={key}
                  onClick={() => field.onChange(key)}
                  className={`rounded-md border-2 px-2 py-3 text-center text-[11px] font-medium capitalize ${
                    field.value === key ? "border-navy-700 bg-navy-100 text-navy-700" : "border-gray-300 text-gray-700 hover:border-gray-500"
                  }`}
                >
                  {key.replace(/_/g, " ")}
                </button>
              ))}
            </div>
          )}
        />
      </div>

      <div className="mb-6">
        <label className="mb-1.5 block text-[13px] font-semibold text-ink-900">Status</label>
        <select
          {...register("status")}
          className="w-full max-w-[200px] rounded-sm border-[1.5px] border-gray-300 px-3.5 py-[11px] font-sans text-small text-ink-900 focus:border-navy-700 focus:outline-none focus:ring-4 focus:ring-navy-100"
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
      </div>

      <h3 className="mb-3 text-[14px] font-semibold uppercase tracking-wide text-gray-700">SEO</h3>
      <Input label="SEO title" state={errors.seoTitle ? "error" : "default"} message={errors.seoTitle?.message} {...register("seoTitle")} />
      <div className="mb-4">
        <label className="mb-1.5 block text-[13px] font-semibold text-ink-900">SEO description</label>
        <textarea
          {...register("seoDescription")}
          rows={2}
          className="w-full rounded-sm border-[1.5px] border-gray-300 px-3.5 py-[11px] font-sans text-small text-ink-900 focus:border-navy-700 focus:outline-none focus:ring-4 focus:ring-navy-100"
        />
      </div>

      {formError && (
        <div className="mb-4 rounded-sm border border-error bg-error-bg px-3.5 py-3 text-[13px] text-error">{formError}</div>
      )}

      <Button type="submit" variant="primary" disabled={isPending}>
        {isPending ? "Saving…" : mode === "create" ? "Create practice area" : "Save changes"}
      </Button>
    </form>
  );
}
