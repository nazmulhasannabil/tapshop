import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { accounts, sessions, users, verifications } from "@/db/schema";
import { betterAuthUrl, isAdminEmail } from "@/lib/config/env";

/**
 * Better Auth instance.
 *
 * - Credential (email + password) provider only for the skeleton.
 * - `role` / `isActive` / `lastActiveAt` are app fields exposed to Better Auth
 *   via `additionalFields` (with `input: false` so clients cannot set them).
 * - Emails listed in ADMIN_EMAILS are auto-promoted to ADMIN at signup.
 * - Password hashing, session cookies and CSRF are all handled by Better Auth.
 */
export const auth = betterAuth({
  baseURL: betterAuthUrl,
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: betterAuthUrl ? [betterAuthUrl] : [],

  database: drizzleAdapter(db, {
    provider: "pg",
    // Singular model keys mapped explicitly to our (plural-named) Drizzle tables.
    schema: {
      user: users,
      session: sessions,
      account: accounts,
      verification: verifications,
    },
  }),

  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    requireEmailVerification: false,
    minPasswordLength: 8,
    maxPasswordLength: 128,
  },

  user: {
    additionalFields: {
      role: { type: "string", required: false, defaultValue: "user", input: false },
      isActive: { type: "boolean", required: false, defaultValue: true, input: false },
      lastActiveAt: { type: "date", required: false, input: false },
    },
  },

  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          // Promote allowlisted emails to ADMIN at signup.
          if (isAdminEmail(user.email)) {
            return { data: { ...user, role: "admin" as const } };
          }
        },
      },
    },
    session: {
      create: {
        after: async (session) => {
          // Best-effort: stamp lastActiveAt on each login.
          try {
            await db
              .update(users)
              .set({ lastActiveAt: new Date() })
              .where(eq(users.id, session.userId));
          } catch {
            /* non-critical — don't block the session */
          }
        },
      },
    },
  },
});

/** Strongly-typed session shape ({ user, session }) including app fields. */
export type Session = typeof auth.$Infer.Session;
