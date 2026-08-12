import { createHash } from "node:crypto";

/**
 * Gravatar avatar URL for an email address — the standard way to derive a
 * profile picture from an email. Uses SHA-256 (Gravatar's recommended hash).
 *
 * `d=404` makes Gravatar respond 404 when no avatar is registered for the
 * email, so the UI can fall back to the user's initial via `<img onError>`.
 *
 * Server-only (uses Node `crypto`); compute in a server component and pass the
 * resulting URL down.
 */
export function gravatarUrl(email: string, size = 192): string {
  const hash = createHash("sha256")
    .update(email.trim().toLowerCase())
    .digest("hex");
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=404`;
}
