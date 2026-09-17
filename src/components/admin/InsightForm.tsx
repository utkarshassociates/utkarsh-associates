"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { JSONContent } from "@tiptap/react";
import { insightFormSchema } from "@/lib/validations/insight";
import { createInsightAction, updateInsightAction, createCategoryAction } from "@/actions/insights";
import { Button, Input } from "@/components/ui";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { slugify } from "@/lib/utils";
import type { InsightWithRelations, InsightCategory, TeamMember, PracticeArea } from "@/types/domain";

interface InsightFormProps {
  mode: "create" | "edit";
  initialValues?: InsightWithRelations;
  categories: InsightCategory[];
  teamMembers: Pick<TeamMember, "id" | "name">[];
  practiceAreas: Pick<PracticeArea, "id" | "title">[];
}

type FormValues = {
  title: string;
  slug: string;
  excerpt: string;
  coverImageUrl: string;
  categoryId: string;
  authorId: string;
  practiceAreaId: string;
  postType: "original" | "external_link";
  content: JSONContent | null;
  externalUrl: string;
  sourceName: string;
  tagsInput: string; // comma-separated in the UI, split into tags[] on submit
  seoTitle: string;
  seoDescription: string;
};

export function InsightForm({ mode, initialValues, categories: initialCategories, teamMembers, practiceAreas }: InsightFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [categories, setCategories] = useState(initialCategories);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [categoryError, setCategoryError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(insightFormSchema),
    defaultValues: {
      title: initialValues?.title ?? "",
      slug: initialValues?.slug ?? "",
      excerpt: initialValues?.excerpt ?? "",
      coverImageUrl: initialValues?.cover_image_url ?? "",
      categoryId: initialValues?.category_id ?? "",
      authorId: initialValues?.author_id ?? "",
      practiceAreaId: initialValues?.practice_area_id ?? "",
      postType: initialValues?.post_type ?? "original",
      content: (initialValues?.content as JSONContent | null) ?? null,
      externalUrl: initialValues?.external_url ?? "",
      sourceName: initialValues?.source_name ?? "",
      tagsInput: (initialValues?.tags ?? []).join(", "),
      seoTitle: initialValues?.seo_title ?? "",
      seoDescription: initialValues?.seo_description ?? "",
    },
  });

  const postType = watch("postType");

  async function handleAddCategory() {
    if (!newCategoryName.trim()) return;
    setCategoryError(null);
    const slug = slugify(newCategoryName);
    const result = await createCategoryAction({ name: newCategoryName.trim(), slug });
    if (!result.success || !result.categoryId) {
      setCategoryError(result.error ?? "Could not add category.");
      return;
    }
    setCategories((prev) => [...prev, { id: result.categoryId!, name: newCategoryName.trim(), slug }]);
    setValue("categoryId", result.categoryId);
    setNewCategoryName("");
    setIsAddingCategory(false);
  }

  function submitWithStatus(values: FormValues, status: "draft" | "pending_review") {
    setFormError(null);
    const tags = values.tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const payload = {
      title: values.title,
      slug: values.slug,
      excerpt: values.excerpt,
      coverImageUrl: values.coverImageUrl,
      categoryId: values.categoryId || null,
      authorId: values.authorId || null,
      practiceAreaId: values.practiceAreaId || null,
      postType: values.postType,
      content: values.content,
      externalUrl: values.externalUrl,
      sourceName: values.sourceName,
      tags,
      seoTitle: values.seoTitle,
      seoDescription: values.seoDescription,
      status,
    };

    startTransition(async () => {
      const result =
        mode === "create"
          ? await createInsightAction(payload)
          : await updateInsightAction({ id: initialValues!.id, ...payload });

      if (!result.success) {
        setFormError(result.error ?? "Something went wrong.");
        return;
      }
      router.push("/admin/insights");
      router.refresh();
    });
  }

  return (
    <form noValidate className="max-w-[720px]">
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
        message={errors.slug?.message ?? `/insights/${watch("slug") || "…"}`}
        {...register("slug", { onChange: () => setSlugTouched(true) })}
      />

      <div className="mb-4">
        <label className="mb-1.5 block text-[13px] font-semibold text-ink-900">Excerpt</label>
        <textarea
          {...register("excerpt")}
          rows={2}
          placeholder="Shown on the /insights listing card, and as the full content for external-link posts."
          className="w-full rounded-sm border-[1.5px] border-gray-300 px-3.5 py-[11px] font-sans text-small text-ink-900 focus:border-navy-700 focus:outline-none focus:ring-4 focus:ring-navy-100"
        />
      </div>

      <Controller
        control={control}
        name="coverImageUrl"
        render={({ field }) => (
          <ImageUploadField label="Cover image" context="insights/cover" value={field.value || null} onChange={field.onChange} />
        )}
      />

      {/* Responsive audit fix: single column on mobile, 3 columns from tablet
          (768px) up — was a fixed grid-cols-3 with no breakpoint prefix,
          which crammed three selects into one row on narrow screens. */}
      <div className="mb-4 grid grid-cols-1 gap-4 tablet:grid-cols-3">
        <div>
          <label className="mb-1.5 block text-[13px] font-semibold text-ink-900">Category</label>
          <select
            {...register("categoryId")}
            className="w-full rounded-sm border-[1.5px] border-gray-300 px-3.5 py-[11px] font-sans text-small text-ink-900 focus:border-navy-700 focus:outline-none focus:ring-4 focus:ring-navy-100"
          >
            <option value="">— None —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {!isAddingCategory ? (
            <button
              type="button"
              onClick={() => setIsAddingCategory(true)}
              className="mt-1.5 text-[12px] font-semibold text-navy-700 hover:text-gold-700"
            >
              + Add new category
            </button>
          ) : (
            <div className="mt-2 flex items-center gap-2">
              <input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="New category name"
                className="flex-1 rounded-sm border-[1.5px] border-gray-300 px-2.5 py-1.5 text-[13px] focus:border-navy-700 focus:outline-none"
              />
              <button type="button" onClick={handleAddCategory} className="text-[12px] font-semibold text-navy-700 hover:text-gold-700">
                Add
              </button>
              <button type="button" onClick={() => setIsAddingCategory(false)} className="text-[12px] text-gray-500">
                Cancel
              </button>
            </div>
          )}
          {categoryError && <p className="mt-1 text-[12px] text-error">{categoryError}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-[13px] font-semibold text-ink-900">Author</label>
          <select
            {...register("authorId")}
            className="w-full rounded-sm border-[1.5px] border-gray-300 px-3.5 py-[11px] font-sans text-small text-ink-900 focus:border-navy-700 focus:outline-none focus:ring-4 focus:ring-navy-100"
          >
            <option value="">— None —</option>
            {teamMembers.map((tm) => (
              <option key={tm.id} value={tm.id}>
                {tm.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-[13px] font-semibold text-ink-900">Related practice area</label>
          <select
            {...register("practiceAreaId")}
            className="w-full rounded-sm border-[1.5px] border-gray-300 px-3.5 py-[11px] font-sans text-small text-ink-900 focus:border-navy-700 focus:outline-none focus:ring-4 focus:ring-navy-100"
          >
            <option value="">— None —</option>
            {practiceAreas.map((pa) => (
              <option key={pa.id} value={pa.id}>
                {pa.title}
              </option>
            ))}
          </select>
          <p className="mt-1.5 text-[12px] text-gray-500">Optional — powers the &quot;Related Insights&quot; section on that practice area&apos;s page.</p>
        </div>
      </div>

      <Input label="Tags" message="Comma-separated, e.g. mergers, cross-border, m&a" {...register("tagsInput")} />

      <div className="mb-4">
        <label className="mb-2 block text-[13px] font-semibold text-ink-900">Post type</label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-[13px] text-ink-900">
            <input type="radio" value="original" {...register("postType")} />
            Original — full content hosted here
          </label>
          <label className="flex items-center gap-2 text-[13px] text-ink-900">
            <input type="radio" value="external_link" {...register("postType")} />
            External link — excerpt + link out
          </label>
        </div>
      </div>

      {postType === "original" ? (
        <div className="mb-4">
          <label className="mb-1.5 block text-[13px] font-semibold text-ink-900">Content</label>
          <Controller
            control={control}
            name="content"
            render={({ field }) => <RichTextEditor value={field.value} onChange={field.onChange} uploadContext="insights/content" />}
          />
        </div>
      ) : (
        <div className="mb-4 grid grid-cols-1 gap-4 rounded-md border border-gray-300 bg-gray-100 p-4 tablet:grid-cols-2">
          <Input
            label="External URL"
            state={errors.externalUrl ? "error" : "default"}
            message={errors.externalUrl?.message}
            placeholder="https://..."
            {...register("externalUrl")}
          />
          <Input
            label="Source name"
            state={errors.sourceName ? "error" : "default"}
            message={errors.sourceName?.message}
            placeholder="e.g. LinkedIn, Bar & Bench"
            {...register("sourceName")}
          />
        </div>
      )}

      <h3 className="mb-3 text-[14px] font-semibold uppercase tracking-wide text-gray-700">SEO</h3>
      <Input label="SEO title" {...register("seoTitle")} />
      <div className="mb-6">
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

      {/* Both buttons are available to anyone who can reach this form at
          all — an owning admin can freely move between draft and
          pending_review. Publishing/rejecting from pending_review is a
          separate, insights.publish-gated action (see InsightReviewPanel),
          not part of this form. */}
      <div className="flex gap-3">
        <Button type="button" variant="outline" disabled={isPending} onClick={handleSubmit((v) => submitWithStatus(v, "draft"))}>
          {isPending ? "Saving…" : "Save as draft"}
        </Button>
        <Button type="button" variant="primary" disabled={isPending} onClick={handleSubmit((v) => submitWithStatus(v, "pending_review"))}>
          {isPending ? "Saving…" : "Submit for review"}
        </Button>
      </div>
    </form>
  );
}
