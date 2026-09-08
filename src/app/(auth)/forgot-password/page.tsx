"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import {
  AuthButton,
  AuthCard,
  AuthHeader,
  AuthInput,
  MailIcon,
} from "@/components/auth/auth-ui";
import { authClient } from "@/lib/auth/client";
import { forgotPasswordSchema, type ForgotPasswordValues } from "@/lib/validations/auth";

export default function ForgotPasswordPage() {
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: ForgotPasswordValues) {
    setPending(true);
    const { error } = await authClient.requestPasswordReset({
      email: values.email,
      redirectTo: "/reset-password",
    });
    setPending(false);

    if (error) {
      toast.error(error.message ?? "Couldn't send a reset link. Try again.");
      return;
    }

    setSent(true);
  }

  return (
    <AuthCard>
      <AuthHeader
        title="Forgot Password"
        description={
          sent
            ? "If an account exists for that email, a reset link is on its way. Open it to choose a new password."
            : "Enter your email address to receive a reset link and regain access to your account."
        }
      />
      {sent ? (
        <div className="flex flex-col gap-4">
          <p className="text-center text-[13px] text-muted-foreground">
            Check your inbox, then follow the link to continue.
          </p>
          <Link
            href="/login"
            className="inline-flex h-12 w-full items-center justify-center rounded-full bg-primary text-[15px] font-medium text-primary-foreground hover:bg-primary/90"
          >
            Back to Login
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <AuthInput
            id="email"
            type="email"
            label="Email address"
            icon={MailIcon}
            autoComplete="email"
            enterKeyHint="go"
            error={errors.email?.message}
            {...register("email")}
          />
          <AuthButton pending={pending}>{pending ? "Sending…" : "Continue"}</AuthButton>
        </form>
      )}
    </AuthCard>
  );
}
