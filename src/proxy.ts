import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth/auth";

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
 * validated session JSON in the `x-session-verified` request header.
 * Server Components / Route Handlers read this header in `getSession()`
 * instead of re-querying the database.
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
    return NextResponse.redirect(new URL("/home", request.url));
  }

  // Send logged-out users to login when they hit a protected route.
  if (!hasSession && !isPublic) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Forward the validated session to downstream Server Components / Route
  // Handlers so they skip the redundant DB round-trip in getSession().
  const response = NextResponse.next();
  if (session) {
    response.headers.set(
      "x-session-verified",
      Buffer.from(JSON.stringify(session), "utf-8").toString("base64"),
    );
  }
  return response;
}

export const config = {
  // Run on everything except API routes, Next internals, and static files.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)"],
};
