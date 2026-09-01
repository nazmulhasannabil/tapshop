/**
 * Friend invite emails via EmailJS REST API.
 * When EmailJS env vars are missing, logs and returns `{ sent: false }` so
 * invite flows still work via copyable links.
 */

import { betterAuthUrl, isDev } from "@/lib/config/env";

export type SendEmailResult = { sent: boolean; error?: string };

function appOrigin(): string {
  return betterAuthUrl || process.env.BETTER_AUTH_URL || "http://localhost:3000";
}

function formatEmailJsError(status: number, text: string): string {
  const body = text.trim();
  if (status === 403 && body.includes("non-browser")) {
    return (
      'EmailJS blocks server requests. In dashboard.emailjs.com → Account → Security, ' +
      'enable "Allow EmailJS API for non-browser applications".'
    );
  }
  if (status === 403 && body.includes("private key")) {
    return "EmailJS strict mode requires EMAILJS_PRIVATE_KEY in .env.local.";
  }
  return body || `EmailJS error (${status})`;
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
  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const templateId = process.env.EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY;
  const privateKey = process.env.EMAILJS_PRIVATE_KEY;

  if (!serviceId || !templateId || !publicKey || !privateKey) {
    if (isDev) {
      console.info("[email] EmailJS not configured — skip send", {
        to: opts.to,
        inviteUrl: opts.inviteUrl,
      });
    }
    return { sent: false, error: "Email not configured." };
  }

  try {
    const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id: serviceId,
        template_id: templateId,
        user_id: publicKey,
        accessToken: privateKey,
        template_params: {
          to_email: opts.to,
          inviter_name: opts.inviterName,
          invite_url: opts.inviteUrl,
        },
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      const error = formatEmailJsError(res.status, text);
      if (isDev) {
        console.error("[email] EmailJS send failed:", res.status, text);
      }
      return { sent: false, error };
    }

    if (isDev) {
      console.info("[email] EmailJS sent OK", { to: opts.to });
    }
    return { sent: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to send email.";
    return { sent: false, error: message };
  }
}
