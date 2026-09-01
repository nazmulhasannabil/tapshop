import type { ApiResult } from "@/types/bill";

/** Typed GET helper for `/api/*` route handlers. */
export async function getJson<T>(url: string): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, { credentials: "include" });
    return (await res.json()) as ApiResult<T>;
  } catch {
    return { ok: false, error: "Network hiccup — check your connection." };
  }
}

/** Typed POST helper for `/api/*` route handlers. */
export async function postJson<T>(
  url: string,
  body?: unknown,
): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      credentials: "include",
    });
    return (await res.json()) as ApiResult<T>;
  } catch {
    return { ok: false, error: "Network hiccup — check your connection." };
  }
}

/** Typed DELETE helper for `/api/*` route handlers. */
export async function deleteJson<T>(url: string): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, { method: "DELETE", credentials: "include" });
    return (await res.json()) as ApiResult<T>;
  } catch {
    return { ok: false, error: "Network hiccup — check your connection." };
  }
}

/** Typed PATCH helper for `/api/*` route handlers. */
export async function patchJson<T>(
  url: string,
  body: unknown,
): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      credentials: "include",
    });
    return (await res.json()) as ApiResult<T>;
  } catch {
    return { ok: false, error: "Network hiccup — check your connection." };
  }
}

/** Unwrap a successful API result or throw with the error message. */
export function unwrap<T>(result: ApiResult<T>): T {
  if (!result.ok) throw new Error(result.error);
  return result.data;
}
