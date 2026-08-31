import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";
import {
  SESSION_SIG_HEADER,
  SESSION_VERIFIED_HEADER,
  verifySessionPayload,
} from "@/lib/auth/session-headers";

type Session = Awaited<ReturnType<typeof auth.api.getSession>>;

/**
 * Current session (user + session) or null.
 *
 * Optimisation: the Next.js `proxy.ts` layer already validated the session
 * against the DB and forwards an HMAC-signed payload in request headers so we
 * skip a redundant DB round-trip here. Signature verification prevents API
 * clients (excluded from the proxy matcher) from spoofing the header.
 *
 * Wrapped in React `cache()` so layout + page share one lookup per request.
 */
export const getSession = cache(async (): Promise<Session> => {
  const headerList = await headers();

  const verified = headerList.get(SESSION_VERIFIED_HEADER);
  const signature = headerList.get(SESSION_SIG_HEADER);
  const secret = process.env.BETTER_AUTH_SECRET;

  if (verified && signature && secret) {
    if (verifySessionPayload(verified, signature, secret)) {
      try {
        return JSON.parse(
          Buffer.from(verified, "base64").toString("utf-8"),
        ) as Session;
      } catch {
        // Corrupted payload — fall through to direct check.
      }
    }
  }

  return auth.api.getSession({ headers: headerList });
});

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
