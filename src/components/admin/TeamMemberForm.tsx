"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { JSONContent } from "@tiptap/react";
import { createTeamMemberSchema } from "@/lib/validations/team";
import { createTeamMemberAction, updateTeamMemberAction } from "@/actions/team";
import { Button, Input } from "@/components/ui";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { slugify } from "@/lib/utils";
import type { TeamMemberWithPracticeAreas, PracticeArea } from "@/types/domain";

interface TeamMemberFormProps {
  mode: "create" | "edit";
  initialValues?: TeamMemberWithPracticeAreas;
  practiceAreas: Pick<PracticeArea, "id" | "title">[];
}

type FormValues = {
  name: string;
  slug: string;
  designation: string;
  photoUrl: string;
  bio: JSONContent | null;
  email: string;
  phone: string;
  linkedinUrl: string;
  status: "draft" | "published";
  seoTitle: string;
  seoDescription: string;
  practiceAreaIds: string[];
};

export function TeamMemberForm({ mode, initialValues, practiceAreas }: TeamMemberFormProps) {
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
    resolver: zodResolver(createTeamMemberSchema),
    defaultValues: {
      name: initialValues?.name ?? "",
      slug: initialValues?.slug ?? "",
      designation: initialValues?.designation ?? "",
      photoUrl: initialValues?.photo_url ?? "",
      bio: (initialValues?.bio as JSONContent | null) ?? null,
      email: initialValues?.email ?? "",
      phone: initialValues?.phone ?? "",
      linkedinUrl: initialValues?.linkedin_url ?? "",
      status: initialValues?.status ?? "draft",
      seoTitle: initialValues?.seo_title ?? "",
      seoDescription: initialValues?.seo_description ?? "",
      practiceAreaIds: initialValues?.practiceAreaIds ?? [],
    },
  });

  function onSubmit(values: FormValues) {
    setFormError(null);
    startTransition(async () => {
      const result =
        mode === "create"
          ? await createTeamMemberAction(values)
          : await updateTeamMemberAction({ id: initialValues!.id, ...values });

      if (!result.success) {
        setFormError(result.error ?? "Something went wrong.");
        return;
      }
      router.push("/admin/team");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="max-w-[640px]">
      <Input
        label="Name"
        state={errors.name ? "error" : "default"}
        message={errors.name?.message}
        {...register("name", {
          onChange: (e) => {
            if (!slugTouched) setValue("slug", slugify(e.target.value));
          },
        })}
      />

      <Input
        label="Slug"
        state={errors.slug ? "error" : "default"}
        message={errors.slug?.message ?? `/team/${watch("slug") || "…"}`}
        {...register("slug", { onChange: () => setSlugTouched(true) })}
      />

      <Input label="Designation" state={errors.designation ? "error" : "default"} message={errors.designation?.message} {...register("designation")} />

      <Controller
        control={control}
        name="photoUrl"
        render={({ field }) => (
          <ImageUploadField
            label="Photo"
            context="team"
            value={field.value || null}
            onChange={field.onChange}
            helpText="Falls back to the team-avatar placeholder until a photo is uploaded."
          />
        )}
      />

      <div className="mb-4">
        <label className="mb-1.5 block text-[13px] font-semibold text-ink-900">Bio</label>
        <Controller
          control={control}
          name="bio"
          render={({ field }) => <RichTextEditor value={field.value} onChange={field.onChange} uploadContext="insights/content" />}
        />
      </div>

      <Input label="Email" state={errors.email ? "error" : "default"} message={errors.email?.message} {...register("email")} />
      <Input label="Phone" state={errors.phone ? "error" : "default"} message={errors.phone?.message} {...register("phone")} />
      <Input label="LinkedIn URL" state={errors.linkedinUrl ? "error" : "default"} message={errors.linkedinUrl?.message} {...register("linkedinUrl")} />

      <div className="mb-4">
        <label className="mb-2 block text-[13px] font-semibold text-ink-900">Practice areas</label>
        <Controller
          control={control}
          name="practiceAreaIds"
          render={({ field }) => (
            <div className="space-y-1.5">
              {practiceAreas.length === 0 && <p className="text-[13px] text-gray-500">No practice areas yet.</p>}
              {practiceAreas.map((pa) => (
                <label key={pa.id} className="flex items-center gap-2 text-[13px] text-ink-900">
                  <input
                    type="checkbox"
                    checked={field.value.includes(pa.id)}
                    onChange={(e) =>
                      field.onChange(e.target.checked ? [...field.value, pa.id] : field.value.filter((v) => v !== pa.id))
                    }
                  />
                  {pa.title}
                </label>
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
      <Input label="SEO title" {...register("seoTitle")} />
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
        {isPending ? "Saving…" : mode === "create" ? "Create team member" : "Save changes"}
      </Button>
    </form>
  );
}
