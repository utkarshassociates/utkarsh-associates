"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createPracticeAreaSchema } from "@/lib/validations/practice-area";
import { createPracticeAreaAction, updatePracticeAreaAction } from "@/actions/practice-areas";
import { Button, Input, Select, Textarea } from "@/components/ui";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
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
  content: string | null;
  iconUrl: string;
  status: "draft" | "published";
  seoTitle: string;
  seoDescription: string;
};

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
      content: (initialValues?.content as string | null) ?? null,
      iconUrl: initialValues?.icon_url ?? "",
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
    // See InsightForm.tsx's identical comment — widened to actually use the
    // desktop admin layout's available width (capped at 1180px there)
    // instead of a flat 640px at every breakpoint.
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="max-w-[560px] desktop:max-w-[900px]">
      <div className="grid grid-cols-1 gap-x-6 desktop:grid-cols-2">
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
      </div>

      <Textarea
        label="Short description"
        rows={2}
        placeholder="Shown on the Practice Area card — a sentence or two."
        {...register("shortDescription")}
      />

      <div className="mb-4">
        <label className="mb-1.5 block text-[13px] font-semibold text-ink-900">Full content</label>
        <Controller
          control={control}
          name="content"
          render={({ field }) => (
            <RichTextEditor value={field.value} onChange={field.onChange} />
          )}
        />
      </div>

      <Controller
        control={control}
        name="iconUrl"
        render={({ field }) => (
          <ImageUploadField
            label="Icon"
            context="practice-areas"
            value={field.value || null}
            onChange={field.onChange}
            helpText="Optional — 1.5px navy line-art per the icon spec, transparent background. Falls back to a generic icon if left empty."
          />
        )}
      />

      <div className="mb-6">
        <label className="mb-1.5 block text-[13px] font-semibold text-ink-900">Status</label>
        <Select
          {...register("status")}
          className="max-w-[200px]"
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </Select>
      </div>

      <h3 className="mb-3 text-[14px] font-semibold uppercase tracking-wide text-gray-700">SEO</h3>
      <div className="grid grid-cols-1 gap-x-6 desktop:grid-cols-2">
        <Input label="SEO title" state={errors.seoTitle ? "error" : "default"} message={errors.seoTitle?.message} {...register("seoTitle")} />
        <Textarea label="SEO description" rows={2} {...register("seoDescription")} />
      </div>

      {formError && (
        <div className="mb-4 rounded-sm border border-error bg-error-bg px-3.5 py-3 text-[13px] text-error">{formError}</div>
      )}

      <Button type="submit" variant="primary" disabled={isPending}>
        {isPending ? "Saving…" : mode === "create" ? "Create Practice Area" : "Save Changes"}
      </Button>
    </form>
  );
}
