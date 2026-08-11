import { NextResponse, type NextRequest } from "next/server";

/**
 * Next.js 16 "proxy" (the successor to middleware).
 *
 * This is an OPTIMISTIC, cookie-based gate only — it checks for the presence
 * of the session cookie. Real authorization (role checks, ownership) always
 * happens on the server (Server Components / Route Handlers / the DAL).
 *
 * Runtime is nodejs (the only runtime supported for `proxy`).
 */

const PUBLIC_PATHS = ["/login", "/register"];

/** Better Auth's default session cookie prefix. */
const SESSION_COOKIE_PREFIX = "better-auth.session_token";

function hasSessionCookie(request: NextRequest) {
  return request.cookies
    .getAll()
    .some((c) => c.name.startsWith(SESSION_COOKIE_PREFIX));
}

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = hasSessionCookie(request);
  const isPublic = isPublicPath(pathname);

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

  return NextResponse.next();
}

export const config = {
  // Run on everything except API routes, Next internals, and static files.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)"],
};
