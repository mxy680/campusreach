import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Returns recent conversations for the organization of the signed-in org user
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Resolve organization: prefer membership; fallback to email heuristic
  let orgId: string | null = null
  const member = await prisma.organizationMember.findFirst({ where: { userId: session.user.id }, select: { organizationId: true } })
  if (member?.organizationId) {
    orgId = member.organizationId
  } else {
    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { email: true } })
    if (user?.email) {
      const org = await prisma.organization.findFirst({ where: { email: user.email }, select: { id: true } })
      orgId = org?.id ?? null
    }
  }
  if (!orgId) return NextResponse.json({ data: [] })

  const msgs = await prisma.chatMessage.findMany({
    where: { event: { organizationId: orgId } },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      user: { select: { name: true, email: true } },
      event: { select: { title: true } },
    },
  })

  const rows = msgs.map((m) => ({
    id: m.id,
    name: m.user?.name ?? "Volunteer",
    email: m.user?.email ?? "",
    subject: m.event?.title ?? "Event",
    date: m.createdAt.toISOString(),
    teaser: m.body,
  }))

  return NextResponse.json({ data: rows })
}
