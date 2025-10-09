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
    // Custom sign-in UI
    signIn: "/auth/signin",
    // Route all auth errors to org signup so users see a friendly message when attempting Google signup with an existing email
    error: "/auth/signup/organization",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // For OAuth, prevent auto-creating accounts for unknown emails.
      // Send them to signup with an error instead of proceeding to restricted pages.
      if (account?.provider === "google") {
        const email = (user?.email || (profile as { email?: string } | null | undefined)?.email || "").toLowerCase()
        if (email) {
          const existing = await prisma.user.findUnique({ where: { email } })
          if (!existing) {
            // Abort sign-in and redirect to signup with error message
            return "/auth/signup/organization?error=no_account"
          }
          // Best-effort: sync Google avatar for existing users lacking image
          try {
            const picture = (profile as { picture?: string } | null | undefined)?.picture
            if (!existing.image && picture) {
              await prisma.user.update({ where: { id: existing.id }, data: { image: picture } })
            }
          } catch (e) {
            console.warn("signIn avatar sync failed", e)
          }
        }
      }
      return true;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (token?.sub && session.user) {
        session.user.id = token.sub;
        const u = await prisma.user.findUnique({ where: { id: token.sub }, select: { image: true } })
        // Overwrite session image from DB every time (DB is source of truth)
        session.user.image = (u?.image ?? null)
      }
      return session;
    },
  },
};