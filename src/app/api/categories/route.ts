import { createCategorySchema } from "@/lib/validations/item";
import { CategoryError, createCategory, getCategories } from "@/lib/services/categories";
import { getSession } from "@/lib/auth/server";
import { fail, ok, parseJson } from "@/lib/api/http";

/** GET /api/categories — list categories visible to the current user. */
export async function GET() {
  const session = await getSession();
  if (!session?.user) return fail("Unauthorized.", 401);

  const list = await getCategories(session.user.id);
  return ok(list);
}

/** POST /api/categories — create a new category (or return existing by name). */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.user) return fail("Unauthorized.", 401);

  const body = await parseJson<unknown>(request);
  const parsed = createCategorySchema.safeParse(body);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Invalid input.", 400);
  }

  try {
    const category = await createCategory(session.user.id, parsed.data.name);
    return ok(category, 201);
  } catch (error) {
    if (error instanceof CategoryError) return fail(error.message, 400);
    throw error;
  }
}
