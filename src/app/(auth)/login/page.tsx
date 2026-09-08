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
  withInvite,
} from "@/components/auth/auth-ui";
import { SocialLoginButtons } from "@/components/auth/social-login";
import { authClient } from "@/lib/auth/client";
import { loginSchema, type LoginValues } from "@/lib/validations/auth";
import type { ApiResult } from "@/types/bill";

type InvitePreview = {
  email: string;
  inviterName: string;
  expired: boolean;
};

function LoginCard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite");
  const [pending, setPending] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [invite, setInvite] = useState<InvitePreview | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    if (!inviteToken) return;
    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/friends/invite/${encodeURIComponent(inviteToken)}`);
      const json = (await res.json()) as ApiResult<InvitePreview & { token: string; status: string }>;
      if (cancelled || !json.ok) return;
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

  async function onSubmit(values: LoginValues) {
    setPending(true);
    const { error } = await authClient.signIn.email({ ...values, rememberMe });
    setPending(false);

    if (error) {
      toast.error(error.message ?? "Couldn't sign you in. Double-check your details.");
      return;
    }

    if (inviteToken) {
      router.push(`/friends?invite=${encodeURIComponent(inviteToken)}`);
    } else {
      const next = searchParams.get("redirect") || "/home";
      router.push(next);
    }
    router.refresh();
  }

  return (
    <AuthCard>
      <AuthHeader
        title="Log in"
        description={
          invite
            ? `${invite.inviterName} invited you — sign in to accept.`
            : "Enter your email and password to securely access your account and manage your services."
        }
      />
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3.5">
        <AuthInput
          id="email"
          type="email"
          label="Email address"
          icon={MailIcon}
          autoComplete="email"
          error={errors.email?.message}
          {...register("email")}
        />
        <PasswordInput
          id="password"
          label="Password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register("password")}
        />
        <div className="flex items-center justify-between px-1 pt-0.5">
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(event) => setRememberMe(event.target.checked)}
              className="size-3.5 rounded-sm border-border accent-primary"
            />
            Remember me
          </label>
          <Link
            href="/forgot-password"
            className="text-xs font-medium text-primary hover:underline"
          >
            Forgot Password
          </Link>
        </div>
        <AuthButton pending={pending}>{pending ? "Signing in…" : "Login"}</AuthButton>
      </form>
      <div className="mt-5">
        <AuthSwitch
          prompt="Don't have an account?"
          action="Sign Up here"
          href={withInvite("/register", inviteToken)}
        />
      </div>
      <div className="mt-6 flex flex-col gap-5">
        <AuthDivider />
        <SocialLoginButtons />
      </div>
    </AuthCard>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-[1.75rem] bg-card" />}>
      <LoginCard />
    </Suspense>
  );
}
