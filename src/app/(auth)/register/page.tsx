"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import {
  AuthButton,
  AuthCard,
  AuthDivider,
  AuthHeader,
  AuthInput,
  AuthSwitch,
  MailIcon,
  PasswordInput,
  UserIcon,
  withInvite,
} from "@/components/auth/auth-ui";
import { SocialLoginButtons } from "@/components/auth/social-login";
import { authClient } from "@/lib/auth/client";
import { registerSchema, type RegisterValues } from "@/lib/validations/auth";
import type { ApiResult } from "@/types/bill";

type InvitePreview = {
  token: string;
  email: string;
  inviterName: string;
  expired: boolean;
  status: string;
};

function RegisterCard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite");
  const [pending, setPending] = useState(false);
  const [invite, setInvite] = useState<InvitePreview | null>(null);
  const [emailTaken, setEmailTaken] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  useEffect(() => {
    if (!inviteToken) return;
    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/friends/invite/${encodeURIComponent(inviteToken)}`);
      const json = (await res.json()) as ApiResult<InvitePreview>;
      if (cancelled) return;
      if (!json.ok) {
        toast.error(json.error);
        return;
      }
      if (json.data.expired) {
        toast.error("This invite has expired.");
        return;
      }
      setInvite(json.data);
      setValue("email", json.data.email);
    })();
    return () => {
      cancelled = true;
    };
  }, [inviteToken, setValue]);

  async function onSubmit(values: RegisterValues) {
    setPending(true);
    setEmailTaken(false);
    const { error } = await authClient.signUp.email({
      name: values.name,
      email: values.email,
      password: values.password,
    });
    setPending(false);

    if (error) {
      const already =
        error.code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL" || error.status === 422;
      if (already) {
        setEmailTaken(true);
        toast.error("This email already has an account. Sign in instead.");
        return;
      }
      toast.error(error.message ?? "Couldn't create your account.");
      return;
    }

    if (inviteToken) {
      router.push(`/friends?invite=${encodeURIComponent(inviteToken)}`);
    } else {
      router.push("/home");
    }
    router.refresh();
  }

  return (
    <AuthCard>
      <AuthHeader
        title="Create Account"
        description={
          invite
            ? `${invite.inviterName} invited you to track debts together.`
            : "Create a new account to get started and enjoy seamless access to our features."
        }
      />
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3.5">
        <AuthInput
          id="name"
          label="Name"
          icon={UserIcon}
          autoComplete="name"
          error={errors.name?.message}
          {...register("name")}
        />
        <AuthInput
          id="email"
          type="email"
          label="Email address"
          icon={MailIcon}
          autoComplete="email"
          readOnly={!!invite}
          error={emailTaken ? undefined : errors.email?.message}
          {...register("email", {
            onChange: () => setEmailTaken(false),
          })}
        />
        {emailTaken ? (
          <p className="-mt-1 px-3 text-xs text-destructive">
            This email is already registered.{" "}
            <Link
              href={withInvite("/login", inviteToken)}
              className="font-medium underline"
            >
              Sign in
            </Link>{" "}
            with it, or use a different email.
          </p>
        ) : null}
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
          <AuthButton pending={pending}>
            {pending ? "Creating account…" : "Create Account"}
          </AuthButton>
        </div>
      </form>
      <div className="mt-5">
        <AuthSwitch
          prompt="Already have an account?"
          action="Sign In here"
          href={withInvite("/login", inviteToken)}
        />
      </div>
      <div className="mt-6 flex flex-col gap-5">
        <AuthDivider />
        <SocialLoginButtons />
      </div>
    </AuthCard>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-[1.75rem] bg-card" />}>
      <RegisterCard />
    </Suspense>
  );
}
