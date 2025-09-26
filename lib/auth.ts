import { type NextAuthOptions } from "next-auth";
import type { Adapter, AdapterUser } from "next-auth/adapters";
import { PrismaAdapter } from "@auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { Session } from "next-auth";
import type { JWT } from "next-auth/jwt";

const providers: NextAuthOptions["providers"] = [
  GoogleProvider({
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  }),
  CredentialsProvider({
    name: "Credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) return null;

      const user = await prisma.user.findUnique({ where: { email: credentials.email.toLowerCase() } });
      if (!user || !user.hashedPassword) return null;

      const ok = await bcrypt.compare(credentials.password, user.hashedPassword);
      if (!ok) return null;

      return {
        id: user.id,
        email: user.email,
        name: user.name ?? null,
        image: user.image ?? null,
      } as AdapterUser;
    },
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
    async signIn() {
      // Allow Google sign-in for any domain
      return true;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (token?.sub && session.user) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
};