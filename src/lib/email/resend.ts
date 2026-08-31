/**
 * Thin Resend wrapper. When `RESEND_API_KEY` is missing, logs and returns
 * `{ sent: false }` so invite flows still work via copyable links.
 */

import { betterAuthUrl, isDev } from "@/lib/config/env";

export type SendEmailResult = { sent: boolean; error?: string };

function appOrigin(): string {
  return betterAuthUrl || process.env.BETTER_AUTH_URL || "http://localhost:3000";
}

export function inviteRegisterUrl(token: string): string {
  return `${appOrigin()}/register?invite=${encodeURIComponent(token)}`;
}

export function inviteLoginUrl(token: string): string {
  return `${appOrigin()}/login?invite=${encodeURIComponent(token)}`;
}

export async function sendFriendInviteEmail(opts: {
  to: string;
  inviterName: string;
  inviteUrl: string;
}): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "TapShop <onboarding@resend.dev>";

  if (!apiKey) {
    if (isDev) {
      console.info("[email] RESEND_API_KEY unset — skip send", {
        to: opts.to,
        inviteUrl: opts.inviteUrl,
      });
    }
    return { sent: false, error: "Email not configured." };
  }

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to: opts.to,
      subject: `${opts.inviterName} invited you to TapShop`,
      html: `
        <p><strong>${escapeHtml(opts.inviterName)}</strong> wants to track shared debts with you on TapShop.</p>
        <p><a href="${opts.inviteUrl}">Accept the invite</a> to create an account (or sign in) and become friends.</p>
        <p style="color:#666;font-size:12px;">If you didn't expect this, you can ignore the email.</p>
      `,
    });
    if (error) return { sent: false, error: error.message };
    return { sent: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to send email.";
    return { sent: false, error: message };
  }
}

function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
