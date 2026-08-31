import { createHmac, timingSafeEqual } from "node:crypto";

/** Request headers set by `proxy.ts` after a successful Better Auth check. */
export const SESSION_VERIFIED_HEADER = "x-session-verified";
export const SESSION_SIG_HEADER = "x-session-sig";

/** HMAC-SHA256 hex digest of the base64 session payload. */
export function signSessionPayload(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export function verifySessionPayload(
  payload: string,
  signature: string,
  secret: string,
): boolean {
  const expected = signSessionPayload(payload, secret);
  try {
    const a = Buffer.from(expected, "utf8");
    const b = Buffer.from(signature, "utf8");
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
