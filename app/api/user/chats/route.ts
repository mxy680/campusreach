import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/user/chats
// Returns chats for events the current user has signed up for (as a volunteer)
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Find events where the user has a signup
  const events = await prisma.event.findMany({
    where: {
      signups: {
        some: {
          volunteer: { userId: session.user.id },
        },
      },
    },
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
      const [last, messageCount] = await Promise.all([
        gc
          ? prisma.chatMessage.findFirst({
              where: { groupChatId: gc.id },
              orderBy: { createdAt: "desc" },
              select: {
                id: true,
                createdAt: true,
                kind: true,
                body: true,
                user: { select: { id: true, name: true } },
              },
            })
          : Promise.resolve(null),
        gc ? prisma.chatMessage.count({ where: { groupChatId: gc.id } }) : Promise.resolve(0),
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
              author: last.user?.name ?? "",
            }
          : null,
      }
    })
  )

  return NextResponse.json({ data: rows })
}
