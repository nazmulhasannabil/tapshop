import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth/auth";
import {
  SESSION_SIG_HEADER,
  SESSION_VERIFIED_HEADER,
  signSessionPayload,
} from "@/lib/auth/session-headers";

/**
 * Next.js 16 "proxy" (the successor to middleware).
 *
 * Session gating is AUTHORITATIVE here: it validates the request against
 * Better Auth (`auth.api.getSession`), which checks the cookie signature and
 * the `session` row in the DB. This keeps the proxy's notion of "logged in"
 * identical to the Server Components / Route Handlers, so a stale/invalid
 * session cookie can never cause a redirect loop between the two layers.
 *
 * To avoid a redundant DB round-trip downstream, the proxy forwards the
 * validated session JSON on the *request* (not response) as HMAC-signed
 * headers. Server Components read them in `getSession()` instead of
 * re-querying the database. Signing prevents API clients (proxy matcher
 * excludes `/api`) from spoofing the header.
 *
 * Role/ownership authorization still happens downstream via `requireUser` /
 * `requireAdmin` and the DAL.
 *
 * Runtime is nodejs (the only runtime supported for `proxy`).
 */

const PUBLIC_PATHS = ["/login", "/register"];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = isPublicPath(pathname);

  // Same check the pages use, so the proxy and the server can never disagree.
  const session = await auth.api.getSession({ headers: request.headers });
  const hasSession = !!session;

  // Send logged-in users away from the auth pages.
  if (hasSession && isPublic) {
    const invite = request.nextUrl.searchParams.get("invite");
    if (invite) {
      return NextResponse.redirect(
        new URL(`/friends?invite=${encodeURIComponent(invite)}`, request.url),
      );
    }
    return NextResponse.redirect(new URL("/home", request.url));
  }

  // Send logged-out users to login when they hit a protected route.
  if (!hasSession && !isPublic) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Forward validated session upstream so RSC getSession() skips a DB hit.
  // Must use request headers — response headers never reach Server Components.
  const requestHeaders = new Headers(request.headers);
  // Strip any client-supplied values before setting ours.
  requestHeaders.delete(SESSION_VERIFIED_HEADER);
  requestHeaders.delete(SESSION_SIG_HEADER);

  if (session) {
    const secret = process.env.BETTER_AUTH_SECRET;
    if (secret) {
      const payload = Buffer.from(JSON.stringify(session), "utf-8").toString(
        "base64",
      );
      requestHeaders.set(SESSION_VERIFIED_HEADER, payload);
      requestHeaders.set(SESSION_SIG_HEADER, signSessionPayload(payload, secret));
    }
  }

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  // Run on everything except API routes, Next internals, and static files.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)"],
};
