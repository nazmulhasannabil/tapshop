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
  const [showPassword, setShowPassword] = useState(false);
  const [invite, setInvite] = useState<InvitePreview | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "" },
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
    const { error } = await authClient.signUp.email(values);
    setPending(false);

    if (error) {
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
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Create your account</CardTitle>
        <CardDescription>
          {invite
            ? `${invite.inviterName} invited you to track debts together.`
            : "Takes 10 seconds. No cards, no hassle."}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)} className="contents">
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              autoComplete="name"
              placeholder="Masood"
              aria-invalid={!!errors.name}
              {...register("name")}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              aria-invalid={!!errors.email}
              readOnly={!!invite}
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
                autoComplete="new-password"
                placeholder="At least 8 characters"
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
            {pending ? "Creating account…" : "Create account"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href={inviteToken ? `/login?invite=${encodeURIComponent(inviteToken)}` : "/login"}
              className="font-medium text-primary hover:underline"
            >
              Sign in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<Card className="h-64 animate-pulse" />}>
      <RegisterCard />
    </Suspense>
  );
}
