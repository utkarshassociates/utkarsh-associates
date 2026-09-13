"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createOfficeSchema } from "@/lib/validations/office";
import { createOfficeAction, updateOfficeAction } from "@/actions/offices";
import { Button, Input } from "@/components/ui";
import type { Office } from "@/types/domain";

interface OfficeFormProps {
  mode: "create" | "edit";
  initialValues?: Office;
}

type FormValues = {
  name: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  mapEmbedUrl: string;
  isHeadquarters: boolean;
};

export function OfficeForm({ mode, initialValues }: OfficeFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(createOfficeSchema),
    defaultValues: {
      name: initialValues?.name ?? "",
      address: initialValues?.address ?? "",
      city: initialValues?.city ?? "",
      phone: initialValues?.phone ?? "",
      email: initialValues?.email ?? "",
      mapEmbedUrl: initialValues?.map_embed_url ?? "",
      isHeadquarters: initialValues?.is_headquarters ?? false,
    },
  });

  function onSubmit(values: FormValues) {
    setFormError(null);
    startTransition(async () => {
      const result =
        mode === "create" ? await createOfficeAction(values) : await updateOfficeAction({ id: initialValues!.id, ...values });

      if (!result.success) {
        setFormError(result.error ?? "Something went wrong.");
        return;
      }
      router.push("/admin/offices");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="max-w-[480px]">
      <Input label="Name" state={errors.name ? "error" : "default"} message={errors.name?.message} {...register("name")} />

      <div className="mb-4">
        <label className="mb-1.5 block text-[13px] font-semibold text-ink-900">Address</label>
        <textarea
          {...register("address")}
          rows={3}
          className="w-full rounded-sm border-[1.5px] border-gray-300 px-3.5 py-[11px] font-sans text-small text-ink-900 focus:border-navy-700 focus:outline-none focus:ring-4 focus:ring-navy-100"
        />
      </div>

      <Input label="City" {...register("city")} />
      <Input label="Phone" {...register("phone")} />
      <Input label="Email" state={errors.email ? "error" : "default"} message={errors.email?.message} {...register("email")} />
      <Input
        label="Map embed URL"
        message="Google Maps embed src URL."
        {...register("mapEmbedUrl")}
      />

      <label className="mb-6 flex items-center gap-2 text-[13px] font-medium text-ink-900">
        <input type="checkbox" {...register("isHeadquarters")} />
        Headquarters
      </label>

      {formError && (
        <div className="mb-4 rounded-sm border border-error bg-error-bg px-3.5 py-3 text-[13px] text-error">{formError}</div>
      )}

      <Button type="submit" variant="primary" disabled={isPending}>
        {isPending ? "Saving…" : mode === "create" ? "Create office" : "Save changes"}
      </Button>
    </form>
  );
}
