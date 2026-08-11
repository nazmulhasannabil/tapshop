import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";

/** Current session (user + session) or null. `headers()` is async in Next 16. */
export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
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
