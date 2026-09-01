"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Check, Copy, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ApiResult } from "@/types/bill";

const inviteFormSchema = z.object({
  email: z.string().trim().email("Enter a valid email."),
});
type InviteFormValues = z.infer<typeof inviteFormSchema>;

type InviteResponse = {
  kind: "friendship" | "invite";
  inviteUrl: string;
  emailSent: boolean;
  message: string;
  token?: string;
};

export function InviteFriendSheet({
  open,
  onOpenChange,
  onInvited,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvited?: () => void;
}) {
  const [pending, setPending] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InviteFormValues>({
    resolver: zodResolver(inviteFormSchema),
    defaultValues: { email: "" },
  });

  function handleOpenChange(next: boolean) {
    if (!next) {
      reset({ email: "" });
      setInviteUrl(null);
      setCopied(false);
    }
    onOpenChange(next);
  }

  async function onSubmit(values: InviteFormValues) {
    setPending(true);
    try {
      const res = await fetch("/api/friends/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: values.email }),
      });
      const json = (await res.json()) as ApiResult<InviteResponse>;
      if (!json.ok) {
        toast.error(json.error);
        return;
      }
      toast.success(json.data.message);
      if (!json.data.emailSent) {
        toast.warning("Email was not sent — use the link below.");
      }
      setInviteUrl(json.data.inviteUrl);
      onInvited?.();
    } catch {
      toast.error("Couldn't send invite.");
    } finally {
      setPending(false);
    }
  }

  async function copyLink() {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      toast.success("Link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy link.");
    }
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" className="gap-0 rounded-t-3xl p-0">
        <SheetHeader className="border-b">
          <SheetTitle className="text-center text-lg">Add a friend</SheetTitle>
          <SheetDescription className="text-center">
            Invite by email. They&apos;ll register and accept your request.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-1 flex-col">
          <div className="flex-1 space-y-4 px-4 py-5">
            <div className="space-y-2">
              <Label htmlFor="friend-email">Email</Label>
              <Input
                id="friend-email"
                type="email"
                placeholder="friend@example.com"
                autoComplete="email"
                aria-invalid={!!errors.email}
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            {inviteUrl && (
              <div className="space-y-2 rounded-2xl bg-muted/60 p-3">
                <p className="text-xs font-medium text-muted-foreground">
                  Share this link
                </p>
                <p className="break-all text-xs text-foreground">{inviteUrl}</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={copyLink}
                >
                  {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                  {copied ? "Copied" : "Copy link"}
                </Button>
              </div>
            )}
          </div>

          <SheetFooter className="border-t">
            <Button type="submit" size="lg" disabled={pending} className="h-11 w-full text-base">
              {pending ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Mail className="size-4" />
              )}
              {pending ? "Sending…" : "Send invite"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
