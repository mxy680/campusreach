import { type NextAuthOptions } from "next-auth";
import type { Adapter } from "next-auth/adapters";
import { PrismaAdapter } from "@auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import type { Session } from "next-auth";
import type { JWT } from "next-auth/jwt";

const providers: NextAuthOptions["providers"] = [
  GoogleProvider({
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  }),
];

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  session: { strategy: "jwt" },
  providers,
  pages: {
    // Route all auth errors to org signup so users see a friendly message when attempting Google signup with an existing email
    error: "/auth/signup/organization",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Allow Google sign-in for any domain
      // Also, if signing in with Google and user has no image yet, save Google's avatar as default
      try {
        if (account?.provider === "google") {
          const picture = (profile as { picture?: string } | null | undefined)?.picture
          if (user?.id && picture) {
            const existing = await prisma.user.findUnique({ where: { id: user.id }, select: { image: true } })
            if (existing && !existing.image) {
              await prisma.user.update({ where: { id: user.id }, data: { image: picture } })
            }
          }
        }
      } catch (e) {
        // Non-blocking: even if this fails, we still allow the sign-in
        console.warn("signIn avatar sync failed", e)
      }
      return true;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (token?.sub && session.user) {
        session.user.id = token.sub;
        const u = await prisma.user.findUnique({ where: { id: token.sub }, select: { image: true } })
        // Overwrite session image from DB every time (DB is source of truth)
        session.user.image = u?.image ?? null as any
      }
      return session;
    },
  },
};