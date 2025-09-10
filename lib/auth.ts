import { type NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import EmailProvider from "next-auth/providers/email";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";

// Build providers conditionally based on env
const providers = [] as NextAuthOptions["providers"];

// Email magic link via SMTP (set EMAIL_SERVER and EMAIL_FROM in env)
if (process.env.EMAIL_SERVER && process.env.EMAIL_FROM) {
  providers.push(
    EmailProvider({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM,
    })
  );
}

// Google OAuth (set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET)
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  session: { strategy: "jwt" },
  providers,
  callbacks: {
    async session({ session, token }) {
      if (token?.sub) {
        (session as any).userId = token.sub;
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
