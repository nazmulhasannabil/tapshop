"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const [showPassword, setShowPassword] = useState(false);
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
    const { error } = await authClient.signIn.email(values);
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
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Welcome back 👋</CardTitle>
        <CardDescription>
          {invite
            ? `${invite.inviterName} invited you — sign in to accept.`
            : "Sign in to keep your shop bill in check."}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)} className="contents">
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              aria-invalid={!!errors.email}
              {...register("email")}
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                aria-invalid={!!errors.password}
                className="pr-9"
                {...register("password")}
              />
              <button
                type="button"
                className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-stretch gap-3">
          <Button type="submit" size="lg" disabled={pending} className="h-11 w-full text-base">
            {pending && <Loader2 className="animate-spin" />}
            {pending ? "Signing in…" : "Sign in"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            New here?{" "}
            <Link
              href={inviteToken ? `/register?invite=${encodeURIComponent(inviteToken)}` : "/register"}
              className="font-medium text-primary hover:underline"
            >
              Create an account
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<Card className="h-64 animate-pulse" />}>
      <LoginCard />
    </Suspense>
  );
}
