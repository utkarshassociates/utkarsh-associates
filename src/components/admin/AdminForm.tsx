"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createAdminSchema, updateAdminSchema } from "@/lib/validations/admin";
import { createAdminAction, updateAdminAction } from "@/actions/admins";
import { Button, Input } from "@/components/ui";
import type { Permission } from "@/config/permissions";
import type { PermissionRow, Role } from "@/types/domain";

interface AdminFormProps {
  mode: "create" | "edit";
  roles: Pick<Role, "id" | "name" | "slug" | "is_super">[];
  permissions: PermissionRow[];
  initialValues?: {
    adminId: string;
    loginId: string;
    name: string;
    roleId: string;
    extraPermissions: Permission[];
    status: "active" | "disabled";
  };
}

type FormValues = {
  loginId: string;
  name: string;
  roleId: string;
  password: string;
  status: "active" | "disabled";
  extraPermissions: Permission[];
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

export function AdminForm({ mode, roles, permissions, initialValues }: AdminFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const groupedPermissions = groupByCategory(permissions);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(mode === "create" ? createAdminSchema : updateAdminSchema.omit({ adminId: true })),
    defaultValues: {
      loginId: initialValues?.loginId ?? "",
      name: initialValues?.name ?? "",
      roleId: initialValues?.roleId ?? roles[0]?.id ?? "",
      password: "",
      status: initialValues?.status ?? "active",
      extraPermissions: initialValues?.extraPermissions ?? [],
    },
  });

  const selectedRoleId = watch("roleId");
  const selectedRole = roles.find((r) => r.id === selectedRoleId);

  function onSubmit(values: FormValues) {
    setFormError(null);
    startTransition(async () => {
      const result =
        mode === "create"
          ? await createAdminAction({
              loginId: values.loginId,
              name: values.name,
              roleId: values.roleId,
              password: values.password,
              extraPermissions: values.extraPermissions,
            })
          : await updateAdminAction({
              adminId: initialValues!.adminId,
              name: values.name,
              roleId: values.roleId,
              extraPermissions: values.extraPermissions,
              status: values.status,
            });

      if (!result.success) {
        setFormError(result.error ?? "Something went wrong.");
        return;
      }
      router.push("/admin/admins");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="max-w-[480px]">
      <Input
        label="Login ID"
        placeholder="priya@utkarsh.internal"
        disabled={mode === "edit"}
        state={errors.loginId ? "error" : "default"}
        message={
          errors.loginId?.message ??
          (mode === "create"
            ? "Doesn't need to be a real email — any unique string works (§5.3)."
            : "Login ID can't be changed after creation.")
        }
        {...register("loginId")}
      />

      <Input
        label="Display name"
        state={errors.name ? "error" : "default"}
        message={errors.name?.message}
        {...register("name")}
      />

      {mode === "create" && (
        <Input
          label="Temporary password"
          type="password"
          state={errors.password ? "error" : "default"}
          message={errors.password?.message ?? "At least 8 characters. Share this with the admin securely."}
          {...register("password")}
        />
      )}

      <div className="mb-4">
        <label className="mb-1.5 block text-[13px] font-semibold text-ink-900">Role</label>
        <select
          {...register("roleId")}
          className="w-full rounded-sm border-[1.5px] border-gray-300 px-3.5 py-[11px] font-sans text-small text-ink-900 focus:border-navy-700 focus:outline-none focus:ring-4 focus:ring-navy-100"
        >
          {roles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.name}
              {role.is_super ? " (implicit — all permissions)" : ""}
            </option>
          ))}
        </select>
      </div>

      {mode === "edit" && (
        <div className="mb-4">
          <label className="mb-1.5 block text-[13px] font-semibold text-ink-900">Status</label>
          <select
            {...register("status")}
            className="w-full rounded-sm border-[1.5px] border-gray-300 px-3.5 py-[11px] font-sans text-small text-ink-900 focus:border-navy-700 focus:outline-none focus:ring-4 focus:ring-navy-100"
          >
            <option value="active">Active</option>
            <option value="disabled">Disabled</option>
          </select>
        </div>
      )}

      {selectedRole?.is_super ? (
        <p className="mb-4 text-[13px] text-gray-700">
          superAdmin implicitly has every permission — extra permission grants below don't apply and are ignored.
        </p>
      ) : (
        <div className="mb-6">
          <label className="mb-2 block text-[13px] font-semibold text-ink-900">
            Extra permissions{" "}
            <span className="font-normal text-gray-500">(in addition to the role's own set)</span>
          </label>
          <Controller
            control={control}
            name="extraPermissions"
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
      )}

      {formError && (
        <div className="mb-4 rounded-sm border border-error bg-error-bg px-3.5 py-3 text-[13px] text-error">
          {formError}
        </div>
      )}

      <Button type="submit" variant="primary" disabled={isPending}>
        {isPending ? "Saving…" : mode === "create" ? "Create admin" : "Save changes"}
      </Button>
    </form>
  );
}
