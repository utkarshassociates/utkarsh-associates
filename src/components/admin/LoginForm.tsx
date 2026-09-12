"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { loginAction } from "@/actions/auth";
import { Button, Input } from "@/components/ui";

export function LoginForm({ redirectTo }: { redirectTo: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { loginId: "", password: "" },
  });

  function onSubmit(values: LoginInput) {
    setFormError(null);
    startTransition(async () => {
      const result = await loginAction(values);
      if (!result.success) {
        setFormError(result.error ?? "Something went wrong.");
        return;
      }
      router.push(redirectTo);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <Input
        label="Login ID"
        placeholder="priya@utkarsh.internal"
        autoComplete="username"
        state={errors.loginId ? "error" : "default"}
        message={errors.loginId?.message}
        {...register("loginId")}
      />
      <Input
        label="Password"
        type="password"
        autoComplete="current-password"
        state={errors.password ? "error" : "default"}
        message={errors.password?.message}
        {...register("password")}
      />

      {formError && (
        <div className="mb-4 rounded-sm border border-error bg-error-bg px-3.5 py-3 text-[13px] text-error">
          {formError}
        </div>
      )}

      <Button type="submit" variant="primary" disabled={isPending} className="w-full justify-center">
        {isPending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
