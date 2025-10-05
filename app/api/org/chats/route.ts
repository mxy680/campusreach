import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/org/chats
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Find organizations the user can manage
  const orgMemberships: Array<{ organizationId: string }> = await prisma.organizationMember.findMany({
    where: { userId: session.user.id },
    select: { organizationId: true },
  })
  let orgIds = orgMemberships.map((m) => m.organizationId)

  // Fallback: derive org by matching user's email to organization.email or contactEmail
  if (orgIds.length === 0) {
    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { email: true } })
    if (user?.email) {
      const orgs: Array<{ id: string }> = await prisma.organization.findMany({
        where: { OR: [ { email: user.email }, { contactEmail: user.email } ] },
        select: { id: true },
        take: 5,
      })
      orgIds = orgs.map((o: { id: string }) => o.id)
    }
    if (orgIds.length === 0) return NextResponse.json({ data: [] })
  }

  // Find recent events for these orgs
  const events: Array<{
    id: string;
    title: string;
    startsAt: Date;
    endsAt: Date | null;
    organization: { id: string; name: string | null; slug: string | null; logoUrl: string | null } | null;
  }> = await prisma.event.findMany({
    where: { organizationId: { in: orgIds } },
    orderBy: { startsAt: "desc" },
    take: 100,
    select: {
      id: true,
      title: true,
      startsAt: true,
      endsAt: true,
      organization: { select: { id: true, name: true, slug: true, logoUrl: true } },
    },
  })

  const rows = await Promise.all(
    events.map(async (e) => {
      const gc = await prisma.groupChat.findUnique({ where: { eventId: e.id } })
      const [last, messageCount, orgMemberIds] = await Promise.all([
        gc
          ? prisma.chatMessage.findFirst({
              where: { groupChatId: gc.id },
              orderBy: { createdAt: "desc" },
              select: {
                id: true,
                createdAt: true,
                kind: true,
                body: true,
                userId: true,
                user: { select: { id: true, name: true } },
              },
            })
          : Promise.resolve(null),
        gc ? prisma.chatMessage.count({ where: { groupChatId: gc.id } }) : Promise.resolve(0),
        e.organization?.id
          ? prisma.organizationMember
              .findMany({ where: { organizationId: e.organization.id }, select: { userId: true }, take: 10000 })
              .then((ms: Array<{ userId: string }>) => new Set(ms.map((m: { userId: string }) => m.userId)))
          : Promise.resolve(new Set<string>()),
      ])

      return {
        id: e.id,
        title: e.title,
        start: e.startsAt.toISOString(),
        end: e.endsAt ? e.endsAt.toISOString() : null,
        orgName: e.organization?.name ?? "",
        orgSlug: e.organization?.slug ?? null,
        orgLogo: e.organization?.logoUrl ?? null,
        messageCount,
        last: last
          ? {
              id: last.id,
              createdAt: last.createdAt.toISOString(),
              kind: last.kind,
              body: last.body,
              author:
                last.userId && orgMemberIds instanceof Set && orgMemberIds.has(last.userId)
                  ? e.organization?.name ?? ""
                  : last.user?.name ?? "",
            }
          : null,
      }
    })
  )

  return NextResponse.json({ data: rows })
}
