import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";

/**
 * Current session (user + session) or null.
 *
 * Optimisation: the Next.js `proxy.ts` layer already validated the session
 * against the DB.  It forwards the result in the `x-session-verified`
 * request header so we skip a redundant DB round-trip here.
 * If the header is missing (e.g. API routes that bypass the proxy matcher,
 * or local dev without the proxy), we fall back to a direct DB check.
 */
export async function getSession() {
  const headerList = await headers();

  // Check for the proxy-forwarded session first.
  const verified = headerList.get("x-session-verified");
  if (verified) {
    try {
      return JSON.parse(
        Buffer.from(verified, "base64").toString("utf-8"),
      ) as Awaited<ReturnType<typeof auth.api.getSession>>;
    } catch {
      // Corrupted or tampered header — fall through to direct check.
    }
  }

  return auth.api.getSession({ headers: headerList });
}

/** Require an authenticated user, else redirect to /login. */
export async function requireUser() {
  const session = await getSession();
  if (!session?.user) redirect("/login");
  return session;
}

/** Require an ADMIN user, else redirect to /home. */
export async function requireAdmin() {
  const session = await requireUser();
  if (session.user.role !== "admin") redirect("/home");
  return session;
}
