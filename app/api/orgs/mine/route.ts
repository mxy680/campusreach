import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const userId = session.user.id

  // Orgs the user can manage: member OR approved join request
  const memberOrgs = await prisma.organizationMember.findMany({
    where: { userId },
    select: { organizationId: true, organization: { select: { id: true, name: true, slug: true } } },
  })
  const approvedOrgs = await prisma.organizationJoinRequest.findMany({
    where: { userId, status: "APPROVED" },
    select: { organizationId: true, organization: { select: { id: true, name: true, slug: true } } },
  })

  const map = new Map<string, { id: string; name: string; slug: string | null }>()
  for (const m of memberOrgs) {
    if (m.organization) map.set(m.organizationId, m.organization)
  }
  for (const a of approvedOrgs) {
    if (a.organization) map.set(a.organizationId, a.organization)
  }

  return NextResponse.json({ data: Array.from(map.values()) })
}
