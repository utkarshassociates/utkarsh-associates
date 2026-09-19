"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordSchema } from "@/lib/validations/admin";
import { resetAdminPasswordAction } from "@/actions/admins";
import { Button, Input } from "@/components/ui";

const formSchema = resetPasswordSchema.omit({ adminId: true });
type FormValues = { newPassword: string };

export function ResetPasswordForm({ adminId }: { adminId: string }) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { newPassword: "" },
  });

  function onSubmit(values: FormValues) {
    setMessage(null);
    startTransition(async () => {
      const result = await resetAdminPasswordAction({ adminId, newPassword: values.newPassword });
      if (!result.success) {
        setMessage({ type: "error", text: result.error ?? "Could not reset password." });
        return;
      }
      reset();
      setMessage({ type: "success", text: "Password reset. Share the new password with this admin securely." });
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="max-w-[380px]">
      <Input
        label="New temporary password"
        type="password"
        state={errors.newPassword ? "error" : "default"}
        message={errors.newPassword?.message}
        {...register("newPassword")}
      />
      {message && (
        <div
          className={`mb-4 rounded-sm border px-3.5 py-3 text-[13px] ${
            message.type === "success" ? "border-success bg-success-bg text-success" : "border-error bg-error-bg text-error"
          }`}
        >
          {message.text}
        </div>
      )}
      <Button type="submit" variant="outline" disabled={isPending}>
        {isPending ? "Resetting…" : "Reset Password"}
      </Button>
    </form>
  );
}
