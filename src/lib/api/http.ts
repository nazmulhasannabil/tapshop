import { NextResponse } from "next/server";
import type { ApiResult } from "@/types/bill";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ ok: true, data } satisfies ApiResult<T>, { status });
}

export function fail(error: string, status = 400) {
  return NextResponse.json({ ok: false, error } satisfies ApiResult<never>, { status });
}

/** Safely parse a JSON request body, returning null on failure. */
export async function parseJson<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}
