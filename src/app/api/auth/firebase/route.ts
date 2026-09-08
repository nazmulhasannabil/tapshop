import { createSessionFromFirebaseIdToken, sessionResponse } from "@/lib/auth/firebase-session";
import { parseJson } from "@/lib/api/http";

export const runtime = "nodejs";

/** Exchange a Firebase ID token for a Better Auth session cookie. */
export async function POST(request: Request) {
  const body = await parseJson<{ idToken?: string }>(request);
  const idToken = body?.idToken?.trim();
  if (!idToken) {
    return sessionResponse({ error: "Missing sign-in token.", status: 400 });
  }

  try {
    const result = await createSessionFromFirebaseIdToken(idToken);
    return sessionResponse(result);
  } catch {
    return sessionResponse({
      error: "Couldn't verify that sign-in. Try again.",
      status: 401 as const,
    });
  }
}
