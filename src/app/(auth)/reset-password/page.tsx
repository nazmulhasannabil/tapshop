"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { AuthButton, AuthCard, AuthHeader, PasswordInput } from "@/components/auth/auth-ui";
import { authClient } from "@/lib/auth/client";
import { resetPasswordSchema, type ResetPasswordValues } from "@/lib/validations/auth";

function ResetPasswordCard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const invalid = searchParams.get("error") === "INVALID_TOKEN" || !token;
  const [pending, setPending] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  async function onSubmit(values: ResetPasswordValues) {
    if (!token) return;
    setPending(true);
    const { error } = await authClient.resetPassword({
      newPassword: values.password,
      token,
    });
    setPending(false);

    if (error) {
      toast.error(error.message ?? "This reset link is invalid or expired.");
      return;
    }

    toast.success("Password updated. Sign in with your new password.");
    router.push("/login");
    router.refresh();
  }

  return (
    <AuthCard>
      <AuthHeader
        title="Reset Password"
        description={
          invalid
            ? "This reset link is invalid or has expired. Request a new one to continue."
            : "Choose a new password to regain access to your account."
        }
      />
      {invalid ? (
        <Link
          href="/forgot-password"
          className="inline-flex h-12 w-full items-center justify-center rounded-full bg-primary text-[15px] font-medium text-primary-foreground hover:bg-primary/90"
        >
          Request a new link
        </Link>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3.5">
          <PasswordInput
            id="password"
            label="Password"
            autoComplete="new-password"
            error={errors.password?.message}
            {...register("password")}
          />
          <PasswordInput
            id="confirmPassword"
            label="Confirm Password"
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            {...register("confirmPassword")}
          />
          <div className="pt-1">
            <AuthButton pending={pending}>{pending ? "Saving…" : "Continue"}</AuthButton>
          </div>
        </form>
      )}
    </AuthCard>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-[1.75rem] bg-card" />}>
      <ResetPasswordCard />
    </Suspense>
  );
}
