import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { auth } from "@/lib/auth/auth";
import { isAdminEmail } from "@/lib/config/env";
import { firebaseAdminCanCheckRevocation, getFirebaseAdminAuth } from "@/lib/firebase/admin";

const PROVIDER_IDS = {
  "google.com": "google",
  "facebook.com": "facebook",
  "apple.com": "apple",
} as const;

type FirebaseProvider = keyof typeof PROVIDER_IDS;

function isFirebaseProvider(value: string | undefined): value is FirebaseProvider {
  return value === "google.com" || value === "facebook.com" || value === "apple.com";
}

async function signSessionCookie(token: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(token));
  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)));
  return encodeURIComponent(`${token}.${signatureB64}`);
}

async function isInactiveUser(userId: string) {
  const [row] = await db
    .select({ isActive: users.isActive })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return row?.isActive === false;
}

export async function createSessionFromFirebaseIdToken(idToken: string) {
  const decoded = await getFirebaseAdminAuth().verifyIdToken(
    idToken,
    firebaseAdminCanCheckRevocation(),
  );
  const firebaseProvider = decoded.firebase?.sign_in_provider;
  if (!isFirebaseProvider(firebaseProvider)) {
    return { error: "This sign-in method isn't allowed.", status: 403 as const };
  }

  const email = decoded.email?.trim().toLowerCase();
  if (!email) {
    return { error: "Your provider did not share an email address.", status: 400 as const };
  }

  const providerId = PROVIDER_IDS[firebaseProvider];
  const ctx = await auth.$context;
  const findByEmail = async () => {
    const match = await ctx.internalAdapter.findUserByEmail(email, { includeAccounts: true });
    if (match || !decoded.email || decoded.email === email) return match;
    return ctx.internalAdapter.findUserByEmail(decoded.email, { includeAccounts: true });
  };
  const existingAccount = await ctx.internalAdapter.findAccountByProviderId(
    decoded.uid,
    providerId,
  );

  let user = existingAccount
    ? await ctx.internalAdapter.findUserById(existingAccount.userId)
    : null;

  if (!user && decoded.email_verified) {
    const byEmail = await findByEmail();
    if (byEmail) {
      if (await isInactiveUser(byEmail.user.id)) {
        return { error: "This account is inactive.", status: 403 as const };
      }
      user = byEmail.user;
      const alreadyLinked = byEmail.accounts.some(
        (account) => account.providerId === providerId && account.accountId === decoded.uid,
      );
      if (!alreadyLinked) {
        await ctx.internalAdapter.linkAccount({
          userId: user.id,
          providerId,
          accountId: decoded.uid,
        });
      }
    }
  } else if (!user && !decoded.email_verified) {
    const byEmail = await findByEmail();
    if (byEmail) {
      return {
        error: "An account with this email already exists. Sign in with your password first.",
        status: 409 as const,
      };
    }
  }

  if (!user) {
    const name = decoded.name?.trim() || email.split("@")[0] || "TapShop user";
    user = await ctx.internalAdapter.createUser({
      name,
      email,
      emailVerified: Boolean(decoded.email_verified),
      image: typeof decoded.picture === "string" ? decoded.picture : undefined,
      role: isAdminEmail(email) ? "admin" : "user",
      isActive: true,
    });
    await ctx.internalAdapter.createAccount({
      userId: user.id,
      providerId,
      accountId: decoded.uid,
    });
  }

  if (!user || (await isInactiveUser(user.id))) {
    return { error: "This account is inactive.", status: 403 as const };
  }

  const session = await ctx.internalAdapter.createSession(user.id);
  try {
    await db.update(users).set({ lastActiveAt: new Date() }).where(eq(users.id, user.id));
  } catch {
    /* non-critical — don't block the session */
  }

  const cookie = ctx.authCookies.sessionToken;
  const signed = await signSessionCookie(session.token, ctx.secret);
  const maxAge = Math.max(0, Math.floor((session.expiresAt.getTime() - Date.now()) / 1000));
  const secure = cookie.attributes.secure ? "; Secure" : "";
  const setCookie = `${cookie.name}=${signed}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;

  return { session, setCookie };
}

export function sessionResponse(
  result:
    | { error: string; status: 400 | 401 | 403 | 409 }
    | { session: { userId: string }; setCookie: string },
) {
  if ("error" in result) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
  }

  const response = NextResponse.json({ ok: true, data: { userId: result.session.userId } });
  response.headers.append("Set-Cookie", result.setCookie);
  return response;
}
