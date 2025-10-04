import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST /api/user/events/[eventId]/rating
// body: { rating: number (1-5), comment?: string }
export async function POST(req: NextRequest, context: { params: Promise<{ eventId: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { eventId } = await context.params
  const { rating, comment } = (await req.json().catch(() => ({}))) as { rating?: number; comment?: string }
  const r = Number(rating)
  if (!Number.isFinite(r) || r < 1 || r > 5) {
    return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 })
  }

  // Must be a volunteer and signed up for the event
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { volunteer: { select: { id: true } } } })
  const volunteerId = user?.volunteer?.id
  if (!volunteerId) return NextResponse.json({ error: "Not a volunteer" }, { status: 403 })

  const signup = await prisma.eventSignup.findFirst({ where: { eventId, volunteerId }, select: { id: true } })
  if (!signup) return NextResponse.json({ error: "Not joined" }, { status: 403 })

  // Event must be over (endsAt < now OR endsAt null and startsAt < now)
  const now = new Date()
  const ev = await prisma.event.findUnique({ where: { id: eventId }, select: { startsAt: true, endsAt: true } })
  if (!ev) return NextResponse.json({ error: "Event not found" }, { status: 404 })
  const isOver = (ev.endsAt ? ev.endsAt < now : ev.startsAt < now)
  if (!isOver) return NextResponse.json({ error: "Event not over" }, { status: 400 })

  // Upsert rating
  const saved = await prisma.eventRating.upsert({
    where: { eventId_volunteerId: { eventId, volunteerId } },
    create: { eventId, volunteerId, rating: r, comment: comment?.trim() || null },
    update: { rating: r, comment: comment?.trim() || null },
    select: { id: true, rating: true, comment: true, eventId: true, volunteerId: true },
  })

  return NextResponse.json({ ok: true, data: saved })
}
