import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

type Row = {
  id: string
  name: string
  email: string
  subject: string
  date: string // ISO
  teaser: string
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function POST(_req: NextRequest) {
  // This endpoint is not implemented for the new GroupChat system.
  // Use /api/org/events/[eventId]/chat to send messages.
  return NextResponse.json({ error: "Not implemented" }, { status: 501 })
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const email = searchParams.get("email")
  if (!email) return NextResponse.json({ error: "Missing email" }, { status: 400 })

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } })
  if (!user) return NextResponse.json({ data: [] as Row[] })

  // Build previews from event group chats the user is signed up for
  const signups = await prisma.eventSignup.findMany({
    where: { volunteer: { userId: user.id } },
    select: { eventId: true },
    take: 25,
  })
  const eventIds = signups.map((s) => s.eventId)
  if (eventIds.length === 0) return NextResponse.json({ data: [] as Row[] })

  const events = await prisma.event.findMany({
    where: { id: { in: eventIds } },
    orderBy: { startsAt: "desc" },
    take: 3,
    select: {
      id: true,
      title: true,
      startsAt: true,
      organization: { select: { name: true, contactEmail: true } },
      groupChat: { select: { id: true } },
    },
  })

  const rows: Row[] = []
  for (const e of events) {
    if (!e.groupChat) continue
    const last = await prisma.chatMessage.findFirst({
      where: { groupChatId: e.groupChat.id },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true, body: true },
    })
    rows.push({
      id: e.id,
      name: e.organization?.name ?? "Event Chat",
      email: e.organization?.contactEmail ?? "",
      subject: e.title,
      date: (last?.createdAt ?? e.startsAt).toISOString(),
      teaser: last?.body ?? "",
    })
  }

  return NextResponse.json({ data: rows })
}
