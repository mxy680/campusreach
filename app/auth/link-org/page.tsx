import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export default async function LinkOrgPage({ searchParams }: { searchParams: { orgId?: string } }) {
  const orgId = searchParams?.orgId
  if (!orgId) redirect("/org/settings")

  const session = await getServerSession(authOptions)
  const currentUrl = `/auth/link-org?orgId=${encodeURIComponent(orgId!)}`

  // If not authenticated, send to Google sign-in and return here
  if (!session?.user?.id) {
    redirect(`/api/auth/signin/google?callbackUrl=${encodeURIComponent(currentUrl)}`)
  }

  // Authenticated: validate org and user exist in this database
  const org = await prisma.organization.findUnique({ where: { id: orgId! }, select: { id: true } })
  if (!org) {
    // The orgId in the invite doesn't exist in this environment/database
    redirect(`/org/settings?error=org_not_found`)
  }

  // Ensure the User row exists (adapter should create it on Google sign-in)
  let user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true } })
  if (!user && session.user.email) {
    // Fallback: try to find by email in case the JWT has an id from a different env
    const byEmail = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } })
    if (byEmail) {
      user = byEmail
    }
  }
  if (!user) {
    // Cannot proceed without a user row in this DB
    redirect(`/api/auth/signin/google?callbackUrl=${encodeURIComponent(currentUrl)}`)
  }

  // Link immediately on the server to the target org
  await prisma.organizationMember.upsert({
    where: { organizationId_userId: { organizationId: orgId!, userId: user!.id } },
    create: { organizationId: orgId!, userId: user!.id },
    update: {},
  })
  await prisma.user.update({ where: { id: user!.id }, data: { role: "ORGANIZATION", profileComplete: true } })

  redirect("/org/settings?linked=1")
}
