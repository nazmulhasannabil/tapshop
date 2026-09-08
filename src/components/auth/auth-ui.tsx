"use client";

import { useState, type ComponentType, type InputHTMLAttributes, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Eye, EyeOff, Loader2 } from "lucide-react";

import { TapShopLogo } from "@/components/auth/tapshop-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function AuthCard({ children }: { children: ReactNode }) {
  return (
    <section className="relative rounded-[1.75rem] bg-card px-6 pt-5 pb-7 shadow-[0_12px_36px_-18px_oklch(0.2_0.02_155/0.22)] ring-1 ring-border/70">
      <AuthBackButton />
      <div className="mb-6 flex justify-center pt-1">
        <TapShopLogo />
      </div>
      {children}
    </section>
  );
}

export function AuthBackButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      aria-label="Go back"
      onClick={() => {
        if (window.history.length > 1) {
          router.back();
        } else {
          router.push("/");
        }
      }}
      className="absolute top-5 left-5 flex size-8 items-center justify-center rounded-full bg-muted text-foreground/70 transition hover:bg-accent hover:text-foreground active:scale-95"
    >
      <ChevronLeft className="size-4" strokeWidth={2.25} />
    </button>
  );
}

export function AuthHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <header className="mb-7 text-center">
      <h1 className="text-[1.65rem] leading-tight font-bold tracking-tight text-foreground">
        {title}
      </h1>
      <p className="mx-auto mt-2 max-w-[17.5rem] text-[13px] leading-relaxed text-muted-foreground">
        {description}
      </p>
    </header>
  );
}

const fieldClassName =
  "h-12 rounded-full border-border/80 bg-card px-11 text-sm shadow-none placeholder:text-muted-foreground/80 focus-visible:border-ring focus-visible:ring-2 md:text-sm";

function scrollFieldIntoView(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return;
  window.setTimeout(() => {
    target.scrollIntoView({ block: "center", inline: "nearest" });
  }, 50);
}

export function AuthInput({
  id,
  label,
  icon: Icon,
  error,
  className,
  onFocus,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  icon: ComponentType<{ className?: string }>;
  error?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <div className="relative">
        <Icon className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={id}
          aria-invalid={!!error}
          placeholder={label}
          onFocus={(event) => {
            onFocus?.(event);
            scrollFieldIntoView(event.currentTarget);
          }}
          className={cn(fieldClassName, className)}
          {...props}
        />
      </div>
      {error ? <p className="px-3 text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

export function PasswordInput({
  id,
  label,
  error,
  className,
  onFocus,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: string;
  error?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <div className="relative">
        <LockIcon className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={id}
          type={visible ? "text" : "password"}
          aria-invalid={!!error}
          placeholder={label}
          onFocus={(event) => {
            onFocus?.(event);
            scrollFieldIntoView(event.currentTarget);
          }}
          className={cn(fieldClassName, "pr-11", className)}
          {...props}
        />
        <button
          type="button"
          className="absolute top-1/2 right-3.5 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
          onClick={() => setVisible((value) => !value)}
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
        </button>
      </div>
      {error ? <p className="px-3 text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <rect x="5" y="10" width="14" height="10" rx="2.5" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M8 10V7.5a4 4 0 0 1 8 0V10"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function MailIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2.5" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="m4.5 7.5 7.5 6 7.5-6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function UserIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <circle cx="12" cy="8" r="3.25" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M5.5 18.5c.8-2.6 3.1-4 6.5-4s5.7 1.4 6.5 4"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function AuthButton({
  pending,
  children,
}: {
  pending?: boolean;
  children: ReactNode;
}) {
  return (
    <Button
      type="submit"
      disabled={pending}
      className="h-12 w-full rounded-full text-[15px] font-medium shadow-none hover:bg-primary/90 active:translate-y-px"
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : null}
      {children}
    </Button>
  );
}

export function AuthSwitch({
  prompt,
  action,
  href,
}: {
  prompt: string;
  action: string;
  href: string;
}) {
  return (
    <p className="text-center text-[13px] text-muted-foreground">
      {prompt}{" "}
      <Link href={href} className="font-medium text-primary hover:underline">
        {action}
      </Link>
    </p>
  );
}

export function AuthDivider({ label = "Or Continue With Account" }: { label?: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-px flex-1 bg-border" />
      <span className="text-[11px] whitespace-nowrap text-muted-foreground">{label}</span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

export function withInvite(path: string, inviteToken: string | null) {
  if (!inviteToken) return path;
  return `${path}?invite=${encodeURIComponent(inviteToken)}`;
}
