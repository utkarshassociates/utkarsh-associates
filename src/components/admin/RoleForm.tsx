"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createRoleSchema, updateRolePermissionsSchema } from "@/lib/validations/role";
import { createRoleAction, updateRolePermissionsAction } from "@/actions/roles";
import { Button, Input } from "@/components/ui";
import type { Permission } from "@/config/permissions";
import type { PermissionRow } from "@/types/domain";

interface RoleFormProps {
  mode: "create" | "edit";
  permissions: PermissionRow[];
  initialValues?: {
    roleId: string;
    name: string;
    slug: string;
    permissionKeys: Permission[];
  };
}

type FormValues = {
  name: string;
  slug: string;
  permissionKeys: Permission[];
};

function groupByCategory(permissions: PermissionRow[]) {
  const groups = new Map<string, PermissionRow[]>();
  for (const p of permissions) {
    const list = groups.get(p.category) ?? [];
    list.push(p);
    groups.set(p.category, list);
  }
  return Array.from(groups.entries());
}

export function RoleForm({ mode, permissions, initialValues }: RoleFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const groupedPermissions = groupByCategory(permissions);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(
      mode === "create" ? createRoleSchema : updateRolePermissionsSchema.omit({ roleId: true })
    ),
    defaultValues: {
      name: initialValues?.name ?? "",
      slug: initialValues?.slug ?? "",
      permissionKeys: initialValues?.permissionKeys ?? [],
    },
  });

  function onSubmit(values: FormValues) {
    setFormError(null);
    startTransition(async () => {
      const result =
        mode === "create"
          ? await createRoleAction({ name: values.name, slug: values.slug, permissionKeys: values.permissionKeys })
          : await updateRolePermissionsAction({
              roleId: initialValues!.roleId,
              name: values.name,
              permissionKeys: values.permissionKeys,
            });

      if (!result.success) {
        setFormError(result.error ?? "Something went wrong.");
        return;
      }
      router.push("/admin/roles");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="max-w-[480px]">
      <Input
        label="Role name"
        placeholder="Blog Admin"
        state={errors.name ? "error" : "default"}
        message={errors.name?.message}
        {...register("name")}
      />

      {mode === "create" && (
        <Input
          label="Slug"
          placeholder="blog-admin"
          state={errors.slug ? "error" : "default"}
          message={errors.slug?.message ?? "Lowercase, no spaces — used internally, not shown to admins."}
          {...register("slug")}
        />
      )}

      <div className="mb-6">
        <label className="mb-2 block text-[13px] font-semibold text-ink-900">Permissions</label>
        <Controller
          control={control}
          name="permissionKeys"
          render={({ field }) => (
            <div className="space-y-4">
              {groupedPermissions.map(([category, perms]) => (
                <div key={category}>
                  <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    {category}
                  </div>
                  <div className="space-y-1.5">
                    {perms.map((perm) => (
                      <label key={perm.key} className="flex items-center gap-2 text-[13px] text-ink-900">
                        <input
                          type="checkbox"
                          checked={field.value.includes(perm.key)}
                          onChange={(e) => {
                            field.onChange(
                              e.target.checked
                                ? [...field.value, perm.key]
                                : field.value.filter((k) => k !== perm.key)
                            );
                          }}
                        />
                        {perm.label}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        />
      </div>

      {formError && (
        <div className="mb-4 rounded-sm border border-error bg-error-bg px-3.5 py-3 text-[13px] text-error">
          {formError}
        </div>
      )}

      <Button type="submit" variant="primary" disabled={isPending}>
        {isPending ? "Saving…" : mode === "create" ? "Create role" : "Save changes"}
      </Button>
    </form>
  );
}
