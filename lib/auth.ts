import { type NextAuthOptions } from "next-auth";
import type { Adapter } from "next-auth/adapters";
import { PrismaAdapter } from "@auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";

// Providers: Google only (set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET)
const providers = [] as NextAuthOptions["providers"];
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  session: { strategy: "jwt" },
  providers,
  callbacks: {
    async session({ session, token }) {
      if (token?.sub && session.user) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
  // You can customize pages or theme here if desired
};

// In App Router, use this with NextAuth in route handlers:
// import NextAuth from "next-auth";
// const handler = NextAuth(authOptions);
// export { handler as GET, handler as POST };
