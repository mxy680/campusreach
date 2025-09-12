import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// NextAuth v4 is not compatible with the Edge runtime
export const runtime = "nodejs";
// Avoid caching providers/session endpoints
export const dynamic = "force-dynamic";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };