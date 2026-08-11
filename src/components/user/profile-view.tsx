"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, BadgeCheck, Loader2, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { authClient } from "@/lib/auth/client";

export function ProfileView({
  name,
  email,
  role,
}: {
  name: string;
  email: string;
  role: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleLogout() {
    setPending(true);
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  }

  const initial = name.charAt(0).toUpperCase() || "?";

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-4 py-6">
      <Link
        href="/home"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to home
      </Link>

      <Card>
        <CardHeader className="items-center text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary text-2xl font-semibold text-primary-foreground">
            {initial}
          </div>
          <CardTitle className="mt-2 text-xl">{name}</CardTitle>
          <CardDescription>{email}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-center justify-between rounded-lg bg-muted/60 px-3 py-2 text-sm">
            <span className="text-muted-foreground">Account type</span>
            <span className="inline-flex items-center gap-1 font-medium capitalize">
              {role === "admin" && <BadgeCheck className="size-4 text-primary" />}
              {role}
            </span>
          </div>
          <Button
            variant="destructive"
            size="lg"
            className="mt-2 h-11 w-full"
            onClick={handleLogout}
            disabled={pending}
          >
            {pending ? <Loader2 className="animate-spin" /> : <LogOut className="size-4" />}
            {pending ? "Signing out…" : "Sign out"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
