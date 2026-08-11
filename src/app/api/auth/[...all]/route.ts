import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth/auth";

/** Mount the Better Auth request handler for /api/auth/*. */
export const { GET, POST } = toNextJsHandler(auth.handler);
