import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * Returns the current authenticated session, or null if the user is not authenticated.
 * Use this in API route handlers to enforce server-side authentication.
 */
export async function getAuthSession() {
  return getServerSession(authOptions);
}

/**
 * Checks if the request is authenticated. Returns the session if valid,
 * or a 401 NextResponse if not authenticated.
 *
 * Usage in API routes:
 * ```ts
 * const { session, error } = await requireAuth();
 * if (error) return error;
 * ```
 */
export async function requireAuth() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return {
      session: null,
      error: Response.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { session, error: null };
}
