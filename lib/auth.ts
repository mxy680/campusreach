import { type NextAuthOptions } from "next-auth";
import type { Adapter } from "next-auth/adapters";
import { PrismaAdapter } from "@auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import type { Session } from "next-auth";
import type { JWT } from "next-auth/jwt";

const providers: NextAuthOptions["providers"] = [
  GoogleProvider({
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    allowDangerousEmailAccountLinking: true,
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
    // Custom sign-out confirmation page
    signOut: "/auth/signout",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // For OAuth, prevent auto-creating accounts for unknown emails.
      // Send them to signup with an error instead of proceeding to restricted pages.
      if (account?.provider === "google") {
        const email = (user?.email || (profile as { email?: string } | null | undefined)?.email || "").toLowerCase()
        if (email) {
          const existing = await prisma.user.findUnique({ where: { email } })

          // Detect volunteer signup flow
          const c = await cookies()
          const isVolunteerSignup = c.get("signup_user")?.value === "1"
          const isCaseEmail = email.endsWith("@case.edu")
          const orgJoinOrgId = c.get("org_join_orgId")?.value || null
          const allowSignup = c.get("signup_intent")?.value === "1"

          // Determine if this email already has org access to bypass volunteer-domain enforcement
          let hasOrgAccess = false
          try {
            if (existing) {
              const member = await prisma.organizationMember.findFirst({ where: { userId: existing.id } })
              const approved = await prisma.organizationJoinRequest.findFirst({ where: { userId: existing.id, status: "APPROVED" } })
              hasOrgAccess = !!(member || approved || existing.role === "ORGANIZATION")
            }
          } catch {}

          // Only enforce volunteer school domain when NOT in an organization flow
          if (isVolunteerSignup && !allowSignup && !orgJoinOrgId && !hasOrgAccess) {
            // Enforce school domain
            if (!isCaseEmail) {
              // Show restricted page; actual deletion happens on restricted sign-out action
              return "/restricted"
            }

            // Valid school email: allow sign in. If existing, just continue.
            // If new, NextAuth will create via adapter; role defaults to VOLUNTEER, profileComplete=false.
            // The signup page sets callbackUrl to the survey profile page.
            return true
          }

          // Organization join flow: create/ensure user, set role=ORGANIZATION, create join request if needed.
          // If user already has ANY approved org access (member or approved request), allow normal sign-in.
          if (orgJoinOrgId) {
            // Ensure a user exists; if it doesn't, allow adapter to have created it; if still missing, create manually
            let userId = existing?.id
            if (!userId) {
              const created = await prisma.user.findUnique({ where: { email } })
              if (created) userId = created.id
              else {
                const u = await prisma.user.create({
                  data: {
                    email,
                    name: user?.name || null,
                    image: (profile as { picture?: string } | null | undefined)?.picture || null,
                    role: "ORGANIZATION",
                    profileComplete: false,
                  },
                })
                userId = u.id
              }
            }
            // If already a member or approved for ANY org, allow normal sign-in and clear cookie
            try {
              const anyMember = await prisma.organizationMember.findFirst({ where: { userId: userId! } })
              const anyApproved = await prisma.organizationJoinRequest.findFirst({ where: { userId: userId!, status: "APPROVED" } })
              if (anyMember || anyApproved) {
                try { (await cookies()).set("org_join_orgId", "", { maxAge: 0, path: "/" }) } catch {}
                return true
              }
            } catch {}
            const orgId = orgJoinOrgId
            // Ensure role is ORGANIZATION
            if (userId && existing?.role !== "ORGANIZATION") {
              try { await prisma.user.update({ where: { id: userId }, data: { role: "ORGANIZATION" } }) } catch {}
            }
            // Create join request if not already present/pending
            try {
              const alreadyPending = await prisma.organizationJoinRequest.findFirst({
                where: { organizationId: orgId, userId: userId!, status: "PENDING" },
              })
              if (!alreadyPending && userId) {
                await prisma.organizationJoinRequest.create({
                  data: { organizationId: orgId, userId, status: "PENDING" },
                })
              }
            } catch {}
            // Force sign-out and return to org signup with success toast param (no UI page)
            return "/auth/signout/auto?callbackUrl=" + encodeURIComponent("/auth/signup/organization?joined=1")
          }

          // If user has any pending join requests but no approved access, block sign-in and send back to sign-in with error
          try {
            if (existing) {
              const anyMember = await prisma.organizationMember.findFirst({ where: { userId: existing.id } })
              const anyApproved = await prisma.organizationJoinRequest.findFirst({ where: { userId: existing.id, status: "APPROVED" } })
              if (!anyMember && !anyApproved) {
                const anyPending = await prisma.organizationJoinRequest.findFirst({ where: { userId: existing.id, status: "PENDING" } })
                if (anyPending) {
                  try { (await cookies()).set("org_join_orgId", "", { maxAge: 0, path: "/" }) } catch {}
                  return "/auth/signin?error=org_pending"
                }
              }
            }
          } catch {}

          // Organization/general flow: do NOT allow auto-creation.
          // If not an existing user and no explicit signup intent, remove any accidental creation and redirect to volunteer signup.
          if (!existing && !allowSignup) {
            // In some adapter flows, the user may have been created already; ensure we remove it.
            try {
              const created = await prisma.user.findUnique({ where: { email } })
              if (created) {
                await prisma.user.delete({ where: { id: created.id } })
              }
            } catch {}
            return "/auth/signup/user?error=no_account"
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