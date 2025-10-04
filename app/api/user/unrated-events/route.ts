import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/user/unrated-events
// List past events the signed-in user joined but has not rated yet
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { volunteer: { select: { id: true } } } })
  const volunteerId = user?.volunteer?.id
  if (!volunteerId) return NextResponse.json({ data: [] })

  const now = new Date()

  // Find events the user signed up for that have ended (or started already if endsAt is null) and are not rated yet by this volunteer
  const signups = await prisma.eventSignup.findMany({
    where: { volunteerId },
    select: { eventId: true },
    take: 200,
  })
  const eventIds = signups.map((s) => s.eventId)
  if (eventIds.length === 0) return NextResponse.json({ data: [] })

  const rated: Array<{ eventId: string }> = await prisma.eventRating.findMany({
    where: { volunteerId, eventId: { in: eventIds } },
    select: { eventId: true },
  })
  const ratedIds = new Set<string>(rated.map((r) => r.eventId))

  const events = await prisma.event.findMany({
    where: {
      id: { in: eventIds.filter((id) => !ratedIds.has(id)) },
      OR: [
        { endsAt: { lt: now } },
        { AND: [{ endsAt: null }, { startsAt: { lt: now } }] },
      ],
    },
    orderBy: { startsAt: "desc" },
    take: 50,
    select: {
      id: true,
      title: true,
      startsAt: true,
      endsAt: true,
      organization: { select: { name: true } },
    },
  })

  const data = events.map((e) => ({
    id: e.id,
    title: e.title,
    org: e.organization?.name ?? "",
    when: (e.endsAt ?? e.startsAt).toISOString(),
  }))

  return NextResponse.json({ data })
}
