import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST /api/dev/backfill-groupchats
// Creates a GroupChat for any Event missing one and seeds a SYSTEM announcement if the chat has no messages.
export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // This endpoint is intended for local/dev use. If you need to restrict, add a guard here.

  const events = await prisma.event.findMany({ select: { id: true, title: true } })
  let createdChats = 0
  let seededMessages = 0
  for (const e of events) {
    let gc = await prisma.groupChat.findUnique({ where: { eventId: e.id } }).catch(() => null)
    if (!gc) {
      gc = await prisma.groupChat.create({ data: { eventId: e.id } })
      createdChats++
    }
    const hasMessage = await prisma.chatMessage.findFirst({ where: { groupChatId: gc.id } })
    if (!hasMessage) {
      await prisma.chatMessage.create({
        data: {
          groupChatId: gc.id,
          authorType: "SYSTEM",
          kind: "ANNOUNCEMENT",
          body: `Welcome to the group chat for "${e.title}"!`,
        },
      })
      seededMessages++
    }
  }

  return NextResponse.json({ ok: true, createdChats, seededMessages })
}
