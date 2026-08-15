
// ============================================================================
// Auth - intentionally minimal for the MVP.
// ----------------------------------------------------------------------------
// Every API route calls `getCurrentUserId()` instead of reading req/session
// directly. Today it returns a single seeded "local" user. When real auth is
// added (NextAuth, Clerk, etc.), this is the ONLY function that needs to
// change - swap its body for `session.user.id` and every route, query, and
// ownership check downstream keeps working unmodified.
// ============================================================================

import { auth } from "@/auth";

export async function getCurrentUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  return session.user.id;
}
