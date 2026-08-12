import { getSession } from "@/lib/auth/server";
import { fail, ok } from "@/lib/api/http";
import { updateProfileImage } from "@/lib/services/profile";

/** Accepted upload MIME types. */
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

/** Hard ceiling on the raw uploaded file (2 MB). */
const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;
/**
 * Ceiling on the base64 data URL actually persisted. Avatars are resized to a
 * 256×256 square JPEG on the client (~20–40 KB), so this is only a safety net.
 */
const MAX_STORED_BYTES = 512 * 1024;

/**
 * POST /api/profile/image — upload the signed-in user's profile picture.
 *
 * Accepts `multipart/form-data` with a single `file` field (already resized on
 * the client), encodes it as a `data:` URL and stores it verbatim in
 * `users.image` (a text column — no external storage backend required).
 */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.user) return fail("Unauthorized.", 401);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail("Expected a file upload.", 400);
  }

  const file = form.get("file");
  if (!(file instanceof File)) return fail("No file provided.", 400);

  if (!ALLOWED_TYPES.has(file.type)) {
    return fail("Use a JPEG, PNG, or WebP image.", 415);
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return fail("Image is too large (max 2 MB).", 413);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const dataUrl = `data:${file.type};base64,${buffer.toString("base64")}`;
  if (dataUrl.length > MAX_STORED_BYTES) {
    return fail("Image is too large after encoding.", 413);
  }

  await updateProfileImage(session.user.id, dataUrl);
  return ok({ image: dataUrl });
}
